/**
 * Класс устройства для графики и анимаций — единственное место, где он определяется.
 *
 * 'low'  — телефон: сенсорный экран без мыши и короткая сторона экрана ≤ 600 px (в любой
 *          ориентации, поэтому поворот телефона класс не меняет). Плотность пикселей 2–3,
 *          слабый GPU, ограничения по батарее и нагреву: 3D-фон рисуется реже и с меньшей
 *          плотностью пикселей, стекло без backdrop-filter, переходы короче и без масштаба.
 * 'high' — ноутбук, проектор, планшет: всё как задумано.
 *
 * Проверка на любом устройстве: ?quality=low или ?quality=high.
 * Класс выставляется в <html data-perf="…"> для CSS (см. src/styles/index.css).
 */
export type DeviceTier = 'low' | 'high';

/** Короткая сторона экрана телефона (CSS px) — с запасом на крупные и складные модели. */
const PHONE_SHORT_SIDE = 600;

function detectTier(): DeviceTier {
  if (typeof window === 'undefined') return 'high';
  const forced = new URLSearchParams(window.location.search).get('quality');
  if (forced === 'low' || forced === 'high') return forced;
  const touchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const shortSide = Math.min(window.screen.width, window.screen.height);
  return touchOnly && shortSide <= PHONE_SHORT_SIDE ? 'low' : 'high';
}

export const DEVICE_TIER: DeviceTier = detectTier();

/** Облегчённый режим для телефонов. */
export const LOW_TIER = DEVICE_TIER === 'low';

if (typeof document !== 'undefined') document.documentElement.dataset.perf = DEVICE_TIER;
