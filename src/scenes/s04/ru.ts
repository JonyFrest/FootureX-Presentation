/** Русские формы множественного числа: ruPlural(14, ['сотрудник', 'сотрудника', 'сотрудников']). */
export function ruPlural(n: number, forms: readonly [string, string, string]): string {
  const abs = Math.abs(Math.trunc(n));
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

export const PEOPLE_FORMS = ['сотрудник', 'сотрудника', 'сотрудников'] as const;
export const DAY_FORMS = ['день', 'дня', 'дней'] as const;
