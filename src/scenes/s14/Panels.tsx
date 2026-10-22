import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Check } from 'lucide-react';
import { Glass } from '@/components/ui';
import { CONCLUSIONS, PILLARS, RECOMMENDATIONS, type Highlight } from './data';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Инструменты выбранной опоры удержания. */
export function PillarDetail({ selected, reducedMotion }: { selected: number; reducedMotion: boolean }) {
  const pillar = PILLARS[selected];
  return (
    <Glass strong className="relative h-full overflow-hidden p-[clamp(16px,calc(var(--u)*1.8),36px)]" aria-live="polite">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent"
      />
      <div className="min-h-[clamp(230px,calc(var(--u)*18),350px)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pillar.id}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.32, ease: EASE }}
          >
            <p className="t-micro font-display uppercase tracking-[0.18em] text-highlight">
              {String(selected + 1).padStart(2, '0')} / 04 · {pillar.en}
            </p>
            <h2 className="t-h3 mt-1 text-white">{pillar.ru}</h2>
            <HighlightView h={pillar.highlight} />
            <ul className="mt-[var(--gap-3)] flex flex-col gap-[var(--gap-1)]">
              {pillar.items.map((item) => (
                <li key={item} className="flex items-start gap-[var(--gap-1)]">
                  <span className="mt-[0.2em] grid size-[1.25em] shrink-0 place-items-center rounded-full bg-secondary/20 text-secondary">
                    <Check className="size-[70%]" strokeWidth={2.4} aria-hidden />
                  </span>
                  <span className="t-small leading-snug text-ice">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </Glass>
  );
}

function HighlightView({ h }: { h: Highlight }) {
  if (h.kind === 'stat') {
    return (
      <div className="mt-[var(--gap-2)]">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="t-stat text-gradient whitespace-nowrap">{h.value}</span>
          {h.unit ? <span className="t-small font-medium text-highlight">{h.unit}</span> : null}
        </p>
        <p className="t-micro mt-1 text-mute">{h.caption}</p>
      </div>
    );
  }
  if (h.kind === 'ladder') {
    return (
      <div className="mt-[var(--gap-2)]">
        <ol className="flex items-end gap-1.5" aria-label="Грейды">
          {h.steps.map((step, i) => (
            <li key={step} className="flex flex-1 flex-col gap-1">
              <span className="t-micro text-center font-display uppercase text-ice">{step}</span>
              <span
                className="block rounded-t-md border border-b-0 border-secondary/40"
                style={{
                  height: `calc(var(--u) * ${0.8 + i * 0.7} + 6px)`,
                  background: `linear-gradient(180deg, rgba(37,147,250,${0.25 + i * 0.18}) 0%, rgba(37,80,250,0.08) 100%)`,
                }}
              />
            </li>
          ))}
        </ol>
        <p className="t-micro mt-1 text-mute">{h.caption}</p>
      </div>
    );
  }
  return (
    <div className="mt-[var(--gap-2)] rounded-[12px] border border-secondary/30 bg-[rgba(37,80,250,0.12)] px-3 py-2.5">
      <p className="t-small font-display text-brand-gradient leading-snug">{h.text}</p>
      <p className="t-micro mt-0.5 text-mute">{h.caption}</p>
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
    <Glass className="relative h-full p-[clamp(16px,calc(var(--u)*1.8),36px)]">
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

      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${tab}`}
        className="mt-[var(--gap-3)] min-h-[clamp(200px,calc(var(--u)*16),320px)]"
      >
        <AnimatePresence mode="wait" initial={false}>
          {tab === 'conclusions' ? (
            <motion.ol
              key="c"
              className="flex flex-col gap-[var(--gap-3)]"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0.01 : 0.3, ease: EASE }}
            >
              {CONCLUSIONS.map((c, i) => (
                <li key={i} className="flex gap-[var(--gap-2)]">
                  <span className="t-h3 font-display font-normal text-brand-gradient leading-none">{String(i + 1).padStart(2, '0')}</span>
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
            </motion.ol>
          ) : (
            <motion.ul
              key="r"
              className="flex flex-col gap-[var(--gap-2)]"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0.01 : 0.3, ease: EASE }}
            >
              {RECOMMENDATIONS.map((r) => (
                <li key={r} className="flex items-center gap-[var(--gap-2)] rounded-[12px] border border-white/8 bg-white/[0.03] px-3 py-2">
                  <span className="grid size-[clamp(24px,calc(var(--u)*2),34px)] shrink-0 place-items-center rounded-full bg-secondary/20 text-secondary">
                    <ArrowUpRight className="size-[60%]" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="t-small leading-snug text-ice">{r}</span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </Glass>
  );
}
