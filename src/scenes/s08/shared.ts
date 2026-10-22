/**
 * Общие помощники сцен 08–10 (оргструктура, штатное расписание, ФОТ):
 * форматирование чисел ru-RU, склонения и выбор элемента наведением / фокусом / касанием.
 */
import { useCallback, useRef, useState, type FocusEvent, type PointerEvent } from 'react';

const NARROW_NBSP = ' ';
const formatters = new Map<number, Intl.NumberFormat>();

/** Число в формате ru-RU: запятая в дробной части, узкие неразрывные пробелы между разрядами. */
export function fmtNum(value: number, decimals = 1): string {
  let fmt = formatters.get(decimals);
  if (!fmt) {
    fmt = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    formatters.set(decimals, fmt);
  }
  return fmt.format(value).replace(/[   ]/g, NARROW_NBSP);
}

/** Приводит пробелы в готовых строках (например, formatMln из hr.ts) к узким неразрывным. */
export function thinSpaces(text: string): string {
  return text.replace(/(\d)[   ](?=\d)/g, `$1${NARROW_NBSP}`);
}

/** Русское склонение: plural(14, ['сотрудник', 'сотрудника', 'сотрудников']). */
export function plural(n: number, forms: readonly [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

export const EMPLOYEE_FORMS = ['сотрудник', 'сотрудника', 'сотрудников'] as const;
export const DIRECTION_FORMS = ['функциональное направление', 'функциональных направления', 'функциональных направлений'] as const;
export const UNIT_FORMS = ['подразделение', 'подразделения', 'подразделений'] as const;
export const POSITION_FORMS = ['должность', 'должности', 'должностей'] as const;

/**
 * Выбор элемента: наведение мышью и фокус с клавиатуры — временная подсветка,
 * клик / касание — закрепление. Итоговый выбор = наведение ?? закреплённый.
 */
export function useHoverSelect<T extends string>(initial: T | null = null, options: { toggle?: boolean } = {}) {
  const { toggle = false } = options;
  const [hovered, setHovered] = useState<T | null>(null);
  const [pinned, setPinnedState] = useState<T | null>(initial);
  const pinnedRef = useRef<T | null>(initial);
  const setPinned = useCallback((id: T | null) => {
    pinnedRef.current = id;
    setPinnedState(id);
  }, []);

  const bind = useCallback(
    (id: T) => ({
      onPointerEnter: (e: PointerEvent) => {
        if (e.pointerType === 'mouse') setHovered(id);
      },
      onPointerLeave: (e: PointerEvent) => {
        if (e.pointerType === 'mouse') setHovered((h) => (h === id ? null : h));
      },
      onFocus: () => setHovered(id),
      onBlur: (e: FocusEvent) => {
        // Фокус ушёл за пределы элемента — снимаем временную подсветку.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered((h) => (h === id ? null : h));
      },
      onClick: () => {
        // Повторный клик / касание по закреплённому элементу снимает выбор (если toggle).
        const unpin = toggle && pinnedRef.current === id;
        pinnedRef.current = unpin ? null : id;
        setPinned(pinnedRef.current);
        setHovered(unpin ? null : id);
      },
    }),
    [toggle, setPinned],
  );

  return { active: hovered ?? pinned, hovered, pinned, setPinned, setHovered, bind };
}
