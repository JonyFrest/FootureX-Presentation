import { useRef } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useTransform } from 'motion/react';
import { ChevronDown, ClipboardCheck, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useScene } from '@/components/scene';
import { MILESTONES, PHASES, TOTAL_DAYS } from './phases';
import type { DaySweep } from './useDaySweep';

interface TimelineProps {
  selected: number;
  onSelect: (index: number) => void;
  sweep: DaySweep;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function Lane({ icon: Icon, title, items }: { icon: LucideIcon; title: string; items: readonly string[] }) {
  return (
    <div>
      <p className="t-micro flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em] text-highlight">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {title}
      </p>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2">
            <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rotate-45 bg-secondary" aria-hidden />
            <span className="t-small text-white">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RailFill({ sweep, from }: { sweep: DaySweep; from: number }) {
  const scale = useTransform(sweep.day, (d) => Math.min(1, Math.max(0, (d - from) / 30)));
  return (
    <motion.span
      className="absolute top-0 left-1/2 h-full w-[2px] -translate-x-1/2 origin-top rounded-full"
      style={{ scaleY: scale, background: 'var(--grad-brand)', boxShadow: '0 0 10px rgba(37,147,250,0.8)' }}
    />
  );
}

function Node({ reached, day }: { reached: boolean; day: number }) {
  return (
    <span className="relative z-10 flex flex-col items-center">
      <span
        className="h-3.5 w-3.5 rounded-full border-2 transition-all duration-500"
        style={{
          borderColor: reached ? '#8EB4FF' : 'rgba(142,180,255,0.4)',
          background: reached ? 'var(--grad-brand)' : '#0b1224',
          boxShadow: reached ? '0 0 12px rgba(37,147,250,0.9)' : 'none',
        }}
      />
      <span className={`mt-1 font-display t-micro leading-none ${reached ? 'text-white' : 'text-mute'}`}>{day}</span>
    </span>
  );
}

/** Вертикальный таймлайн для телефонов: фазы-аккордеон вдоль шкалы дней. */
export function TimelineMobile({ selected, onSelect, sweep }: TimelineProps) {
  const { reducedMotion } = useScene();
  const dayLabel = useRef<HTMLSpanElement>(null);
  const progress = useTransform(sweep.day, (d) => `${(d / TOTAL_DAYS) * 100}%`);
  useMotionValueEvent(sweep.day, 'change', (d) => {
    if (dayLabel.current) dayLabel.current.textContent = String(Math.max(1, Math.round(d)));
  });

  return (
    <div>
      {/* счётчик дня */}
      <div className="mb-[var(--gap-3)] flex items-center gap-3" aria-hidden>
        <span className="flex items-baseline gap-1 rounded-full border border-[rgba(37,147,250,0.6)] bg-[rgba(7,10,18,0.9)] px-2.5 py-0.5">
          <span className="t-micro uppercase tracking-[0.14em] text-highlight">День</span>
          <span ref={dayLabel} className="font-display t-micro text-white">
            {Math.max(1, Math.round(sweep.day.get()))}
          </span>
          <span className="t-micro text-mute">/ {TOTAL_DAYS}</span>
        </span>
        <span className="relative h-[2px] flex-1 rounded-full bg-[rgba(142,180,255,0.18)]">
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: progress, background: 'var(--grad-brand)' }}
          />
        </span>
      </div>

      <ol className="flex flex-col">
        {PHASES.map((p, i) => {
          const isSel = i === selected;
          return (
            <li key={p.id} className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-3">
              <div className="relative flex flex-col items-center">
                <Node reached={sweep.reached[i]} day={MILESTONES[i].day} />
                <span className="relative my-1 w-[2px] flex-1 rounded-full bg-[rgba(142,180,255,0.18)]">
                  <RailFill sweep={sweep} from={MILESTONES[i].day} />
                </span>
              </div>
              <div className="pb-[var(--gap-3)]">
                <button
                  type="button"
                  aria-expanded={isSel}
                  aria-controls={`s12m-panel-${p.id}`}
                  onClick={() => onSelect(i)}
                  className={`flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3 py-2 text-left transition-colors duration-300 ${
                    isSel
                      ? 'border-[rgba(37,147,250,0.55)] bg-[rgba(37,147,250,0.14)]'
                      : 'border-[rgba(142,180,255,0.16)] bg-[rgba(14,22,41,0.6)]'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="t-eyebrow block">
                      {pad2(i + 1)} · {p.latin}
                    </span>
                    <span className={`t-h3 block ${isSel ? 'text-white' : 'text-soft'}`}>{p.title}</span>
                    <span className="t-micro block text-mute">
                      дни {p.from}–{p.to}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-highlight transition-transform duration-300 ${isSel ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isSel ? (
                    <motion.div
                      key="panel"
                      id={`s12m-panel-${p.id}`}
                      initial={reducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-[var(--gap-2)] px-1 pt-[var(--gap-2)]">
                        <Lane icon={User} title="Сотрудник" items={p.employee} />
                        <Lane icon={ClipboardCheck} title="HR" items={p.hr} />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
        <li className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-3">
          <div className="flex justify-center">
            <Node reached={sweep.reached[3]} day={MILESTONES[3].day} />
          </div>
          <p className="t-small pt-0.5 text-soft">{MILESTONES[3].label}</p>
        </li>
      </ol>
    </div>
  );
}
