/**
 * Ретранслятор пульта докладчика: телефон ↔ презентация на другом устройстве.
 *
 * Презентация публикует номер сцены и забирает команды; телефон читает номер сцены
 * и отправляет команды «далее/назад/перейти». Оба опрашивают этот адрес — сервер
 * WebSocket не нужен, работает на любом бессерверном хостинге с Web API.
 *
 * Хранилище:
 * - Upstash Redis (бесплатный план), если заданы KV_REST_API_URL + KV_REST_API_TOKEN
 *   (их создаёт интеграция Upstash в Vercel) или UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN;
 * - иначе — память экземпляра функции: для пробы хватает, но при перезапуске экземпляра
 *   связь может прерываться.
 *
 * Тот же обработчик с хранилищем в памяти обслуживает /api/remote в `vite dev` и
 * `vite preview` (vite.config.ts) — так пульт работает и в локальной сети без интернета.
 */

export type RedisCommand = (string | number)[];

export interface RemoteStore {
  kind: 'redis' | 'memory';
  /** Выполняет команды Redis по порядку (одним запросом) и возвращает их результаты. */
  exec(commands: RedisCommand[]): Promise<unknown[]>;
}

const ROOM = /^\d{6}$/;
/** Сколько живёт комната после последней публикации презентации, с. */
const ROOM_TTL = 6 * 60 * 60;
/** Устройство считается на связи, если опрашивало сервер за последние N секунд. */
const PRESENCE_TTL = 12;
/** Команды старше этого возраста не выполняются (телефон нажимал, пока презентация была офлайн), мс. */
const COMMAND_MAX_AGE = 8000;
const MAX_BODY = 2048;
const MAX_INDEX = 99;
const ACTIONS = ['next', 'prev', 'first', 'last'] as const;

export interface RemoteState {
  index: number;
  transitioning: boolean;
  /** Идентификатор вкладки презентации (перезагрузка — новый sid). */
  sid: string;
  /** Номер версии состояния внутри sid. */
  v: number;
  /** Время сервера, мс. */
  at: number;
}

export type RemoteCommand =
  | { id: string; type: 'command'; action: (typeof ACTIONS)[number]; at: number }
  | { id: string; type: 'goto'; index: number; at: number };

const isId = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,40}$/.test(v);
const isIndex = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= MAX_INDEX;

function readState(input: unknown, at: number): RemoteState | null {
  if (!input || typeof input !== 'object') return null;
  const s = input as Record<string, unknown>;
  if (!isIndex(s.index) || typeof s.transitioning !== 'boolean' || !isId(s.sid) || !Number.isInteger(s.v)) return null;
  return { index: s.index, transitioning: s.transitioning, sid: s.sid, v: s.v as number, at };
}

function readCommand(input: unknown, at: number): RemoteCommand | null {
  if (!input || typeof input !== 'object') return null;
  const c = input as Record<string, unknown>;
  if (!isId(c.id)) return null;
  if (c.type === 'command' && ACTIONS.includes(c.action as (typeof ACTIONS)[number])) {
    return { id: c.id, type: 'command', action: c.action as (typeof ACTIONS)[number], at };
  }
  if (c.type === 'goto' && isIndex(c.index)) return { id: c.id, type: 'goto', index: c.index, at };
  return null;
}

function parseJson<T>(raw: unknown): T | null {
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/**
 * GET  ?health                      → { ok, store }
 * GET  ?room=123456&role=presenter  → { ok, commands, peer } — забирает команды телефона
 * GET  ?room=123456&role=phone      → { ok, state, peer }    — текущая сцена презентации
 * POST ?room=123456&role=presenter  { state }   — публикует сцену
 * POST ?room=123456&role=phone      { command } — ставит команду в очередь
 * `peer` — второе устройство опрашивало сервер в последние PRESENCE_TTL секунд.
 */
export function createRemoteHandler(store: RemoteStore, clock: () => number = Date.now) {
  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.searchParams.has('health')) return json({ ok: true, store: store.kind });

    const room = url.searchParams.get('room') ?? '';
    const role = url.searchParams.get('role');
    if (!ROOM.test(room) || (role !== 'presenter' && role !== 'phone')) return json({ ok: false, error: 'bad-request' }, 400);
    const key = (name: string) => `fx:remote:${room}:${name}`;
    const peer = role === 'presenter' ? 'phone' : 'presenter';
    const now = clock();
    const touch: RedisCommand = ['SET', key(`seen:${role}`), now, 'EX', PRESENCE_TTL];

    try {
      if (request.method === 'GET') {
        if (role === 'presenter') {
          const [popped, , seen] = await store.exec([['LPOP', key('cmd'), 20], touch, ['GET', key(`seen:${peer}`)]]);
          const commands = (Array.isArray(popped) ? popped : [])
            .map((raw) => parseJson<RemoteCommand>(raw))
            .filter((c): c is RemoteCommand => c !== null && now - c.at < COMMAND_MAX_AGE);
          return json({ ok: true, commands, peer: seen !== null && seen !== undefined });
        }
        const [state, , seen] = await store.exec([['GET', key('state')], touch, ['GET', key(`seen:${peer}`)]]);
        return json({ ok: true, state: parseJson<RemoteState>(state), peer: seen !== null && seen !== undefined });
      }

      if (request.method === 'POST') {
        const text = await request.text();
        if (text.length > MAX_BODY) return json({ ok: false, error: 'too-large' }, 413);
        const body = parseJson<Record<string, unknown>>(text) ?? {};
        if (role === 'presenter') {
          const state = readState(body.state, now);
          if (!state) return json({ ok: false, error: 'bad-state' }, 400);
          await store.exec([['SET', key('state'), JSON.stringify(state), 'EX', ROOM_TTL], touch]);
          return json({ ok: true });
        }
        const command = readCommand(body.command, now);
        if (!command) return json({ ok: false, error: 'bad-command' }, 400);
        await store.exec([
          ['RPUSH', key('cmd'), JSON.stringify(command)],
          ['LTRIM', key('cmd'), -20, -1],
          ['EXPIRE', key('cmd'), 60],
          touch,
        ]);
        return json({ ok: true });
      }

      return json({ ok: false, error: 'method-not-allowed' }, 405);
    } catch {
      return json({ ok: false, error: 'store-unavailable' }, 503);
    }
  };
}

