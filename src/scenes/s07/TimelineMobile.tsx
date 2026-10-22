import { AnimatePresence, motion } from 'motion/react';
import { ROADMAP, STATUS_LABEL } from './stages';
import { FocusList, ProjectFacts, ProjectTag } from './Timeline';

interface TimelineMobileProps {
  selected: number;
  onSelect: (index: number) => void;
  ready: boolean;
  reducedMotion: boolean;
}

/** Телефон: вертикальная дорожная карта; линия к этапам 2–3 — пунктир (план). */
export function TimelineMobile({ selected, onSelect, ready, reducedMotion }: TimelineMobileProps) {
  return (
    <ol className="flex flex-col">
      {ROADMAP.map((stage, i) => {
        const isSel = i === selected;
        const planned = stage.status === 'planned';
        const last = i === ROADMAP.length - 1;
        const Icon = stage.icon;
        return (
          <li key={stage.id} className="relative flex gap-3 pb-3">
            {/* Рельс */}
            <span className="relative flex w-11 shrink-0 justify-center" aria-hidden>
              {!last ? (
                <span
                  className="absolute bottom-[-12px] top-11 w-[2px]"
                  style={{
                    backgroundImage:
                      i === 0
                        ? 'linear-gradient(180deg, #2593FA 0%, rgba(37,147,250,0) 45%), repeating-linear-gradient(180deg, rgba(142,180,255,0.55) 0 8px, transparent 8px 14px)'
                        : 'repeating-linear-gradient(180deg, rgba(142,180,255,0.55) 0 8px, transparent 8px 14px)',
                  }}
                />
              ) : null}
              <span
                className={`relative z-10 grid size-11 place-items-center rounded-full ${
                  planned
                    ? `border-2 border-dashed bg-deep text-highlight ${isSel ? 'border-secondary' : 'border-highlight/45'}`
                    : 'bg-[image:var(--grad-brand)] text-white shadow-[0_0_24px_rgba(37,147,250,0.7)]'
                }`}
              >
                {!planned && ready && !reducedMotion ? (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-secondary"
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                  />
                ) : null}
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
            </span>

            {/* Карточка */}
            <div
              className={`min-w-0 flex-1 rounded-[var(--radius-md)] p-3.5 ${
                planned
                  ? `border border-dashed bg-[rgba(10,16,32,0.55)] ${isSel ? 'border-secondary/70' : 'border-highlight/30'}`
                  : `glass-strong ${isSel ? '!border-secondary/60' : ''}`
              }`}
            >
              <button
                type="button"
                aria-expanded={isSel}
                onClick={() => onSelect(i)}
                className="flex w-full cursor-pointer flex-col items-start gap-1.5 text-left"
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="t-micro font-display uppercase tracking-[0.16em] text-highlight">
                    Этап <span className="text-white">{stage.n}</span>
                  </span>
                  <span className={planned ? 'chip chip-plan' : 'chip border-secondary/60 bg-[rgba(37,80,250,0.35)] text-white'}>
                    {STATUS_LABEL[stage.status]}
                  </span>
                </span>
                <span className="t-h3 font-display font-normal text-white">{stage.title}</span>
                <ProjectTag stage={stage} />
                <span className="t-small text-soft">{stage.text}</span>
              </button>
              <AnimatePresence initial={false}>
                {isSel ? (
                  <motion.div
                    key="open"
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ duration: reducedMotion ? 0.01 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-3 pt-3">
                      <ProjectFacts stage={stage} compact />
                      <FocusList stage={stage} />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
