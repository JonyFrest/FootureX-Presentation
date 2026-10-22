import { motion, useTransform } from 'motion/react';
import { ClipboardCheck, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useScene } from '@/components/scene';
import { DayTrack } from './DayTrack';
import { PHASES, TOTAL_DAYS } from './phases';
import type { DaySweep } from './useDaySweep';

interface TimelineProps {
  selected: number;
  onSelect: (index: number) => void;
  sweep: DaySweep;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function LaneLabel({ icon: Icon, title, note, row }: { icon: LucideIcon; title: string; note: string; row: number }) {
  return (
    <div className="flex items-start gap-2.5 pt-[var(--gap-2)] pr-[var(--gap-2)]" style={{ gridColumn: 1, gridRow: row }}>
      <span className="grid h-[calc(var(--fs-h3)*1.8)] w-[calc(var(--fs-h3)*1.8)] shrink-0 place-items-center rounded-[var(--radius-sm)] border border-[rgba(142,180,255,0.22)] bg-[rgba(37,80,250,0.14)]">
        <Icon className="h-[55%] w-[55%] text-highlight" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="t-small block font-semibold text-white">{title}</span>
        <span className="t-micro block text-mute">{note}</span>
      </span>
    </div>
  );
}

function TaskList({ items, active }: { items: readonly string[]; active: boolean }) {
  return (
    <ul className="flex flex-col gap-[var(--gap-1)] px-[var(--gap-3)] pt-[var(--gap-2)] pb-[var(--gap-2)]">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5">
          <span
            className="mt-[0.5em] h-1.5 w-1.5 shrink-0 rotate-45 transition-colors duration-300"
            style={{ background: active ? '#2593FA' : 'rgba(142,180,255,0.45)', boxShadow: active ? '0 0 8px #2593FA' : 'none' }}
            aria-hidden
          />
          <span className={`t-small transition-colors duration-300 ${active ? 'text-white' : 'text-soft'}`}>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** Таймлайн 0 → 90 на широких экранах: вкладки фаз, шкала дней, две дорожки «Сотрудник» и «HR». */
export function TimelineDesktop({ selected, onSelect, sweep }: TimelineProps) {
  const { reducedMotion } = useScene();
  const nowLeft = useTransform(sweep.day, (d) => `${(d / TOTAL_DAYS) * 100}%`);

  return (
    <div
      className="relative grid"
      style={{
        gridTemplateColumns: 'clamp(118px, calc(var(--u) * 10.5), 210px) repeat(3, minmax(0, 1fr))',
        gridTemplateRows: 'auto auto auto auto',
      }}
    >
      {/* подсветка выбранной фазы */}
      <motion.div
        layout={!reducedMotion}
        transition={{ type: 'spring', stiffness: 260, damping: 32 }}
        className="pointer-events-none rounded-[var(--radius-md)]"
        style={{
          gridColumn: selected + 2,
          gridRow: '1 / -1',
          background: 'linear-gradient(180deg, rgba(37,147,250,0.16), rgba(37,147,250,0.05) 45%, rgba(37,147,250,0.08))',
          boxShadow: 'inset 0 0 0 1px rgba(37,147,250,0.4), 0 18px 50px -24px rgba(37,80,250,0.7)',
        }}
        aria-hidden
      />

      {/* бегущая линия «сегодня» через дорожки */}
      {!reducedMotion ? (
        <div className="pointer-events-none relative z-[5]" style={{ gridColumn: '2 / -1', gridRow: '2 / -1' }} aria-hidden>
          <motion.span
            className="absolute top-[calc(var(--fs-micro)*2.2+12px)] bottom-0 w-px"
            style={{
              left: nowLeft,
              background: 'linear-gradient(180deg, rgba(37,147,250,0.9), rgba(37,147,250,0.05))',
            }}
            animate={{ opacity: sweep.done ? 0 : 1 }}
            transition={{ duration: 0.8 }}
          />
        </div>
      ) : null}

      {/* строка 1: вкладки фаз */}
      <p className="t-eyebrow self-end pb-[var(--gap-2)]" style={{ gridColumn: 1, gridRow: 1 }}>
        Фазы
      </p>
      <div
        role="tablist"
        aria-label="Фазы адаптации"
        className="relative z-10 grid"
        style={{ gridColumn: '2 / -1', gridRow: 1, gridTemplateColumns: 'subgrid' }}
      >
        {PHASES.map((p, i) => {
          const isSel = i === selected;
          return (
            <button
              key={p.id}
              id={`s12-tab-${p.id}`}
              type="button"
              role="tab"
              aria-selected={isSel}
              aria-controls={`s12-panel-${p.id}`}
              tabIndex={0}
              onClick={() => onSelect(i)}
              onFocus={(e) => {
              if (e.currentTarget.matches(':focus-visible')) onSelect(i);
            }}
              className="group cursor-pointer rounded-[var(--radius-md)] px-[var(--gap-3)] pt-[var(--gap-2)] pb-[var(--gap-1)] text-left"
            >
              <span className="block transition-transform duration-300 group-hover:-translate-y-0.5">
                <span className="t-eyebrow block">
                  {pad2(i + 1)} · {p.latin}
                </span>
                <span className={`t-h2 mt-1 block transition-colors duration-300 ${isSel ? 'text-white' : 'text-soft group-hover:text-ice'}`}>
                  {p.title}
                </span>
                <span className={`t-small block ${isSel ? 'text-highlight' : 'text-mute'}`}>
                  дни {p.from}–{p.to}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* строка 2: шкала дней */}
      <p className="t-micro self-center pt-[calc(var(--fs-micro)*1.2)] text-mute" style={{ gridColumn: 1, gridRow: 2 }}>
        День 0 → {TOTAL_DAYS}
      </p>
      <DayTrack sweep={sweep} selected={selected} style={{ gridColumn: '2 / -1', gridRow: 2 }} />

      {/* строки 3–4: дорожки */}
      <div className="hairline self-start" style={{ gridColumn: '1 / -1', gridRow: 3 }} aria-hidden />
      <div className="hairline self-start opacity-60" style={{ gridColumn: '1 / -1', gridRow: 4 }} aria-hidden />
      <LaneLabel icon={User} title="Сотрудник" note="задачи новичка" row={3} />
      <LaneLabel icon={ClipboardCheck} title="HR" note="процессы и оценка" row={4} />
      {PHASES.map((p, i) => (
        <div
          key={p.id}
          id={`s12-panel-${p.id}`}
          role="tabpanel"
          aria-labelledby={`s12-tab-${p.id}`}
          data-interactive
          onClick={() => onSelect(i)}
          className="relative z-10 grid cursor-pointer"
          style={{ gridColumn: i + 2, gridRow: '3 / 5', gridTemplateRows: 'subgrid' }}
        >
          <TaskList items={p.employee} active={i === selected} />
          <TaskList items={p.hr} active={i === selected} />
        </div>
      ))}
    </div>
  );
}
