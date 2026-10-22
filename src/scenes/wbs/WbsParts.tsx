import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { EASE, fmtNum } from '../charter/kit';
import {
  CAPACITY,
  CAPACITY_SPRINTS,
  DELIVERABLE_VIEWS,
  OPTIONAL_PACKAGE,
  SUMMARY_PARTS,
  WBS_TOTAL,
  fmtSprints,
  type DeliverableView,
} from './wbsData';

/** Ромб «на критическом пути». */
export function CriticalMark({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-[0.5em] shrink-0 rotate-45 rounded-[1.5px] border border-secondary bg-secondary/60 ${className}`}
    />
  );
}

export function CriticalLegend({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <CriticalMark />
      критический путь к запуску
    </span>
  );
}

/** Полоса результата, разделённая на пакеты работ (ширина сегмента ∝ оценке). */
export function SegmentBar({
  deliverable,
  widthPct,
  activePackage,
  dim,
  delay = 0,
  className = '',
}: {
  deliverable: DeliverableView;
  widthPct: number;
  activePackage: string | null;
  dim: boolean;
  delay?: number;
  className?: string;
}) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  const hasActive = activePackage !== null && deliverable.packages.some((p) => p.id === activePackage);
  return (
    <div className={`relative h-[clamp(8px,calc(var(--u)*0.72),14px)] w-full ${className}`} aria-hidden>
      <motion.div
        className="flex h-full origin-left gap-[2px]"
        style={{ width: `${widthPct}%` }}
        initial={reducedMotion ? false : { scaleX: 0, opacity: 0 }}
        animate={show ? { scaleX: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.9, delay, ease: EASE }}
      >
        {deliverable.packages.map((p) => {
          const on = activePackage === p.id;
          return (
            <span
              key={p.id}
              className="h-full rounded-[3px] transition-[opacity,box-shadow] duration-300"
              style={{
                flex: p.estimate,
                background: deliverable.color,
                opacity: dim || (hasActive && !on) ? 0.32 : 1,
                boxShadow: on ? '0 0 0 1.5px #FFFFFF, 0 0 14px 1px rgba(37,147,250,0.85)' : 'none',
              }}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

/** Ёмкость команды за все спринты против оценки WBS: буфер и задел из буфера. */
export function CapacityBar({ activeDeliverable, className = '' }: { activeDeliverable: string | null; className?: string }) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  const pct = (v: number) => (v / CAPACITY.max) * 100;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-[var(--gap-2)]">
        <p className="t-small font-semibold text-white">
          Ёмкость команды · {CAPACITY_SPRINTS} спринтов <span className="chip chip-plan ml-1 align-middle">план</span>
        </p>
      </div>
      <div className="relative mt-[var(--gap-1)] h-[clamp(12px,calc(var(--u)*1),18px)] rounded-full border border-white/10 bg-white/[0.03]">
        {/* Буфер: от оценки WBS до максимальной ёмкости. */}
        <span
          aria-hidden
          className="absolute inset-y-0 right-0 rounded-r-full"
          style={{
            left: `${pct(WBS_TOTAL)}%`,
            background: 'repeating-linear-gradient(135deg, rgba(142,180,255,0.16) 0 3px, transparent 3px 7px)',
          }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-y-0 left-0 flex origin-left gap-[2px] overflow-hidden rounded-l-full"
          style={{ width: `${pct(WBS_TOTAL)}%` }}
          initial={reducedMotion ? false : { scaleX: 0 }}
          animate={show ? { scaleX: 1 } : undefined}
          transition={{ duration: 1.1, delay: 0.35, ease: EASE }}
        >
          {DELIVERABLE_VIEWS.map((d) => (
            <span
              key={d.id}
              className="h-full transition-opacity duration-300"
              style={{
                flex: d.estimate,
                background: d.color,
                opacity: activeDeliverable && activeDeliverable !== d.id ? 0.3 : 1,
              }}
            />
          ))}
        </motion.div>
        {/* Задел вне содержания MVP — из буфера. */}
        <motion.span
          aria-hidden
          className="absolute inset-y-[2px] rounded-[4px] border border-dashed border-highlight"
          style={{ left: `calc(${pct(WBS_TOTAL)}% + 2px)`, width: `calc(${pct(OPTIONAL_PACKAGE.estimate)}% - 2px)` }}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={show ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: 1.2 }}
        />
        {/* Минимальная ёмкость. */}
        <span
          aria-hidden
          className="absolute -top-[5px] -bottom-[5px] w-0 border-l-2 border-ice"
          style={{ left: `${pct(CAPACITY.min)}%` }}
        />
      </div>
      <div className="t-micro relative mt-1 h-[1.5em] text-mute t-num" aria-hidden>
        <span className="absolute top-0 left-0">0</span>
        <span className="absolute top-0 -translate-x-full pr-1 text-white" style={{ left: `${pct(WBS_TOTAL)}%` }}>
          {fmtNum(WBS_TOTAL)}
        </span>
        <span className="absolute top-0 -translate-x-1/2 text-ice" style={{ left: `${pct(CAPACITY.min)}%` }}>
          {fmtNum(CAPACITY.min)}
        </span>
        <span className="absolute top-0 right-0 text-ice">{fmtNum(CAPACITY.max)}</span>
      </div>
      <p className="t-small mt-[calc(var(--gap-1)*0.6)] flex flex-wrap gap-x-[0.5em] leading-snug text-soft">
        {SUMMARY_PARTS.map((p, i) => (
          <span key={p.id} className="whitespace-nowrap">
            {p.id === 'work' ? (
              <>
                <span className="font-semibold text-white t-num">{p.value}</span> {p.label}
              </>
            ) : (
              <>
                {p.label} <span className="font-semibold text-white t-num">{p.value}</span>
              </>
            )}
            {i < SUMMARY_PARTS.length - 1 ? <span className="text-mute"> ·</span> : null}
          </span>
        ))}
      </p>
    </div>
  );
}

/** Задел следующего этапа — пунктиром, вне содержания MVP. */
export function OptionalPackageCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-[var(--gap-2)] rounded-[12px] border border-dashed border-highlight/45 bg-white/[0.015] px-[var(--gap-2)] py-[calc(var(--gap-1)*1.1)] ${className}`}
    >
      <span className="min-w-0 flex-1">
        <span className="t-small block font-semibold leading-snug text-ice">{OPTIONAL_PACKAGE.title}</span>
        <span className="t-small block leading-snug text-mute">вне содержания MVP — из буфера</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="t-small block font-semibold text-highlight t-num">{fmtNum(OPTIONAL_PACKAGE.estimate)} ид</span>
        <span className="t-micro block text-mute t-num">
          {OPTIONAL_PACKAGE.sprints.length > 1 ? 'спринты' : 'спринт'} {fmtSprints(OPTIONAL_PACKAGE.sprints)}
        </span>
      </span>
    </div>
  );
}
