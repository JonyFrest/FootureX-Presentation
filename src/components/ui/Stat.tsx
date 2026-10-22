import type { ReactNode } from 'react';
import { CountUp } from './CountUp';

interface StatProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  unit?: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
  align?: 'left' | 'center';
}

/** Крупный показатель: число (Zen Dots) + единица + подпись. */
export function Stat({ value, decimals = 0, prefix, suffix, unit, label, hint, className = '', align = 'left' }: StatProps) {
  return (
    <div className={`${align === 'center' ? 'text-center' : ''} ${className}`}>
      <div className={`flex items-baseline gap-2 ${align === 'center' ? 'justify-center' : ''}`}>
        <CountUp to={value} decimals={decimals} prefix={prefix} suffix={suffix} className="t-stat text-gradient" />
        {unit ? <span className="t-small font-medium text-highlight">{unit}</span> : null}
      </div>
      <p className="t-small mt-1 text-soft">{label}</p>
      {hint ? <p className="t-micro mt-1 text-mute">{hint}</p> : null}
    </div>
  );
}
