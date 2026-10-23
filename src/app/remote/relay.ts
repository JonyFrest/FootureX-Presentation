/**
 * Клиент ретранслятора пульта (api/remote.ts): общие типы, адреса и запросы.
 * Презентация и телефон находятся на разных устройствах и встречаются в «комнате» —
 * шестизначном коде, который презентация показывает вместе с QR-кодом.
 */

export const ROOM_PATTERN = /^\d{6}$/;

export type RemoteAction = 'next' | 'prev' | 'first' | 'last';

export interface RemoteState {
  index: number;
  transitioning: boolean;
  sid: string;
  v: number;
  at: number;
}

export type RemoteCommandInput = { type: 'command'; action: RemoteAction } | { type: 'goto'; index: number };
export type RemoteCommand = RemoteCommandInput & { id: string; at: number };

export type StoreKind = 'redis' | 'memory';

function endpoint(params: Record<string, string>): string {
  const url = new URL('api/remote', document.baseURI);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

async function request<T>(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), init?.timeoutMs ?? 6000);
  try {
    const response = await fetch(url, { ...init, cache: 'no-store', signal: controller.signal });
    const body = (await response.json().catch(() => null)) as (T & { ok?: boolean }) | null;
    if (!response.ok || !body?.ok) throw new Error(`relay: HTTP ${response.status}`);
    return body;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Есть ли ретранслятор на этом хостинге и какое у него хранилище; null — недоступен. */
export async function relayHealth(): Promise<StoreKind | null> {
  try {
    const body = await request<{ store: StoreKind }>(endpoint({ health: '1' }), { timeoutMs: 5000 });
    return body.store === 'redis' || body.store === 'memory' ? body.store : null;
  } catch {
    return null;
  }
}

export function pollCommands(room: string) {
  return request<{ commands: RemoteCommand[]; peer: boolean }>(endpoint({ room, role: 'presenter' }));
}

export function publishState(room: string, state: Omit<RemoteState, 'at'>) {
  return request<object>(endpoint({ room, role: 'presenter' }), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  });
}

export function pollState(room: string) {
  return request<{ state: RemoteState | null; peer: boolean }>(endpoint({ room, role: 'phone' }));
}

export function sendCommand(room: string, command: RemoteCommandInput) {
  return request<object>(endpoint({ room, role: 'phone' }), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: { ...command, id: randomId() } }),
  });
}

export function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('');
}

export function createRoomCode(): string {
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
}

/** Ссылка, которую открывает телефон (её же кодирует QR). */
export function speakerLink(room: string): string {
  const url = new URL(document.baseURI);
  url.search = `?speaker=1&room=${room}`;
  url.hash = '';
  return url.toString();
}

/** Открыта ли презентация по адресу, недоступному с телефона (localhost). */
export function isLoopbackHost(): boolean {
  return /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])$/.test(window.location.hostname);
}

export const formatRoom = (room: string) => `${room.slice(0, 3)} ${room.slice(3)}`;
