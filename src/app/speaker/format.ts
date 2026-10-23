import { SCENES, TOTAL_DURATION_SEC, pad2 } from '@/data/scenes';

/** Время мм:сс; отрицательное — со знаком минус. */
export function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(Math.abs(sec)));
  return `${sec < 0 ? '−' : ''}${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

/** Плановое время начала каждой сцены от начала выступления, с. */
export const PLANNED_START = SCENES.reduce<number[]>((acc, _s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].durationSec);
  return acc;
}, []);

/** Подсказка о темпе: опережение или отставание от плана к текущей сцене. */
export function paceLabel(elapsed: number, index: number, started: boolean, touch = false): string {
  if (!started) return touch ? 'Запустится с первым «Далее»' : 'Таймер не запущен — T или «Старт»';
  const delta = elapsed - PLANNED_START[index]; // > 0 — отстаём от плана
  if (delta > 20) return `Отставание от плана: ${fmt(delta)}`;
  if (delta < -20) return `Запас по времени: ${fmt(-delta)}`;
  return 'Идёте по графику';
}

export { TOTAL_DURATION_SEC };
