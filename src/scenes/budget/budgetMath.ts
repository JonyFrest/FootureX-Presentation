/**
 * Отображаемые значения бюджета проекта (сцена 12). Всё считается из src/data/project.ts.
 *
 * Гарантии согласованности (проверяет qa-output/pm-budget-check.mjs):
 *  - статьи базового плана + управленческий резерв = итог бюджета (целые доллары);
 *  - статьи базового плана = базовый план затрат; месяцы = базовый план; PV в конце = базовый план;
 *  - округлённые доли статей = ровно 100,0% (метод наибольших остатков);
 *  - роли команды в сумме = $5 000 в месяц = статья «Команда» за месяц.
 */
import {
  BASELINE_MONTHLY,
  BUDGET,
  BUDGET_LINES,
  PROJECT,
  PV_CUMULATIVE,
  RESERVE_RATE,
  TEAM_RATES,
  budgetLineTotals,
  formatUsd,
} from '@/data/project';
import { chartPalette } from '@/styles/tokens';

export type SliceId = 'team' | 'infra' | 'marketing' | 'reserve';

export const SHARE_DECIMALS = 1;

/**
 * Округляет значения так, чтобы их сумма совпала с округлённым итогом (метод наибольших остатков):
 * каждое значение округляется вниз, недостающие единицы получают позиции с наибольшим остатком.
 */
export function roundToTotal(values: readonly number[], total: number, decimals: number): number[] {
  const f = 10 ** decimals;
  const target = Math.round(total * f);
  const scaled = values.map((v) => v * f);
  const units = scaled.map((v) => Math.floor(v + 1e-9));
  let rest = target - units.reduce((s, u) => s + u, 0);
  const order = scaled
    .map((v, i) => ({ i, frac: v - Math.floor(v + 1e-9) }))
    .sort((a, b) => b.frac - a.frac || values[b.i] - values[a.i]);
  for (let k = 0; rest > 0 && order.length > 0; k = (k + 1) % order.length, rest--) units[order[k].i] += 1;
  for (let k = order.length - 1; rest < 0 && order.length > 0; k = (k - 1 + order.length) % order.length, rest++)
    units[order[k].i] -= 1;
  return units.map((u) => u / f);
}

export interface Slice {
  id: SliceId;
  label: string;
  note: string;
  /** Сумма за 6 месяцев, целые доллары. */
  value: number;
  /** Доля в итоговом бюджете, %, округлена до SHARE_DECIMALS (сумма = 100). */
  share: number;
  /** Точная доля, % — для геометрии диаграммы. */
  exactShare: number;
  /** Входит в базовый план затрат (PV); резерв — вне базового плана. */
  inBaseline: boolean;
  color: string;
}

const pct = (rate: number) => Math.round(rate * 100);

export const RESERVE_PERCENT = pct(RESERVE_RATE);

const SLICE_COLORS: Record<SliceId, string> = {
  team: chartPalette[0],
  infra: chartPalette[1],
  marketing: chartPalette[2],
  reserve: chartPalette[3],
};

const exactValues = [...budgetLineTotals.map((l) => l.total), BUDGET.reserve];
const values = roundToTotal(exactValues, BUDGET.total, 0);
const shares = roundToTotal(
  exactValues.map((v) => (v / BUDGET.total) * 100),
  100,
  SHARE_DECIMALS,
);

export const SLICES: Slice[] = [
  ...budgetLineTotals.map((l, i) => ({
    id: l.id as SliceId,
    label: l.label,
    note: l.note,
    value: values[i],
    share: shares[i],
    exactShare: (exactValues[i] / BUDGET.total) * 100,
    inBaseline: true,
    color: SLICE_COLORS[l.id],
  })),
  {
    id: 'reserve',
    label: 'Управленческий резерв',
    note: `${RESERVE_PERCENT}% сверх базового плана, только с одобрения спонсора`,
    value: values[values.length - 1],
    share: shares[shares.length - 1],
    exactShare: (BUDGET.reserve / BUDGET.total) * 100,
    inBaseline: false,
    color: SLICE_COLORS.reserve,
  },
];

export const BASELINE_SLICES = SLICES.filter((s) => s.inBaseline);
export const RESERVE_SLICE = SLICES.find((s) => !s.inBaseline)!;
export const SLICE_BY_ID = new Map(SLICES.map((s) => [s.id, s]));

/** Доля базового плана в бюджете, % — сумма округлённых долей его статей (в десятых, без ошибок плавающей точки). */
export const BASELINE_SHARE = BASELINE_SLICES.reduce((s, x) => s + Math.round(x.share * 10), 0) / 10;

/* ------------------------------------------------------------------
   По месяцам: базовый план (PV) и его состав.
   ------------------------------------------------------------------ */
export interface MonthPoint {
  month: number;
  /** Затраты месяца по базовому плану, $. */
  value: number;
  /** Накопленная плановая стоимость (PV) на конец месяца, $. */
  cumulative: number;
  parts: { id: SliceId; label: string; value: number }[];
}

export const MONTH_POINTS: MonthPoint[] = BASELINE_MONTHLY.map((value, m) => ({
  month: m + 1,
  value,
  cumulative: PV_CUMULATIVE[m],
  parts: BUDGET_LINES.map((l) => ({ id: l.id as SliceId, label: l.label, value: l.monthly[m] })),
}));

/** Средние затраты месяца по базовому плану, $. */
export const AVERAGE_MONTH = BUDGET.baseline / PROJECT.durationMonths;

/* ------------------------------------------------------------------
   Команда по ролям (в месяц).
   ------------------------------------------------------------------ */
export const TEAM_ROLES = TEAM_RATES.map((r) => ({ id: r.role, title: r.title, monthly: r.monthly }));
export const TEAM_MONTHLY = TEAM_RATES.reduce((s, r) => s + r.monthly, 0);

export const FOOTNOTE =
  `План; команда — ${formatUsd(PROJECT.teamBudgetMonthlyUsd)} в месяц по бэклогу проекта, ` +
  'разбивка по ролям и прочие статьи — допущения; работа основателя в бюджет не входит';

export { formatUsd };
