/**
 * Единая система таймингов переходов. Камера (WebGL) и слой контента (DOM)
 * читают одни и те же константы, поэтому движутся синхронно.
 */
export const TRANSITION = {
  /** Уход текущей сцены в глубину. */
  out: 0.5,
  /** Перелёт камеры. */
  camera: 1.25,
  /** Когда начинает проявляться следующая сцена (от старта перехода). */
  inDelay: 0.55,
  /** Длительность появления следующей сцены. */
  in: 0.75,
  /** Укороченный переход при prefers-reduced-motion. */
  reduced: 0.28,
} as const;

export const TRANSITION_TOTAL = TRANSITION.inDelay + TRANSITION.in; // ≈ 1.3 с

/**
 * Облегчённый переход для телефонов (src/app/deviceTier.ts): короче и без масштабирования —
 * слой сцены только сдвигается и проявляется, поэтому не перерастеризуется в каждом кадре.
 */
export const TRANSITION_LITE = {
  out: 0.32,
  camera: 1.0,
  inDelay: 0.34,
  in: 0.56,
  /** Сдвиг слоя по горизонтали, % ширины. */
  shift: 4,
} as const; // переход ≈ 0.9 с, перелёт камеры 1 с

export const EASE = {
  out: 'power2.in',
  in: 'power3.out',
  camera: 'power2.inOut',
} as const;
