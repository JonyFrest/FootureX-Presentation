import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Flag, Infinity as InfinityIcon } from 'lucide-react';
import { Glass } from '@/components/ui';
import { pad2 } from '@/data/scenes';
import { LIFECYCLE, type LifecycleStage } from './stages';

interface StageDetailProps {
  selected: number;
  onSelect: (index: number) => void;
  reducedMotion: boolean;
}

const COUNT = LIFECYCLE.length;

/** Карточка выбранного этапа: смысл для FootureX MVP, ключевые цифры, документы и результат. */
export function StageDetail({ selected, onSelect, reducedMotion }: StageDetailProps) {
  const stage = LIFECYCLE[selected];
  const go = (delta: number) => onSelect((selected + delta + COUNT) % COUNT);

  return (
    <Glass strong className="relative overflow-hidden p-[var(--gap-4)]" aria-live="polite">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="t-eyebrow">
          <span className="text-white">{pad2(selected + 1)}</span>
          <span className="text-mute"> / {pad2(COUNT)}</span>
        </p>
        <div className="flex items-center gap-2">
          <StepButton label="Предыдущий этап цикла" onClick={() => go(-1)}>
            <ChevronLeft className="size-4" aria-hidden />
          </StepButton>
          <StepButton label="Следующий этап цикла" onClick={() => go(1)}>
            <ChevronRight className="size-4" aria-hidden />
          </StepButton>
        </div>
      </div>

      <div className="relative mt-[var(--gap-2)] min-h-[clamp(180px,calc(var(--u)*14),290px)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage.id}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <StageBody stage={stage} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-[var(--gap-3)] flex gap-1.5" aria-hidden>
        {LIFECYCLE.map((s, i) => (
          <span
            key={s.id}
            className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${
              i === selected ? 'bg-secondary shadow-[0_0_10px_rgba(37,147,250,0.8)]' : i < selected ? 'bg-highlight/40' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </Glass>
  );
}

export function StageBody({ stage, compact = false }: { stage: LifecycleStage; compact?: boolean }) {
  return (
    <div>
      {!compact ? (
        <>
          <p className="t-micro flex flex-wrap items-center gap-x-3 gap-y-1 font-display uppercase tracking-[0.18em] text-highlight">
            {stage.en}
            {stage.spansAll ? <SpansAllBadge /> : null}
          </p>
          <h2 className="t-h2 mt-1 text-balance">{stage.ru}</h2>
        </>
      ) : stage.spansAll ? (
        <SpansAllBadge />
      ) : null}
      <p className={`t-body text-soft ${compact ? (stage.spansAll ? 'mt-2' : '') : 'mt-[var(--gap-1)]'}`}>{stage.text}</p>

      {stage.figure ? (
        <div className="mt-[var(--gap-2)]">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="t-stat text-gradient whitespace-nowrap">{stage.figure.value}</span>
            {stage.figure.unit ? <span className="t-small font-medium text-highlight">{stage.figure.unit}</span> : null}
          </p>
          <p className="t-micro mt-1 text-mute">{stage.figure.caption}</p>
        </div>
      ) : null}

      {stage.facts ? (
        <ul className="mt-[var(--gap-2)] grid grid-cols-2 gap-[var(--gap-1)]" aria-label="Ключевые числа плана">
          {stage.facts.map((f) => (
            <li
              key={f.label}
              className="flex flex-col rounded-[12px] border border-white/8 bg-white/[0.03] px-[clamp(8px,calc(var(--u)*0.7),14px)] py-[clamp(5px,calc(var(--u)*0.5),10px)]"
            >
              <span className="t-h2 text-gradient whitespace-nowrap leading-tight">{f.value}</span>
              <span className="t-micro leading-snug text-soft">{f.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {stage.points.length ? (
        <ul className="mt-[var(--gap-2)] flex flex-wrap gap-[var(--gap-1)]" aria-label="Документы и инструменты этапа">
          {stage.points.map((p) => (
            <li key={p} className="chip">
              {p}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-[var(--gap-2)] flex items-start gap-[var(--gap-1)] border-t border-white/8 pt-[var(--gap-2)]">
        <Flag className="mt-[0.15em] size-[1.05em] shrink-0 text-secondary" aria-hidden strokeWidth={2} />
        <span className="t-small leading-snug text-ice">
          <span className="text-mute">Результат: </span>
          <span className="font-semibold text-white">{stage.result}</span>
        </span>
      </p>
    </div>
  );
}

function SpansAllBadge() {
  return (
    <span className="chip chip-plan normal-case tracking-normal" style={{ fontFamily: 'var(--font-sans)' }}>
      <InfinityIcon className="size-[1.1em]" aria-hidden strokeWidth={2} />
      идёт весь проект
    </span>
  );
}

function StepButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-9 cursor-pointer place-items-center rounded-full border border-white/12 bg-white/[0.03] text-ice transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-secondary/60 hover:bg-secondary/10"
    >
      {children}
    </button>
  );
}
