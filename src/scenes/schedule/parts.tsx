import type { CSSProperties } from 'react';
import { CRITICAL_COUNT, PACKAGE_ROWS } from './gantt';

/** Ромб вехи. */
export function Diamond({ active = false, className = '' }: { active?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block rotate-45 rounded-[2px] transition-[box-shadow,background-color,transform] duration-300 ${className}`}
      style={{
        background: active ? '#DCE7FF' : 'linear-gradient(135deg, #8EB4FF, #2593FA)',
        boxShadow: active
          ? '0 0 0 2px rgba(7,10,18,0.9), 0 0 16px 2px rgba(142,180,255,0.85)'
          : '0 0 0 2px rgba(7,10,18,0.9), 0 0 10px rgba(37,147,250,0.6)',
      }}
    />
  );
}

export type BarKind = 'critical' | 'regular' | 'optional';

/** Заливка отрезка Ганта: критический путь — градиент бренда, прочие — светло-синий, задел — пунктир. */
export function barStyle(kind: BarKind, emphasis: 'normal' | 'strong' = 'normal'): CSSProperties {
  if (kind === 'critical')
    return {
      background: 'linear-gradient(90deg, #2593FA, #2550FA)',
      boxShadow:
        emphasis === 'strong'
          ? 'inset 0 1px 0 rgba(255,255,255,0.35), 0 0 18px rgba(37,147,250,0.75)'
          : 'inset 0 1px 0 rgba(255,255,255,0.3), 0 0 10px rgba(37,147,250,0.35)',
    };
  if (kind === 'optional')
    return {
      background: 'repeating-linear-gradient(135deg, rgba(142,180,255,0.32) 0 3px, rgba(142,180,255,0.06) 3px 7px)',
      border: '1.5px dashed rgba(142,180,255,0.9)',
    };
  return {
    background: 'linear-gradient(90deg, rgba(142,180,255,0.55), rgba(142,180,255,0.38))',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
  };
}

export function LegendSwatch({ kind, className = '' }: { kind: BarKind; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-[9px] w-[22px] shrink-0 rounded-[3px] ${className}`}
      style={barStyle(kind)}
    />
  );
}

/** Переключатель «Критический путь» (кнопка-переключатель, aria-pressed). */
export function CriticalToggle({
  on,
  onToggle,
  className = '',
}: {
  on: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      data-critical-toggle
      className={`group inline-flex cursor-pointer items-center gap-[var(--gap-1)] rounded-full border py-[5px] pr-[12px] pl-[6px] transition-[border-color,background-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 ${
        on
          ? 'border-[rgba(37,147,250,0.7)] bg-[rgba(37,80,250,0.22)] shadow-[0_0_24px_-6px_rgba(37,147,250,0.8)]'
          : 'border-[rgba(142,180,255,0.28)] bg-[rgba(14,22,41,0.6)] hover:border-[rgba(37,147,250,0.55)]'
      } ${className}`}
    >
      <span
        aria-hidden
        className={`relative inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-full transition-colors duration-300 ${
          on ? 'bg-[linear-gradient(90deg,#2593FA,#2550FA)]' : 'bg-[rgba(142,180,255,0.18)]'
        }`}
      >
        <span
          className="absolute top-[3px] size-[12px] rounded-full bg-white shadow transition-[left] duration-300"
          style={{ left: on ? 17 : 3 }}
        />
      </span>
      <span className="t-small font-semibold whitespace-nowrap text-white">Критический путь</span>
      <span className="t-micro whitespace-nowrap text-highlight t-num">
        {CRITICAL_COUNT} из {PACKAGE_ROWS.length}
      </span>
    </button>
  );
}
