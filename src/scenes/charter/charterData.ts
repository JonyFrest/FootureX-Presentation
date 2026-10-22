/**
 * Данные сцены 08 «Устав проекта», вычисленные из src/data/project.ts.
 * Цель проекта (PROJECT.goal) размечается на фрагменты SMART поиском по тексту,
 * поэтому правка формулировки в project.ts не ломает сцену: не найденный фрагмент
 * просто не подсвечивается.
 */
import { MILESTONES, PROJECT, SMART, formatUsd } from '@/data/project';

export type SmartLetter = (typeof SMART)[number]['letter'];

/** Где в формулировке цели «живёт» каждая буква SMART. */
const FRAGMENT_PATTERNS: Record<SmartLetter, RegExp> = {
  // Конкретная: что именно делаем.
  S: /создание клуба[^—]*/,
  // Измеримая: целевая аудитория.
  M: /~?\d[\d\s  ]*активных игроков в месяц/,
  // Достижимая: в пределах ресурсов команды.
  A: /при бюджете команды[^.]*/,
  // Значимая: запуск продукта на рынке — основа экосистемы.
  R: /запустить в [^—]*?FootureX/,
  // Ограниченная во времени.
  T: /^За [^(]*\([^)]*\)/,
};

export interface GoalSegment {
  text: string;
  letter: SmartLetter | null;
}

function segmentGoal(goal: string): GoalSegment[] {
  const found: { start: number; end: number; letter: SmartLetter }[] = [];
  for (const { letter } of SMART) {
    const m = FRAGMENT_PATTERNS[letter].exec(goal);
    if (!m) continue;
    const text = m[0].trimEnd();
    found.push({ start: m.index, end: m.index + text.length, letter });
  }
  found.sort((a, b) => a.start - b.start);
  const out: GoalSegment[] = [];
  let cursor = 0;
  for (const f of found) {
    if (f.start < cursor) continue; // пересечение — пропускаем
    if (f.start > cursor) out.push({ text: goal.slice(cursor, f.start), letter: null });
    out.push({ text: goal.slice(f.start, f.end), letter: f.letter });
    cursor = f.end;
  }
  if (cursor < goal.length) out.push({ text: goal.slice(cursor), letter: null });
  return out;
}

/** Узкие неразрывные пробелы в числах («15 000», «$5 000»), чтобы они не разрывались переносом. */
const goalText = PROJECT.goal.replace(/(\d)[\u00A0\u202F ](?=\d{3})/g, '$1\u202F');

export const GOAL_SEGMENTS = segmentGoal(goalText);
export const LETTERS_IN_GOAL = new Set(GOAL_SEGMENTS.flatMap((s) => (s.letter ? [s.letter] : [])));

/** «Руководитель проекта (Product Owner)» → «Product Owner». */
export const MANAGER_SHORT = /\(([^)]+)\)/.exec(PROJECT.manager)?.[1] ?? PROJECT.manager;

export const BUDGET_MONTHLY = formatUsd(PROJECT.teamBudgetMonthlyUsd);

export const MILESTONE_RANGE = `${MILESTONES[0].id}–${MILESTONES[MILESTONES.length - 1].id}`;

export type CharterTab = 'scope' | 'limits' | 'accept';

export const CHARTER_TABS: readonly { id: CharterTab; label: string; count: number }[] = [
  { id: 'scope', label: 'Содержание', count: PROJECT.inScope.length },
  { id: 'limits', label: 'Ограничения', count: PROJECT.constraints.length },
  { id: 'accept', label: 'Приёмка', count: PROJECT.acceptance.length },
];
