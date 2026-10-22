/**
 * Данные сцены 10 «Иерархическая структура работ», вычисленные из src/data/project.ts.
 */
import {
  BUFFER,
  CAPACITY,
  deliverableStats,
  LOAD,
  OPTIONAL_PACKAGE,
  PROJECT,
  WBS_TOTAL,
  WORK_PACKAGES,
  type DeliverableId,
  type WorkPackage,
} from '@/data/project';
import { chartPalette } from '@/styles/tokens';
import { fmtNum } from '../charter/kit';

/**
 * Доли в целых процентах с суммой ровно 100 (метод наибольших остатков):
 * каждая доля округляется вниз, недостающие проценты получают доли с наибольшей дробной частью.
 */
export function roundShares(values: readonly number[]): number[] {
  const total = values.reduce((s, v) => s + v, 0);
  if (total === 0) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const out = raw.map(Math.floor);
  const missing = 100 - out.reduce((s, v) => s + v, 0);
  raw
    .map((r, i) => ({ rest: r - out[i], i }))
    .sort((a, b) => b.rest - a.rest)
    .slice(0, missing)
    .forEach(({ i }) => (out[i] += 1));
  return out;
}

const SHARES = roundShares(deliverableStats.map((d) => d.estimate));

export const DELIVERABLE_VIEWS = deliverableStats.map((d, i) => ({
  ...d,
  sharePct: SHARES[i],
  color: chartPalette[i % chartPalette.length],
}));

export type DeliverableView = (typeof DELIVERABLE_VIEWS)[number];

export const MAX_DELIVERABLE = Math.max(...DELIVERABLE_VIEWS.map((d) => d.estimate));
export const MAX_PACKAGE = Math.max(...WORK_PACKAGES.map((p) => p.estimate));

export const colorOf = (id: DeliverableId) => DELIVERABLE_VIEWS.find((d) => d.id === id)?.color ?? chartPalette[0];

export const fmtSprints = (sprints: readonly number[]) => sprints.join(', ');

export const PACKAGE_FORMS = ['пакет работ', 'пакета работ', 'пакетов работ'] as const;
export const RESULT_FORMS = ['результат', 'результата', 'результатов'] as const;

/** Итоговая строка: работы, ёмкость, загрузка, буфер. */
export const SUMMARY_PARTS = [
  { id: 'work', value: `${fmtNum(WBS_TOTAL)} ид`, label: 'работ' },
  { id: 'cap', value: `${fmtNum(CAPACITY.min)}–${fmtNum(CAPACITY.max)} ид`, label: 'ёмкость' },
  { id: 'load', value: `${Math.round(LOAD.atMax)}–${Math.round(LOAD.atMin)}%`, label: 'загрузка' },
  { id: 'buffer', value: `${fmtNum(BUFFER.min)}–${fmtNum(BUFFER.max)} ид`, label: 'буфер' },
] as const;

export const SUMMARY_TEXT = `${fmtNum(WBS_TOTAL)} ид работ · ёмкость ${fmtNum(CAPACITY.min)}–${fmtNum(CAPACITY.max)} ид · загрузка ${Math.round(
  LOAD.atMax,
)}–${Math.round(LOAD.atMin)}% · буфер ${fmtNum(BUFFER.min)}–${fmtNum(BUFFER.max)} ид`;

export const CAPACITY_SPRINTS = PROJECT.sprints;

export const FOOTNOTE = 'ид — идеальные человеко-дни; оценки — бэклог проекта, калибруются после спринта 1';

export { OPTIONAL_PACKAGE, WBS_TOTAL, CAPACITY, BUFFER, WORK_PACKAGES };
export type { WorkPackage };
