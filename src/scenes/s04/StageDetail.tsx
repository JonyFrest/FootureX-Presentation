import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Glass } from '@/components/ui';
import { pad2 } from '@/data/scenes';
import { LIFECYCLE, type LifecycleStage } from './stages';

interface StageDetailProps {
  selected: number;
  onSelect: (index: number) => void;
  reducedMotion: boolean;
}

const COUNT = LIFECYCLE.length;

/** Карточка выбранного этапа: смысл для FootureX, ключевая цифра, инструменты. */
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
          <p className="t-micro font-display uppercase tracking-[0.18em] text-highlight">{stage.en}</p>
          <h2 className="t-h2 mt-1 text-balance">{stage.ru}</h2>
        </>
      ) : null}
      <p className={`t-body text-soft ${compact ? '' : 'mt-[var(--gap-1)]'}`}>{stage.text}</p>

      {stage.figure ? (
        <div className="mt-[var(--gap-3)]">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="t-stat text-gradient whitespace-nowrap">{stage.figure.value}</span>
            {stage.figure.unit ? <span className="t-small font-medium text-highlight">{stage.figure.unit}</span> : null}
          </p>
          <p className="t-micro mt-1 text-mute">{stage.figure.caption}</p>
        </div>
      ) : null}

      {stage.ladder ? <GradeLadder steps={stage.ladder} /> : null}

      {stage.points.length ? (
        <ul className="mt-[var(--gap-3)] flex flex-wrap gap-[var(--gap-1)]" aria-label="Инструменты этапа">
          {stage.points.map((p) => (
            <li key={p} className="chip">
              {p}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function GradeLadder({ steps }: { steps: readonly string[] }) {
  return (
    <div className="mt-[var(--gap-3)]">
      <ol className="flex items-end gap-[var(--gap-1)]" aria-label="Грейды">
        {steps.map((step, i) => (
          <li key={step} className="flex flex-1 flex-col items-stretch gap-1.5">
            <span className="t-micro text-center font-display uppercase tracking-[0.08em] text-ice">{step}</span>
            <span
              className="block rounded-t-md border border-b-0 border-secondary/40"
              style={{
                height: `calc(var(--u) * ${0.9 + i * 0.75} + 8px)`,
                background: `linear-gradient(180deg, rgba(37,147,250,${0.25 + i * 0.18}) 0%, rgba(37,80,250,0.08) 100%)`,
              }}
            />
          </li>
        ))}
      </ol>
      <p className="t-micro mt-1 text-mute">грейды Junior → Middle → Senior → Lead</p>
    </div>
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
