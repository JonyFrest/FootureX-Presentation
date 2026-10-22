import { useRef, type CSSProperties } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'motion/react';
import { MILESTONES, TOTAL_DAYS } from './phases';
import type { DaySweep } from './useDaySweep';

interface DayTrackProps {
  sweep: DaySweep;
  selected: number;
  style?: CSSProperties;
}

const TICKS = Array.from({ length: TOTAL_DAYS / 5 + 1 }, (_, i) => i * 5);

/** Шкала 0 → 90 дней: вехи 30/60/90, подсветка выбранной фазы, бегущий маркер дня. */
export function DayTrack({ sweep, selected, style }: DayTrackProps) {
  const { day, reached } = sweep;
  const pct = useTransform(day, (d) => `${(d / TOTAL_DAYS) * 100}%`);
  const shift = useTransform(day, (d) => `${-(d / TOTAL_DAYS) * 100}%`);
  const label = useRef<HTMLSpanElement>(null);
  useMotionValueEvent(day, 'change', (d) => {
    if (label.current) label.current.textContent = String(Math.max(1, Math.round(d)));
  });
  const initialDay = Math.max(1, Math.round(day.get()));

  return (
    <div className="relative z-10 pt-[calc(var(--fs-micro)*2.2)] pb-[var(--gap-1)]" style={style} aria-hidden>
      {/* линия */}
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[rgba(142,180,255,0.18)]" />
        {/* выбранная фаза */}
        <div
          className="absolute top-1/2 h-[8px] -translate-y-1/2 rounded-full transition-[left] duration-500"
          style={{
            left: `calc(${(selected * 100) / 3}% + 6px)`,
            width: `calc(${100 / 3}% - 12px)`,
            background: 'rgba(37,147,250,0.22)',
            boxShadow: 'inset 0 0 0 1px rgba(37,147,250,0.45)',
          }}
        />
        {/* пройденный путь */}
        <motion.div
          className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 rounded-full"
          style={{ width: pct, background: 'var(--grad-brand)', boxShadow: '0 0 12px rgba(37,147,250,0.8)' }}
        />
        {/* деления каждые 5 дней */}
        {TICKS.map((t) =>
          t % 30 === 0 ? null : (
            <span
              key={t}
              className="absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 bg-[rgba(142,180,255,0.35)]"
              style={{ left: `${(t / TOTAL_DAYS) * 100}%` }}
            />
          ),
        )}
        {/* вехи */}
        {MILESTONES.map((m, i) => (
          <span
            key={m.day}
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-500"
            style={{
              left: `${(m.day / TOTAL_DAYS) * 100}%`,
              borderColor: reached[i] ? '#8EB4FF' : 'rgba(142,180,255,0.4)',
              background: reached[i] ? 'var(--grad-brand)' : '#0b1224',
              boxShadow: reached[i] ? '0 0 14px rgba(37,147,250,0.9)' : 'none',
            }}
          />
        ))}
        {/* маркер дня */}
        <motion.div className="absolute top-1/2 h-0 w-0" style={{ left: pct }}>
          <span className="absolute top-1/2 left-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(37,147,250,0.35)] blur-[3px]" />
          <span className="absolute top-1/2 left-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_#2593FA]" />
        </motion.div>
        <motion.span
          className="absolute bottom-full mb-1 flex items-baseline gap-1 rounded-full border border-[rgba(37,147,250,0.6)] bg-[rgba(7,10,18,0.9)] px-2 py-0.5 whitespace-nowrap"
          style={{ left: pct, x: shift }}
        >
          <span className="t-micro uppercase tracking-[0.14em] text-highlight">День</span>
          <span ref={label} className="font-display t-micro text-white">
            {initialDay}
          </span>
        </motion.span>
      </div>
      {/* подписи вех */}
      <div className="relative mt-1 h-[calc(var(--fs-micro)*2.9)]">
        {MILESTONES.map((m, i) => {
          // Подпись вехи закрывает свою фазу: выравниваем её к узлу слева, чтобы не пересекать границу фаз.
          const first = i === 0;
          return (
            <span
              key={m.day}
              className={`absolute top-0 flex flex-col whitespace-nowrap ${first ? 'items-start' : 'items-end'}`}
              style={{
                left: `${(m.day / TOTAL_DAYS) * 100}%`,
                transform: first ? 'translateX(-4px)' : 'translateX(calc(-100% + 5px))',
              }}
            >
              <span className={`font-display t-small leading-none ${reached[i] ? 'text-white' : 'text-mute'}`}>
                {m.day}
              </span>
              <span className={`t-micro ${reached[i] ? 'text-soft' : 'text-mute'}`}>{m.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
