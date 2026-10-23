import { create } from 'zustand';
import { usePresentation } from '@/app/store';
import {
  createRoomCode,
  pollCommands,
  publishState,
  randomId,
  relayHealth,
  ROOM_PATTERN,
  type RemoteCommand,
  type StoreKind,
} from './relay';

/**
 * Пульт на телефоне — сторона презентации: публикует номер сцены в комнату
 * и выполняет команды телефона. Включается из окна «Пульт» (кнопка в верхней панели, P)
 * и переживает перезагрузку страницы (код комнаты хранится 6 часов).
 */

export type RemoteStatus = 'off' | 'checking' | 'unavailable' | 'connecting' | 'online' | 'error';

interface RemoteUiState {
  room: string | null;
  status: RemoteStatus;
  store: StoreKind | null;
  phoneOnline: boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export const useRemote = create<RemoteUiState>((set) => ({
  room: null,
  status: 'off',
  store: null,
  phoneOnline: false,
  dialogOpen: false,
  setDialogOpen: (open) => set({ dialogOpen: open }),
}));

const STORAGE_KEY = 'footurex-remote-room';
const ROOM_MAX_AGE = 6 * 60 * 60 * 1000;

function loadRoom(): string | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as { room?: string; savedAt?: number } | null;
    if (saved?.room && ROOM_PATTERN.test(saved.room) && Date.now() - (saved.savedAt ?? 0) < ROOM_MAX_AGE) return saved.room;
  } catch {
    /* хранилище недоступно — начнём с новым кодом */
  }
  return null;
}

function saveRoom(room: string | null) {
  try {
    if (room) localStorage.setItem(STORAGE_KEY, JSON.stringify({ room, savedAt: Date.now() }));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* не критично */
  }
}

function applyCommand(command: RemoteCommand) {
  const store = usePresentation.getState();
  if (store.menuOpen) store.setMenuOpen(false);
  if (command.type === 'goto') store.go(command.index);
  else store[command.action]();
}

let session: { stop: () => void } | null = null;
/** Поколение включения: устаревшая асинхронная проверка не запускает второй сеанс. */
let generation = 0;

/** Опрос команд и публикация сцены для одной комнаты. */
function startSession(room: string) {
  let stopped = false;
  let timer = 0;
  let failures = 0;
  let lastPhoneAt = 0;
  const sid = randomId();
  let version = 0;
  const done = new Set<string>();

  // Публикация: последовательно и всегда с последним состоянием.
  let publishing = false;
  let dirty = true;
  const publish = async () => {
    dirty = true;
    if (publishing) return;
    publishing = true;
    while (dirty && !stopped) {
      dirty = false;
      const { index, phase } = usePresentation.getState();
      try {
        await publishState(room, { index, transitioning: phase !== 'idle', sid, v: ++version });
      } catch {
        // повторит сердцебиение
      }
    }
    publishing = false;
  };
  const unsubscribe = usePresentation.subscribe((state, prev) => {
    if (state.index !== prev.index || state.phase !== prev.phase) void publish();
  });
  // Сердцебиение: восстанавливает состояние, если хранилище в памяти перезапустилось.
  const heartbeat = window.setInterval(() => void publish(), 10_000);

  const poll = async () => {
    if (stopped) return;
    try {
      const { commands, peer } = await pollCommands(room);
      if (stopped) return;
      failures = 0;
      if (peer) lastPhoneAt = Date.now();
      for (const command of commands) {
        if (done.has(command.id)) continue;
        done.add(command.id);
        applyCommand(command);
      }
      if (done.size > 300) [...done].slice(0, 200).forEach((id) => done.delete(id));
      useRemote.setState({ status: 'online', phoneOnline: peer });
    } catch {
      if (stopped) return;
      failures += 1;
      useRemote.setState({ status: 'error', phoneOnline: false });
    }
    if (stopped) return;
    // Телефон на связи — опрашиваем часто; давно не появлялся — реже, чтобы не тратить лимиты.
    const { phoneOnline, dialogOpen } = useRemote.getState();
    const delay = failures
      ? Math.min(8000, 1000 * 2 ** (failures - 1))
      : phoneOnline
        ? 400
        : dialogOpen || Date.now() - lastPhoneAt < 120_000
          ? 1200
          : 4000;
    timer = window.setTimeout(poll, delay);
  };

  void publish();
  void poll();
  return {
    stop() {
      stopped = true;
      window.clearTimeout(timer);
      window.clearInterval(heartbeat);
      unsubscribe();
    },
  };
}

/** Включает пульт: проверяет ретранслятор и начинает обмен. fresh — новый код комнаты. */
export async function enableRemote(options: { room?: string; fresh?: boolean } = {}): Promise<void> {
  session?.stop();
  session = null;
  const gen = ++generation;
  const room = options.room ?? (options.fresh ? null : (useRemote.getState().room ?? loadRoom())) ?? createRoomCode();
  useRemote.setState({ room, status: 'checking', phoneOnline: false });
  const store = await relayHealth();
  if (gen !== generation) return; // за время проверки пульт выключили или включили заново
  if (!store) {
    useRemote.setState({ status: 'unavailable', store: null });
    return;
  }
  saveRoom(room);
  useRemote.setState({ status: 'connecting', store });
  session = startSession(room);
}

export function disableRemote(): void {
  generation += 1;
  session?.stop();
  session = null;
  saveRoom(null);
  useRemote.setState({ room: null, status: 'off', store: null, phoneOnline: false });
}

/** После перезагрузки страницы восстанавливает пульт, если он был включён. */
export function resumeRemote(): void {
  const room = loadRoom();
  if (room && useRemote.getState().status === 'off') void enableRemote({ room });
}

export function toggleRemoteDialog(): void {
  const { dialogOpen, setDialogOpen } = useRemote.getState();
  setDialogOpen(!dialogOpen);
}
