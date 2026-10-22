import { create } from 'zustand';
import { SCENE_COUNT, clampIndex } from '@/data/scenes';

export type Phase = 'idle' | 'transition';

export interface PresentationState {
  /** Текущая (целевая) сцена. */
  index: number;
  /** Уходящая сцена во время перехода, иначе null. */
  from: number | null;
  /** 1 — вперёд, -1 — назад. */
  direction: 1 | -1;
  phase: Phase;
  /** Сцена встала на место и полностью читаема: можно запускать графики. */
  ready: boolean;
  /** Счётчик переходов — ключ для таймлайнов GSAP. */
  transitionId: number;
  /** Переход без анимации (первая загрузка, reduced motion, восстановление из URL). */
  instant: boolean;
  menuOpen: boolean;

  go: (target: number, options?: { instant?: boolean }) => boolean;
  next: () => boolean;
  prev: () => boolean;
  first: () => boolean;
  last: () => boolean;
  completeTransition: (id: number) => void;
  setMenuOpen: (open: boolean) => void;
}

function readInitialIndex(): number {
  if (typeof window === 'undefined') return 0;
  const fromQuery = new URLSearchParams(window.location.search).get('scene');
  const fromHash = window.location.hash.match(/^#\/?(\d{1,2})$/)?.[1];
  const raw = Number(fromQuery ?? fromHash ?? '1');
  return Number.isFinite(raw) ? clampIndex(Math.round(raw) - 1) : 0;
}

export const usePresentation = create<PresentationState>((set, get) => ({
  index: readInitialIndex(),
  from: null,
  direction: 1,
  phase: 'idle',
  ready: false,
  transitionId: 0,
  instant: true,
  menuOpen: false,

  go: (target, options) => {
    const state = get();
    const to = clampIndex(target);
    // Во время перехода команды блокируются — двойной клик не пропускает сцены.
    if (state.phase !== 'idle' || to === state.index) return false;
    set({
      from: state.index,
      index: to,
      direction: to > state.index ? 1 : -1,
      phase: 'transition',
      ready: false,
      instant: Boolean(options?.instant),
      transitionId: state.transitionId + 1,
    });
    return true;
  },
  next: () => get().go(get().index + 1),
  prev: () => get().go(get().index - 1),
  first: () => get().go(0),
  last: () => get().go(SCENE_COUNT - 1),

  completeTransition: (id) => {
    if (get().transitionId !== id) return;
    set({ from: null, phase: 'idle', ready: true, instant: false });
  },

  setMenuOpen: (open) => set({ menuOpen: open }),
}));
