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

export const EASE = {
  out: 'power2.in',
  in: 'power3.out',
  camera: 'power2.inOut',
} as const;
