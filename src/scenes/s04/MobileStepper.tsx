import { AnimatePresence, motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { pad2 } from '@/data/scenes';
import { LIFECYCLE, LOOP_NOTE } from './stages';
import { StageBody } from './StageDetail';

interface MobileStepperProps {
  selected: number;
  onSelect: (index: number) => void;
  reducedMotion: boolean;
}

/** Телефон: вертикальный степпер цикла, выбранный этап раскрывается на месте. */
export function MobileStepper({ selected, onSelect, reducedMotion }: MobileStepperProps) {
  return (
    <div className="relative">
      <ol className="relative flex flex-col gap-2">
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-6 left-[19px] top-6 w-px bg-gradient-to-b from-secondary/70 via-highlight/30 to-secondary/70"
        />
        {LIFECYCLE.map((stage, i) => {
          const isSel = i === selected;
          return (
            <li key={stage.id} className="relative">
              <button
                type="button"
                aria-expanded={isSel}
                onClick={() => onSelect(i)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-[14px] border py-2 pl-1 pr-3 text-left transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 ${
                  isSel ? 'border-secondary/60 bg-[rgba(18,34,82,0.75)]' : 'border-transparent bg-transparent'
                }`}
              >
                <span
                  className={`t-micro relative z-10 grid size-[30px] shrink-0 place-items-center rounded-full font-display ${
                    isSel ? 'bg-[image:var(--grad-brand)] text-white shadow-[0_0_16px_rgba(37,147,250,0.7)]' : 'border border-highlight/35 bg-deep text-highlight'
                  }`}
                >
                  {pad2(i + 1)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="t-small font-semibold leading-tight text-white">{stage.ru}</span>
                  <span className="t-micro font-display uppercase tracking-[0.12em] text-highlight/80">{stage.en}</span>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isSel ? (
                  <motion.div
                    key="detail"
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ duration: reducedMotion ? 0.01 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="glass ml-[46px] mt-2 p-4">
                      <StageBody stage={stage} compact />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex items-start gap-3 rounded-[14px] border border-dashed border-highlight/30 px-3 py-2.5">
        <RefreshCw className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
        <p className="t-small text-ice">
          <span className="font-semibold text-white">{LOOP_NOTE.lead}</span> {LOOP_NOTE.rest}
        </p>
      </div>
    </div>
  );
}
