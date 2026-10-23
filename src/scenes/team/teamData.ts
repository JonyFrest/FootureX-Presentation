/**
 * Данные сцены 09 «Команда и стейкхолдеры», вычисленные из src/data/project.ts.
 */
import {
  COMMUNICATIONS,
  DELIVERABLES,
  RACI,
  RACI_COLUMNS,
  ROLES,
  STAKEHOLDERS,
  stakeholderStrategy,
  type Raci,
  type Role,
  type RoleId,
  type Stakeholder,
  type StakeholderStrategy,
} from '@/data/project';
import { fmtNum } from '../charter/kit';

/* ------------------------------ RACI ------------------------------ */

/** Порядок «силы» букв: A — главная, затем R, C, I. */
export const RACI_ORDER: readonly Raci[] = ['A', 'R', 'C', 'I'];

export type RaciColumn = (typeof RACI_COLUMNS)[number];

export function fteLabel(fte: number | null): string {
  return fte === null ? 'вне бюджета команды' : `${fmtNum(fte, 1)} ставки`;
}

/** Подпись над названием столбца: «Результат 2» для результатов WBS, «Процесс» для управления. */
export function columnKicker(columnId: string): string {
  const d = DELIVERABLES.find((x) => x.id === columnId);
  return d ? `Результат ${d.code}` : 'Процесс';
}

export function columnDescription(columnId: string): string | null {
  return DELIVERABLES.find((x) => x.id === columnId)?.description ?? null;
}

/** Кто в столбце A, R, C, I. */
export function columnSummary(columnId: string): Record<Raci, Role[]> {
  const out: Record<Raci, Role[]> = { A: [], R: [], C: [], I: [] };
  for (const role of ROLES) {
    const letter = RACI[role.id][columnId];
    if (letter) out[letter].push(role);
  }
  return out;
}

/** За какие столбцы роль A, R, C, I. */
export function roleSummary(roleId: RoleId): Record<Raci, RaciColumn[]> {
  const out: Record<Raci, RaciColumn[]> = { A: [], R: [], C: [], I: [] };
  for (const col of RACI_COLUMNS) {
    const letter = RACI[roleId][col.id];
    if (letter) out[letter].push(col);
  }
  return out;
}

/** Проверка правила RACI: в каждом столбце ровно один «A». */
export const ONE_A_PER_COLUMN = RACI_COLUMNS.every((c) => columnSummary(c.id).A.length === 1);

/** Команда в бюджете: роли с занятостью (спонсор и руководитель — вне бюджета команды). */
export const TEAM_IN_BUDGET = ROLES.filter((r) => r.fte !== null);
export const TEAM_FTE = TEAM_IN_BUDGET.reduce((s, r) => s + (r.fte ?? 0), 0);
export const ROLES_OUTSIDE_BUDGET = ROLES.filter((r) => r.fte === null);

/** Короткое имя роли для списков: без пояснения в скобках. */
export function roleShort(role: Role): string {
  return role.title.replace(/\s*\([^)]*\)\s*$/, '');
}

/* --------------------------- Стейкхолдеры --------------------------- */

/** Порог высокого влияния / заинтересованности (значение строго больше — «высокое»). */
export const THRESHOLD = 3;
export const SCALE_MIN = 1;
export const SCALE_MAX = 5;

/** Положение на сетке, доли 0–1 (запас по полшага шкалы с каждой стороны, порог — ровно посередине). */
export const axisPos = (v: number) => (v - (SCALE_MIN - 0.5)) / (SCALE_MAX - SCALE_MIN + 1);

export const QUADRANT_ORDER: readonly StakeholderStrategy[] = ['manage', 'satisfy', 'inform', 'monitor'];

/** Цвет точки по квадранту — только оттенки бренда, от самого яркого к приглушённому. */
export const STRATEGY_COLOR: Record<StakeholderStrategy, string> = {
  manage: '#2593FA',
  satisfy: '#2550FA',
  inform: '#8EB4FF',
  monitor: '#5B6B88',
};

export interface StakeholderView extends Stakeholder {
  strategy: StakeholderStrategy;
}

export const STAKEHOLDER_VIEWS: readonly StakeholderView[] = STAKEHOLDERS.map((s) => ({
  ...s,
  strategy: stakeholderStrategy(s),
}));

export const STAKEHOLDERS_BY_QUADRANT = QUADRANT_ORDER.map((q) => ({
  strategy: q,
  items: STAKEHOLDER_VIEWS.filter((s) => s.strategy === q),
}));

/** Квадрант на сетке: верх/низ — влияние, право/лево — заинтересованность. */
export const QUADRANT_POS: Record<StakeholderStrategy, { top: boolean; right: boolean }> = {
  manage: { top: true, right: true },
  satisfy: { top: true, right: false },
  inform: { top: false, right: true },
  monitor: { top: false, right: false },
};

/* --------------------------- Коммуникации --------------------------- */

/** События, сгруппированные по ритму (в порядке первого появления). */
export const COMM_RHYTHM = COMMUNICATIONS.reduce<{ cadence: string; events: (typeof COMMUNICATIONS)[number][] }[]>(
  (acc, c) => {
    const group = acc.find((g) => g.cadence === c.cadence);
    if (group) group.events.push(c);
    else acc.push({ cadence: c.cadence, events: [c] });
    return acc;
  },
  [],
);
