/**
 * Данные диаграммы Ганта (сцена 11). Всё выводится из src/data/project.ts:
 * спринты пакетов WBS → отрезки на шкале, вехи → конец спринта, месяцы → пары спринтов.
 */
import {
  DELIVERABLES,
  MILESTONES,
  OPTIONAL_PACKAGE,
  PROJECT,
  WBS_TOTAL,
  WORK_PACKAGES,
  sprintEndWeek,
  type Milestone,
} from '@/data/project';
import { fmtNum, plural } from './shared';

export const SPRINTS = PROJECT.sprints;
export const MONTHS = PROJECT.durationMonths;
export const SPRINTS_PER_MONTH = SPRINTS / MONTHS;

export const monthOfSprint = (sprint: number) => Math.ceil(sprint / SPRINTS_PER_MONTH);
export const monthSprints = (month: number) =>
  Array.from({ length: SPRINTS_PER_MONTH }, (_, i) => (month - 1) * SPRINTS_PER_MONTH + i + 1);

export interface Segment {
  start: number;
  end: number;
}

/** Непрерывные отрезки спринтов: [6, 8, 11, 12] → 6, 8, 11–12. */
export function toSegments(sprints: readonly number[]): Segment[] {
  const sorted = [...sprints].sort((a, b) => a - b);
  const out: Segment[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && s === last.end + 1) last.end = s;
    else out.push({ start: s, end: s });
  }
  return out;
}

export const segmentLabel = (seg: Segment) => (seg.start === seg.end ? `S${seg.start}` : `S${seg.start}–S${seg.end}`);

export const SPRINT_FORMS = ['спринт', 'спринта', 'спринтов'] as const;
export const MONTH_FORMS = ['месяц', 'месяца', 'месяцев'] as const;
export const PACKAGE_FORMS = ['пакет', 'пакета', 'пакетов'] as const;
export const MILESTONE_FORMS = ['веха', 'вехи', 'вех'] as const;

export interface GanttRow {
  key: string;
  id: string;
  /** Код WBS; у задела — пусто. */
  code: string;
  title: string;
  detail: string;
  estimate: number;
  sprints: readonly number[];
  segments: Segment[];
  months: number[];
  critical: boolean;
  optional: boolean;
  group: string;
}

export interface GanttGroup {
  id: string;
  code: string;
  title: string;
  rows: GanttRow[];
}

const monthsOf = (sprints: readonly number[]) => [...new Set(sprints.map(monthOfSprint))].sort((a, b) => a - b);

export const PACKAGE_ROWS: GanttRow[] = WORK_PACKAGES.map((p) => ({
  key: `pkg:${p.id}`,
  id: p.id,
  code: p.code,
  title: p.title,
  detail: p.detail,
  estimate: p.estimate,
  sprints: p.sprints,
  segments: toSegments(p.sprints),
  months: monthsOf(p.sprints),
  critical: p.critical,
  optional: false,
  group: DELIVERABLES.find((d) => d.id === p.deliverable)?.title ?? '',
}));

export const OPTIONAL_ROW: GanttRow = {
  key: `pkg:${OPTIONAL_PACKAGE.id}`,
  id: OPTIONAL_PACKAGE.id,
  code: '',
  title: OPTIONAL_PACKAGE.title,
  detail: OPTIONAL_PACKAGE.detail,
  estimate: OPTIONAL_PACKAGE.estimate,
  sprints: OPTIONAL_PACKAGE.sprints,
  segments: toSegments(OPTIONAL_PACKAGE.sprints),
  months: monthsOf(OPTIONAL_PACKAGE.sprints),
  critical: false,
  optional: true,
  group: 'Вне содержания MVP',
};

export const GROUPS: GanttGroup[] = [
  ...DELIVERABLES.map((d) => ({
    id: d.id as string,
    code: d.code,
    title: d.title,
    rows: PACKAGE_ROWS.filter((r) => WORK_PACKAGES.find((p) => p.id === r.id)?.deliverable === d.id),
  })),
  { id: 'buffer', code: '', title: 'Вне MVP', rows: [OPTIONAL_ROW] },
];

export const ALL_ROWS = GROUPS.flatMap((g) => g.rows);
export const ROW_BY_KEY = new Map(ALL_ROWS.map((r) => [r.key, r]));

export const CRITICAL_COUNT = PACKAGE_ROWS.filter((r) => r.critical).length;

export const msKey = (m: Milestone) => `ms:${m.id}`;
export const MS_BY_KEY = new Map(MILESTONES.map((m) => [msKey(m), m]));

/** «Спринты S6, S8, S11–S12» / «Спринт S3». */
export function sprintsText(row: GanttRow): string {
  const n = row.sprints.length;
  return `${n === 1 ? 'Спринт' : 'Спринты'} ${row.segments.map(segmentLabel).join(', ')}`;
}

export function monthsText(months: readonly number[]): string {
  return `${months.length === 1 ? 'месяц' : 'месяцы'} ${months.join(', ')}`;
}

export const milestoneWhen = (m: Milestone) =>
  `Конец спринта S${m.sprint} · неделя ${sprintEndWeek(m.sprint)} · месяц ${m.month}`;

export const mauText = (mau: number) => `${fmtNum(mau)} MAU`;

export const SUMMARY = {
  line: `${SPRINTS} ${plural(SPRINTS, SPRINT_FORMS)} по ${PROJECT.sprintWeeks} недели · ${MONTHS} ${plural(MONTHS, MONTH_FORMS)}`,
  scope: `${WORK_PACKAGES.length} ${plural(WORK_PACKAGES.length, PACKAGE_FORMS)} работ · ${WBS_TOTAL} ид · ${MILESTONES.length} ${plural(MILESTONES.length, MILESTONE_FORMS)}`,
};
