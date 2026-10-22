/**
 * Общие помощники сцен 08–10 (устав, команда и стейкхолдеры, WBS):
 * форматирование чисел ru-RU, склонения, выбор наведением / фокусом / касанием и вкладки.
 */
import { useCallback, useRef, useState, type FocusEvent, type PointerEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useScene } from '@/components/scene';

export const EASE = [0.16, 1, 0.3, 1] as const;

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

/** Приводит пробелы между разрядами в готовых строках к узким неразрывным. */
export function thinSpaces(text: string): string {
  return text.replace(/(\d)[   ](?=\d{3})/g, `$1${NARROW_NBSP}`);
}

/** Русское склонение: plural(14, ['пакет', 'пакета', 'пакетов']). */
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
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered((h) => (h === id ? null : h));
      },
      onClick: () => {
        const unpin = toggle && pinnedRef.current === id;
        setPinned(unpin ? null : id);
        setHovered(unpin ? null : id);
      },
    }),
    [toggle, setPinned],
  );

  return { active: hovered ?? pinned, hovered, pinned, setPinned, setHovered, bind };
}

/* ------------------------------------------------------------------
   Вкладки (role=tablist). Стрелки заняты презентацией, поэтому переключение —
   Tab + Enter/Space или клик/касание.
   ------------------------------------------------------------------ */

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  /** Небольшой счётчик справа от названия. */
  badge?: ReactNode;
}

interface TabsProps<T extends string> {
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Уникальный префикс id для связки вкладка ↔ панель. */
  idBase: string;
  label: string;
  className?: string;
  /** Растянуть вкладки на всю ширину (телефон). */
  stretch?: boolean;
}

export const tabId = (idBase: string, id: string) => `${idBase}-tab-${id}`;
export const panelId = (idBase: string, id: string) => `${idBase}-panel-${id}`;

export function Tabs<T extends string>({ tabs, value, onChange, idBase, label, className = '', stretch = false }: TabsProps<T>) {
  const { reducedMotion } = useScene();
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`glass relative inline-flex gap-1 rounded-full p-1 ${stretch ? 'flex w-full' : ''} ${className}`}
    >
      {tabs.map((tab) => {
        const on = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tabId(idBase, tab.id)}
            aria-selected={on}
            aria-controls={panelId(idBase, tab.id)}
            tabIndex={0}
            onClick={() => onChange(tab.id)}
            className={`t-small relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-[var(--gap-2)] py-[calc(var(--gap-1)*0.9)] font-semibold whitespace-nowrap transition-colors duration-300 ${
              stretch ? 'min-w-0 flex-1' : ''
            } ${on ? 'text-white' : 'text-soft hover:text-white'}`}
          >
            {on ? (
              <motion.span
                layoutId={`${idBase}-tab-pill`}
                aria-hidden
                className="absolute inset-0 z-0 rounded-full bg-[image:var(--grad-brand)] shadow-[0_8px_26px_-10px_rgba(37,80,250,0.9)]"
                transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
              />
            ) : null}
            {/* z-10: скользящая «пилюля» не перекрывает подписи соседних вкладок. */}
            <span className="relative z-10">{tab.label}</span>
            {tab.badge !== undefined ? (
              <span
                className={`t-micro relative z-10 rounded-full px-1.5 leading-[1.5] t-num ${on ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-mute'}`}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Панели вкладок, сложенные в одну ячейку сетки: высота блока постоянна
 * (по самой высокой панели), раскладка сцены не прыгает при переключении.
 */
export function StackedPanels<T extends string>({
  ids,
  value,
  idBase,
  render,
  className = '',
}: {
  ids: readonly T[];
  value: T;
  idBase: string;
  render: (id: T, on: boolean) => ReactNode;
  className?: string;
}) {
  const { reducedMotion } = useScene();
  return (
    <div className={`grid ${className}`}>
      {ids.map((id) => {
        const on = id === value;
        return (
          <div
            key={id}
            role="tabpanel"
            id={panelId(idBase, id)}
            aria-labelledby={tabId(idBase, id)}
            aria-hidden={!on}
            inert={!on}
            className="min-w-0 [grid-area:1/1]"
            style={{
              opacity: on ? 1 : 0,
              visibility: on ? 'visible' : 'hidden',
              transform: on || reducedMotion ? 'none' : 'translateY(8px)',
              transition: reducedMotion
                ? 'opacity 0.15s ease, visibility 0.15s'
                : 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.16,1,0.3,1), visibility 0.35s',
            }}
          >
            {render(id, on)}
          </div>
        );
      })}
    </div>
  );
}
