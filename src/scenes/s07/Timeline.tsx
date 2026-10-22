import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, FolderKanban } from 'lucide-react';
import { CountUp } from '@/components/ui';
import { FOCUS_LABEL, ROADMAP, STATUS_LABEL, type RoadmapStage } from './stages';

interface TimelineProps {
  selected: number;
  onSelect: (index: number) => void;
  ready: boolean;
  reducedMotion: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** Горизонтальная дорожная карта: выбранный этап раскрывается, этапы 2–3 — пунктир (план). */
export function Timeline({ selected, onSelect, ready, reducedMotion }: TimelineProps) {
  const drawn = ready || reducedMotion;
  return (
    <div
      className="flex w-full items-stretch gap-[var(--tl-gap)]"
      style={{ '--tl-gap': 'clamp(18px, calc(var(--u) * 2.2), 44px)' } as CSSProperties}
    >
      {ROADMAP.map((stage, i) => {
        const isSel = i === selected;
        const last = i === ROADMAP.length - 1;
        return (
          <div
            key={stage.id}
            className="flex min-w-0 basis-0 flex-col"
            style={{
              flexGrow: isSel ? 1.8 : 1,
              transition: reducedMotion ? 'none' : 'flex-grow 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Дорожка с узлом */}
            <div className="relative mb-[var(--gap-3)] flex h-[clamp(44px,calc(var(--u)*4),72px)] items-center">
              <Segment index={i} last={last} drawn={drawn} reducedMotion={reducedMotion} />
              <Node stage={stage} selected={isSel} pulse={ready && !reducedMotion && stage.status === 'current'} onSelect={() => onSelect(i)} />
            </div>
            <StageCard stage={stage} selected={isSel} onSelect={() => onSelect(i)} reducedMotion={reducedMotion} />
          </div>
        );
      })}
    </div>
  );
}

function Segment({ index, last, drawn, reducedMotion }: { index: number; last: boolean; drawn: boolean; reducedMotion: boolean }) {
  const dashed = 'repeating-linear-gradient(90deg, rgba(142,180,255,0.55) 0 9px, transparent 9px 16px)';
  const delay = 0.25 + index * 0.35;
  // CSS-переход (а не motion): надёжно стартует по ready, при reduced motion — сразу финальное состояние.
  return (
    <span
      aria-hidden
      className="absolute top-1/2 h-[2px] -translate-y-1/2"
      style={{
        left: 'calc(clamp(44px, calc(var(--u) * 4), 72px) / 2)',
        right: last ? 0 : 'calc(-1 * var(--tl-gap))',
        transformOrigin: '0% 50%',
        backgroundImage: dashed,
        maskImage: last ? 'linear-gradient(90deg, #000 40%, transparent)' : undefined,
        WebkitMaskImage: last ? 'linear-gradient(90deg, #000 40%, transparent)' : undefined,
        transform: drawn ? 'scaleX(1)' : 'scaleX(0)',
        opacity: drawn ? 1 : 0,
        transition: reducedMotion
          ? 'none'
          : `transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, opacity 0.5s ease ${delay}s`,
      }}
    >
      {index === 0 ? (
        // Текущий этап: сплошной светящийся участок, переходящий в пунктир плана.
        <span
          className="absolute inset-y-0 left-0 w-[46%] rounded-full"
          style={{
            background: 'linear-gradient(90deg, #DCE7FF 0%, #2593FA 45%, rgba(37,80,250,0) 100%)',
            boxShadow: '0 0 12px rgba(37,147,250,0.75)',
          }}
        />
      ) : null}
    </span>
  );
}

function Node({ stage, selected, pulse, onSelect }: { stage: RoadmapStage; selected: boolean; pulse: boolean; onSelect: () => void }) {
  const Icon = stage.icon;
  const current = stage.status === 'current';
  return (
    <span
      data-interactive
      aria-hidden
      onClick={onSelect}
      className={`relative z-10 grid size-[clamp(44px,calc(var(--u)*4),72px)] shrink-0 cursor-pointer place-items-center rounded-full transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 ${
        current
          ? 'bg-[image:var(--grad-brand)] text-white shadow-[0_0_0_4px_rgba(37,147,250,0.18),0_0_32px_rgba(37,147,250,0.75)]'
          : `border-2 border-dashed bg-deep text-highlight ${selected ? 'border-secondary shadow-[0_0_24px_rgba(37,147,250,0.45)]' : 'border-highlight/45'}`
      }`}
    >
      {pulse ? (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-secondary"
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
        />
      ) : null}
      <Icon className="size-[45%]" strokeWidth={1.8} />
    </span>
  );
}

function StageCard({
  stage,
  selected,
  onSelect,
  reducedMotion,
}: {
  stage: RoadmapStage;
  selected: boolean;
  onSelect: () => void;
  reducedMotion: boolean;
}) {
  const planned = stage.status === 'planned';
  const surface = planned
    ? `border border-dashed bg-[rgba(10,16,32,0.5)] backdrop-blur-md ${selected ? 'border-secondary/70' : 'border-highlight/30'}`
    : `glass-strong ${selected ? '!border-secondary/60 shadow-[0_0_0_1px_rgba(37,147,250,0.25),0_24px_60px_-24px_rgba(37,80,250,0.8)]' : ''}`;

  return (
    <div
      data-interactive
      onClick={onSelect}
      className={`group relative flex flex-1 cursor-pointer flex-col rounded-[var(--radius-md)] p-[clamp(14px,calc(var(--u)*1.5),28px)] transition-[transform,border-color,box-shadow,opacity] duration-300 hover:-translate-y-0.5 ${surface} ${
        planned && !selected ? 'opacity-80 hover:opacity-100' : ''
      }`}
    >
      {!planned ? (
        <span aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-secondary to-transparent" />
      ) : null}
      <button
        type="button"
        aria-expanded={selected}
        aria-label={`Этап ${stage.n}: ${stage.title}. ${stage.project.label}: ${stage.project.name}. ${STATUS_LABEL[stage.status]}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onFocus={(e) => {
          if (e.currentTarget.matches(':focus-visible')) onSelect();
        }}
        className="flex w-full cursor-pointer flex-col items-start gap-[var(--gap-1)] text-left outline-offset-4"
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className="t-micro font-display uppercase tracking-[0.18em] text-highlight">
            Этап <span className="text-white">{stage.n}</span>
          </span>
          <span className={planned ? 'chip chip-plan' : 'chip border-secondary/60 bg-[rgba(37,80,250,0.35)] text-white'}>
            {!planned ? <span className="size-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" aria-hidden /> : null}
            {STATUS_LABEL[stage.status]}
          </span>
        </span>
        <span className={`${selected ? 't-h2' : 't-h3 font-display font-normal'} block text-balance ${planned ? 'text-ice' : 'text-white'}`}>
          {stage.title}
        </span>
        <ProjectTag stage={stage} />
      </button>
      <p className={`t-small mt-[var(--gap-1)] text-pretty ${planned ? 'text-soft' : 'text-ice'}`}>{stage.text}</p>

      <AnimatePresence initial={false} mode="popLayout">
        {selected ? (
          <motion.div
            key="open"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.4, delay: reducedMotion ? 0 : 0.18, ease: EASE }}
            className="mt-[var(--gap-3)] flex flex-col gap-[var(--gap-3)]"
          >
            {stage.facts ? <ProjectFacts stage={stage} /> : null}
            <FocusList stage={stage} columns={stage.focus.length > 3 ? 2 : 1} />
          </motion.div>
        ) : (
          <motion.div
            key="closed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.25 }}
            className="mt-auto flex items-center gap-1 pt-[var(--gap-2)] text-highlight"
          >
            <span className="t-micro">
              {FOCUS_LABEL}: {stage.focus.length}
            </span>
            <ChevronRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Проект этапа: «Проект · FootureX MVP». */
export function ProjectTag({ stage }: { stage: RoadmapStage }) {
  const planned = stage.status === 'planned';
  return (
    <span className="t-small inline-flex items-center gap-2">
      <FolderKanban className={`size-[1.1em] shrink-0 ${planned ? 'text-highlight/70' : 'text-secondary'}`} strokeWidth={1.8} aria-hidden />
      <span className="text-mute">{stage.project.label}</span>
      <span className={`font-semibold ${planned ? 'text-ice' : 'text-white'}`}>{stage.project.name}</span>
    </span>
  );
}

/** Паспорт текущего проекта: срок, спринты, команда, бюджет (значения из project.ts). */
export function ProjectFacts({ stage, compact = false }: { stage: RoadmapStage; compact?: boolean }) {
  if (!stage.facts) return null;
  return (
    <dl
      className={`grid rounded-[var(--radius-md)] border border-white/[0.08] bg-white/[0.03] ${
        compact ? 'grid-cols-2' : 'grid-cols-[repeat(auto-fit,minmax(min(100%,7.2em),1fr))]'
      }`}
    >
      {stage.facts.map((fact, i) => (
        <div
          key={fact.id}
          className={`flex min-w-0 flex-col gap-1 px-[var(--gap-2)] py-[var(--gap-2)] ${
            compact
              ? `${i % 2 ? 'border-l border-white/[0.08]' : ''} ${i > 1 ? 'border-t border-white/[0.08]' : ''}`
              : i > 0
                ? 'border-l border-white/[0.08]'
                : ''
          }`}
        >
          <dt className="t-micro order-2 leading-snug text-soft">{fact.caption}</dt>
          <dd className="t-h2 order-1 leading-none whitespace-nowrap">
            {fact.value !== undefined ? (
              <CountUp to={fact.value} prefix={fact.prefix} duration={1.4} delay={0.1 + i * 0.12} className="text-gradient" />
            ) : (
              <span className="t-num text-gradient">{fact.text}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function FocusList({ stage, columns = 1 }: { stage: RoadmapStage; columns?: 1 | 2 }) {
  return (
    <div className="min-w-0">
      <p className="t-micro font-display uppercase tracking-[0.16em] text-highlight">{FOCUS_LABEL}</p>
      <ul
        className={`mt-[var(--gap-1)] grid gap-x-[var(--gap-3)] gap-y-[var(--gap-1)] ${
          columns === 2 ? 'grid-cols-[repeat(auto-fit,minmax(min(100%,14em),1fr))]' : 'grid-cols-1'
        }`}
      >
        {stage.focus.map(({ label, icon: Icon }) => (
          <li key={label} className="flex items-center gap-[var(--gap-1)]">
            <span
              className={`grid size-[clamp(24px,calc(var(--u)*2),36px)] shrink-0 place-items-center rounded-full ${
                stage.status === 'planned' ? 'border border-dashed border-highlight/40 text-highlight' : 'bg-secondary/20 text-white'
              }`}
            >
              <Icon className="size-[55%]" strokeWidth={1.8} aria-hidden />
            </span>
            <span className="t-small leading-snug text-white">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
