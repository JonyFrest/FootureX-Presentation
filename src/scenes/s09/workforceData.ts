/**
 * Штатное расписание этапа 1, вычисленное из src/data/hr.ts (единый источник).
 * Никаких зашитых итогов: численность и фонд считаются из POSITIONS.
 */
import { departmentStats, HEADCOUNT, POSITIONS, positionMonthly, type DepartmentId, type Position } from '@/data/hr';

export interface StaffGroup {
  id: DepartmentId;
  name: string;
  short: string;
  head: string;
  headcount: number;
  /** Окладный фонд подразделения, млн сум/мес. */
  monthly: number;
  positions: readonly Position[];
}

export const STAFF_GROUPS: readonly StaffGroup[] = departmentStats
  .filter((d) => d.positions.length > 0)
  .map((d) => ({
    id: d.id,
    name: d.name,
    short: d.short,
    head: d.head,
    headcount: d.headcount,
    monthly: d.monthly,
    positions: d.positions,
  }));

export const STAFF_HEADCOUNT = HEADCOUNT;
export const STAFF_FUND = POSITIONS.reduce((s, p) => s + positionMonthly(p), 0);
export const STAFF_POSITIONS = POSITIONS.length;
export const MAX_GROUP_HEADCOUNT = Math.max(...STAFF_GROUPS.map((g) => g.headcount));

/** Фигуры людей подразделения: первая — руководитель направления (если он есть в штате). */
export function groupFigures(g: StaffGroup): { key: string; head: boolean }[] {
  const headIndex = g.positions.findIndex((p) => p.title === g.head);
  const figures: { key: string; head: boolean }[] = [];
  if (headIndex >= 0) figures.push({ key: `${g.id}-head`, head: true });
  g.positions.forEach((p, i) => {
    const n = i === headIndex ? p.count - 1 : p.count;
    for (let k = 0; k < n; k++) figures.push({ key: `${p.id}-${k}`, head: false });
  });
  return figures;
}
