/**
 * Общие помощники сцен 11–13 (календарный план, бюджет, риски):
 * форматирование чисел ru-RU, склонения и выбор элемента наведением / фокусом / касанием.
 */
import { useCallback, useRef, useState, type FocusEvent, type PointerEvent } from 'react';

const NARROW_NBSP = ' ';
const formatters = new Map<number, Intl.NumberFormat>();

/** Число в формате ru-RU: запятая в дробной части, узкие неразрывные пробелы между разрядами. */
export function fmtNum(value: number, decimals = 0): string {
  let fmt = formatters.get(decimals);
  if (!fmt) {
    fmt = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    formatters.set(decimals, fmt);
  }
  return fmt.format(value).replace(/[   ]/g, NARROW_NBSP);
}

/** Русское склонение: plural(14, ['спринт', 'спринта', 'спринтов']). */
export function plural(n: number, forms: readonly [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

/**
 * Выбор элемента: наведение мышью и фокус с клавиатуры — временная подсветка,
 * клик / касание — закрепление. Итоговый выбор = наведение ?? закреплённый.
 */
export function useHoverSelect<T extends string>(initial: T | null = null, options: { toggle?: boolean } = {}) {
  const { toggle = true } = options;
  const [hovered, setHovered] = useState<T | null>(null);
  const [pinned, setPinnedState] = useState<T | null>(initial);
  const pinnedRef = useRef<T | null>(initial);
  const setPinned = useCallback((id: T | null) => {
    pinnedRef.current = id;
    setPinnedState(id);
  }, []);

  const select = useCallback(
    (id: T) => {
      // Повторный клик / касание по закреплённому элементу снимает выбор (если toggle).
      const unpin = toggle && pinnedRef.current === id;
      setPinned(unpin ? null : id);
      setHovered(unpin ? null : id);
    },
    [toggle, setPinned],
  );

  const bind = useCallback(
    (id: T) => ({
      onPointerEnter: (e: PointerEvent) => {
        if (e.pointerType === 'mouse') setHovered(id);
      },
      onPointerLeave: (e: PointerEvent) => {
        if (e.pointerType === 'mouse') setHovered((h) => (h === id ? null : h));
      },
      onFocus: (e: FocusEvent) => {
        // Фокус от клика мышью не дублирует наведение; с клавиатуры — подсветка.
        if (e.currentTarget.matches(':focus-visible')) setHovered(id);
      },
      onBlur: (e: FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered((h) => (h === id ? null : h));
      },
      onClick: () => select(id),
    }),
    [select],
  );

  return { active: hovered ?? pinned, hovered, pinned, setPinned, setHovered, select, bind };
}

export type HoverBind<T extends string> = ReturnType<typeof useHoverSelect<T>>['bind'];
