/** Форматирование чисел и склонения (ru-RU) для сцен 11–13. */

const intFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export function formatInt(value: number): string {
  return intFormat.format(value);
}

/** «25%», «99,5%» — без пробела перед знаком процента, как в данных hr.ts. */
export function formatPercent(value: number, decimals = 0): string {
  const fmt = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${fmt.format(value)}%`;
}

/** Русское склонение: plural(5, ['день', 'дня', 'дней']) → «дней». */
export function plural(n: number, forms: readonly [string, string, string]): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export const DAY_FORMS = ['день', 'дня', 'дней'] as const;
export const POSITION_FORMS = ['позиция', 'позиции', 'позиций'] as const;

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