/** Хранилище в памяти процесса: подмножество команд Redis, которое использует обработчик. */
export function memoryStore(now: () => number = Date.now): RemoteStore {
  const data = new Map<string, { value: string | string[]; expires: number }>();
  const live = (key: string) => {
    const entry = data.get(key);
    if (entry && entry.expires <= now()) {
      data.delete(key);
      return undefined;
    }
    return entry;
  };
  const run = ([name, rawKey, ...args]: RedisCommand): unknown => {
    const key = String(rawKey);
    switch (String(name).toUpperCase()) {
      case 'GET': {
        const entry = live(key);
        return typeof entry?.value === 'string' ? entry.value : null;
      }
      case 'SET': {
        const ex = String(args[1]).toUpperCase() === 'EX' ? Number(args[2]) : 0;
        data.set(key, { value: String(args[0]), expires: ex ? now() + ex * 1000 : Infinity });
        return 'OK';
      }
      case 'RPUSH': {
        const entry = live(key);
        const list = Array.isArray(entry?.value) ? entry.value : [];
        list.push(...args.map(String));
        data.set(key, { value: list, expires: entry?.expires ?? Infinity });
        return list.length;
      }
      case 'LPOP': {
        const entry = live(key);
        if (!Array.isArray(entry?.value)) return null;
        const out = entry.value.splice(0, args.length ? Number(args[0]) : 1);
        if (entry.value.length === 0) data.delete(key);
        return args.length ? out : (out[0] ?? null);
      }
      case 'LTRIM': {
        const entry = live(key);
        if (!Array.isArray(entry?.value)) return 'OK';
        const len = entry.value.length;
        const norm = (i: number) => (i < 0 ? Math.max(0, len + i) : Math.min(i, len - 1));
        entry.value = entry.value.slice(norm(Number(args[0])), norm(Number(args[1])) + 1);
        return 'OK';
      }
      case 'EXPIRE': {
        const entry = live(key);
        if (!entry) return 0;
        entry.expires = now() + Number(args[0]) * 1000;
        return 1;
      }
      default:
        throw new Error(`memoryStore: команда ${String(name)} не поддерживается`);
    }
  };
  return {
    kind: 'memory',
    async exec(commands) {
      if (data.size > 2000) for (const key of [...data.keys()]) live(key);
      return commands.map(run);
    },
  };
}

/** Upstash Redis через REST (без SDK): один запрос /pipeline на вызов. */
export function upstashStore(baseUrl: string, token: string): RemoteStore {
  return {
    kind: 'redis',
    async exec(commands) {
      const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(commands),
      });
      if (!response.ok) throw new Error(`Upstash: HTTP ${response.status}`);
      const results = (await response.json()) as { result?: unknown; error?: string }[];
      return results.map((r) => {
        if (r.error) throw new Error(`Upstash: ${r.error}`);
        return r.result ?? null;
      });
    },
  };
}

// --- Vercel Function (Node.js, Web API) ---

let vercelHandle: ((request: Request) => Promise<Response>) | null = null;

function handler() {
  if (!vercelHandle) {
    const env = process.env;
    const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
    const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
    vercelHandle = createRemoteHandler(url && token ? upstashStore(url, token) : memoryStore());
  }
  return vercelHandle;
}

export function GET(request: Request): Promise<Response> {
  return handler()(request);
}

export function POST(request: Request): Promise<Response> {
  return handler()(request);
}
