/** Русские формы множественного числа: ruPlural(12, ['спринт', 'спринта', 'спринтов']). */
export function ruPlural(n: number, forms: readonly [string, string, string]): string {
  const abs = Math.abs(Math.trunc(n));
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

/** «12 спринтов», «5 вех», «13 пакетов работ». */
export const plural = (n: number, forms: readonly [string, string, string]) => `${n} ${ruPlural(n, forms)}`;

export const MONTH_FORMS = ['месяц', 'месяца', 'месяцев'] as const;
export const WEEK_FORMS = ['неделя', 'недели', 'недель'] as const;
export const SPRINT_FORMS = ['спринт', 'спринта', 'спринтов'] as const;
export const MILESTONE_FORMS = ['веха', 'вехи', 'вех'] as const;
export const PACKAGE_FORMS = ['пакет работ', 'пакета работ', 'пакетов работ'] as const;
export const RISK_FORMS = ['риск', 'риска', 'рисков'] as const;
export const CRITERION_FORMS = ['критерий', 'критерия', 'критериев'] as const;
export const EPIC_FORMS = ['эпик', 'эпика', 'эпиков'] as const;
