import { usePresentation } from '@/app/store';

/**
 * Частота кадров 3D-фона в облегчённом режиме (телефоны): во время перехода между сценами
 * и перелёта камеры — каждый кадр экрана, в покое — не чаще IDLE_FPS. В покое фон движется
 * медленно (дрейф камеры, частицы, огни), 30 кадров/с ему хватает, а GPU работает вдвое меньше.
 */
export const IDLE_FPS = 30;
export const FULL_FPS = 60;

let fullRateUntil = 0;

/** Полная частота на ближайшие `seconds` секунд (перелёт камеры, вступительный наезд). */
export function requestFullRate(seconds: number): void {
  fullRateUntil = Math.max(fullRateUntil, performance.now() + seconds * 1000);
}

/** Сейчас нужна полная частота: идёт переход или камера в полёте. */
export function fullRateActive(now = performance.now()): boolean {
  return now < fullRateUntil || usePresentation.getState().phase !== 'idle';
}
