/**
 * Отображаемые (округлённые) значения HR-бюджета. Всё считается из src/data/hr.ts.
 *
 * Гарантии согласованности (проверяются qa-output/s08-10/check-sums.mjs):
 *  - округлённые статьи в сумме дают показанный итог (в обоих режимах: месяц / год);
 *  - округлённые доли в сумме дают ровно 100,0%;
 *  - состав «Дополнительных HR-расходов» в сумме даёт показанную статью.
 * Если округление ломает сумму, разница переносится на самую крупную позицию.
 */
import { BUDGET_LINES, BUDGET_TOTAL, HR_EXTRA_COSTS, type BudgetLine } from '@/data/hr';

export type BudgetMode = 'monthly' | 'annual';

/** Число знаков после запятой для сумм в млн сум и для долей в %. */
export const VALUE_DECIMALS = 1;
export const SHARE_DECIMALS = 1;

const toUnits = (v: number, decimals: number) => Math.round(v * 10 ** decimals);

/**
 * Округляет значения так, чтобы их сумма совпадала с округлённым итогом:
 * обычное округление, а остаток (если он есть) — на самую крупную позицию.
 */
export function roundToTotal(values: readonly number[], total: number, decimals: number): number[] {
  const f = 10 ** decimals;
  const units = values.map((v) => toUnits(v, decimals));
  const diff = toUnits(total, decimals) - units.reduce((s, u) => s + u, 0);
  if (diff !== 0 && units.length > 0) {
    let largest = 0;
    units.forEach((u, i) => {
      if (u > units[largest]) largest = i;
    });
    units[largest] += diff;
  }
  return units.map((u) => u / f);
}

export interface DisplayLine {
  id: BudgetLine['id'];
  label: string;
  note: string;
  /** Значение статьи в выбранном режиме, млн сум, округлено до VALUE_DECIMALS. */
  value: number;
  /** Доля статьи в бюджете, %, округлена до SHARE_DECIMALS (сумма = 100). */
  share: number;
  /** Точное значение за месяц (для пропорций диаграммы). */
  exactMonthly: number;
}

/** Показанный итог, млн сум. */
export function displayTotal(mode: BudgetMode): number {
  return toUnits(BUDGET_TOTAL[mode], VALUE_DECIMALS) / 10 ** VALUE_DECIMALS;
}

const SHARES = roundToTotal(
  BUDGET_LINES.map((l) => (l.monthly / BUDGET_TOTAL.monthly) * 100),
  100,
  SHARE_DECIMALS,
);

export function displayLines(mode: BudgetMode): DisplayLine[] {
  const values = roundToTotal(
    BUDGET_LINES.map((l) => l[mode]),
    BUDGET_TOTAL[mode],
    VALUE_DECIMALS,
  );
  return BUDGET_LINES.map((l, i) => ({
    id: l.id,
    label: l.label,
    note: l.note,
    value: values[i],
    share: SHARES[i],
    exactMonthly: l.monthly,
  }));
}

export interface DisplayExtra {
  id: string;
  label: string;
  value: number;
  exact: number;
}

/** Состав «Дополнительных HR-расходов» в выбранном режиме; сумма = показанной статье. */
export function displayExtras(mode: BudgetMode): DisplayExtra[] {
  const factor = mode === 'annual' ? 12 : 1;
  const extraLine = displayLines(mode).find((l) => l.id === 'extra');
  const exact = HR_EXTRA_COSTS.map((c) => c.monthly * factor);
  const values = roundToTotal(exact, extraLine ? extraLine.value : exact.reduce((s, v) => s + v, 0), VALUE_DECIMALS);
  return HR_EXTRA_COSTS.map((c, i) => ({ id: c.id, label: c.label, value: values[i], exact: exact[i] }));
}

/** Сумма в единицах округления (без ошибок плавающей точки) — для проверок. */
export function sumDisplayed(values: readonly number[], decimals = VALUE_DECIMALS): number {
  return values.reduce((s, v) => s + toUnits(v, decimals), 0) / 10 ** decimals;
}
