import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { MILESTONES } from '@/data/project';
import {
  MS_BY_KEY,
  ROW_BY_KEY,
  SUMMARY,
  mauText,
  milestoneWhen,
  monthsText,
  sprintsText,
  type GanttRow,
} from './gantt';
import { Diamond } from './parts';

/** Карточка деталей: выбранный пакет работ или веха; без выбора — сводка плана. */
export function ScheduleDetail({ activeKey, className = '' }: { activeKey: string | null; className?: string }) {
  const { reducedMotion } = useScene();
  const row = activeKey ? ROW_BY_KEY.get(activeKey) : undefined;
  const ms = activeKey ? MS_BY_KEY.get(activeKey) : undefined;

  return (
    <div
      className={`glass-strong relative overflow-hidden px-[var(--gap-3)] py-[var(--gap-2)] ${className}`}
      aria-live="polite"
      data-schedule-detail
      data-interactive
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: row?.critical || ms ? 'var(--grad-brand)' : 'rgba(142,180,255,0.35)' }}
      />
      <motion.div
        key={activeKey ?? 'summary'}
        initial={reducedMotion ? false : { opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="flex min-h-full flex-col justify-center gap-[calc(var(--gap-1)*0.6)]"
      >
        {row ? <RowDetail row={row} /> : ms ? <MilestoneDetail id={ms.id} /> : <Summary />}
      </motion.div>
    </div>
  );
}

function Summary() {
  return (
    <>
      <p className="flex items-center gap-[var(--gap-1)]">
        <span className="chip chip-plan">план</span>
        <span className="t-small font-semibold text-white">{SUMMARY.line}</span>
      </p>
      <p className="t-small text-soft">{SUMMARY.scope}</p>
      <p className="t-micro text-mute">Наведите или нажмите на работу либо веху — здесь появятся детали</p>
    </>
  );
}

function RowDetail({ row }: { row: GanttRow }) {
  return (
    <>
      <p className="flex min-w-0 items-center gap-[var(--gap-1)]">
        <span className="chip shrink-0 font-display">{row.code || 'Задел'}</span>
        <span className="t-small min-w-0 truncate font-semibold text-white">{row.title}</span>
        {row.critical ? <span className="chip ml-auto shrink-0">критический путь</span> : null}
        {row.optional ? <span className="chip chip-plan ml-auto shrink-0">из буфера</span> : null}
      </p>
      <p className="t-small truncate text-soft">{row.detail}</p>
      <p className="t-micro text-highlight t-num">
        {sprintsText(row)} · {monthsText(row.months)} · {row.estimate} ид
        <span className="text-mute"> · {row.group}</span>
      </p>
    </>
  );
}

function MilestoneDetail({ id }: { id: string }) {
  const m = MILESTONES.find((x) => x.id === id);
  if (!m) return null;
  return (
    <>
      <p className="flex min-w-0 items-center gap-[var(--gap-1)]">
        <Diamond active className="size-[clamp(11px,calc(var(--u)*0.8),15px)] shrink-0" />
        <span className="t-small shrink-0 font-display text-highlight">{m.id}</span>
        <span className="t-small min-w-0 truncate font-semibold text-white">{m.title}</span>
        {m.mau ? <span className="chip ml-auto shrink-0 t-num">цель {mauText(m.mau)}</span> : null}
      </p>
      <p className="t-small truncate text-soft">{m.result}</p>
      <p className="t-micro text-highlight t-num">{milestoneWhen(m)}</p>
    </>
  );
}
