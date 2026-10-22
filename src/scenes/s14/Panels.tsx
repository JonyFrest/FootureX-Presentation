import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Glass } from '@/components/ui';
import { CONCLUSIONS, PILLARS, RECOMMENDATIONS, type Pillar } from './data';

const EASE = [0.16, 1, 0.3, 1] as const;
const pad2 = (n: number) => String(n).padStart(2, '0');

/** Инструменты и целевое значение выбранного измерения контроля. */
export function PillarDetail({ selected, reducedMotion }: { selected: number; reducedMotion: boolean }) {
  const pillar = PILLARS[selected];
  return (
    <Glass strong className="relative h-full overflow-hidden p-[clamp(16px,calc(var(--u)*1.8),36px)]" aria-live="polite">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent"
      />
      {/* Все измерения в одной ячейке сетки: высота панели = самое длинное измерение, без скачков */}
      <div className="grid">
        {PILLARS.map((p, i) => (
          <div key={p.id} className="invisible [grid-area:1/1]" aria-hidden>
            <PillarBody pillar={p} index={i} />
          </div>
        ))}
        <div className="[grid-area:1/1]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pillar.id}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: reducedMotion ? 0.01 : 0.32, ease: EASE }}
            >
              <PillarBody pillar={pillar} index={selected} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Glass>
  );
}

function PillarBody({ pillar, index }: { pillar: Pillar; index: number }) {
  return (
    <div>
      <p className="t-micro font-display uppercase tracking-[0.18em] text-highlight">
        {pad2(index + 1)} / {pad2(PILLARS.length)} · {pillar.en}
      </p>
      <h2 className="t-h3 mt-1 text-white">{pillar.ru}</h2>
      <div className="mt-[var(--gap-2)]">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="t-stat text-gradient whitespace-nowrap">{pillar.value}</span>
          {pillar.unit ? <span className="t-small font-medium text-highlight">{pillar.unit}</span> : null}
        </p>
        <span className="chip chip-plan mt-1.5">целевое значение · план</span>
      </div>
      <ul className="mt-[var(--gap-3)] flex flex-col gap-[var(--gap-1)]" aria-label="Инструменты контроля">
        {pillar.instruments.map((item) => (
          <li key={item} className="flex items-start gap-[var(--gap-1)]">
            <span aria-hidden className="mt-[0.5em] size-[0.42em] shrink-0 rotate-45 border border-secondary bg-secondary/30" />
            <span className="t-small leading-snug text-ice">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Выводы / Рекомендации — вкладки, чтобы всё помещалось на 1366×768 без прокрутки. */
export function Takeaways({ reducedMotion }: { reducedMotion: boolean }) {
  const [tab, setTab] = useState<'conclusions' | 'recs'>('conclusions');
  const id = useId();
  const tabs = [
    { id: 'conclusions' as const, label: 'Выводы' },
    { id: 'recs' as const, label: 'Рекомендации' },
  ];

  return (
    <Glass className="relative flex h-full flex-col p-[clamp(16px,calc(var(--u)*1.8),36px)]">
      <div role="tablist" aria-label="Итоги" className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
        {tabs.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${id}-tab-${t.id}`}
              aria-selected={on}
              aria-controls={`${id}-panel`}
              onClick={() => setTab(t.id)}
              className={`t-small relative flex-1 cursor-pointer rounded-full px-3 py-1.5 font-medium transition-[color,transform] duration-300 hover:-translate-y-0.5 ${
                on ? 'text-white' : 'text-soft hover:text-white'
              }`}
            >
              {on ? (
                <motion.span
                  layoutId={`${id}-pill`}
                  className="absolute inset-0 rounded-full bg-[image:var(--grad-brand)] shadow-[0_8px_24px_-8px_rgba(37,80,250,0.9)]"
                  transition={{ duration: reducedMotion ? 0 : 0.35, ease: EASE }}
                />
              ) : null}
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Обе вкладки в одной ячейке сетки: высота панели не прыгает при переключении */}
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} className="mt-[var(--gap-3)] grid">
        <div className="invisible [grid-area:1/1]" aria-hidden>
          <ConclusionList />
        </div>
        <div className="invisible [grid-area:1/1]" aria-hidden>
          <RecommendationList />
        </div>
        <div className="[grid-area:1/1]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0.01 : 0.3, ease: EASE }}
            >
              {tab === 'conclusions' ? <ConclusionList /> : <RecommendationList />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <p className="t-micro mt-auto pt-[var(--gap-2)] text-mute">Цифры — плановые значения проекта</p>
    </Glass>
  );
}

function ConclusionList() {
  return (
    <ol className="flex flex-col gap-[var(--gap-3)]">
      {CONCLUSIONS.map((c, i) => (
        <li key={i} className="flex gap-[var(--gap-2)]">
          <span className="t-h3 font-display font-normal text-brand-gradient leading-none">{pad2(i + 1)}</span>
          <p className="t-small leading-snug text-ice">
            {c.parts.map((part, k) =>
              typeof part === 'string' ? (
                <span key={k}>{part}</span>
              ) : (
                <strong key={k} className="font-semibold text-white">
                  {part.em}
                </strong>
              ),
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}

function RecommendationList() {
  return (
    <ul className="flex flex-col gap-[var(--gap-2)]">
      {RECOMMENDATIONS.map((r) => (
        <li key={r} className="flex items-center gap-[var(--gap-2)] rounded-[12px] border border-white/8 bg-white/[0.03] px-3 py-2">
          <span className="grid size-[clamp(24px,calc(var(--u)*2),34px)] shrink-0 place-items-center rounded-full bg-secondary/20 text-secondary">
            <ArrowUpRight className="size-[60%]" strokeWidth={2} aria-hidden />
          </span>
          <span className="t-small leading-snug text-ice">{r}</span>
        </li>
      ))}
    </ul>
  );
}
