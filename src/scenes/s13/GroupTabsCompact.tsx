import { AnimatePresence, motion } from 'motion/react';
import { KPI_GROUPS } from '@/data/hr';
import { useScene } from '@/components/scene';
import { parseTarget } from './kpi';
import { TargetRing } from './TargetRing';
import { TargetValue } from './TargetValue';

interface Props {
  selected: number;
  onSelect: (index: number) => void;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Телефоны и узкие экраны: вкладки групп + карточки KPI выбранной группы. */
export function GroupTabsCompact({ selected, onSelect }: Props) {
  const { reducedMotion } = useScene();
  const group = KPI_GROUPS[selected];

  return (
    <div>
      <div role="tablist" aria-label="Группы KPI" className="grid grid-cols-2 gap-2 min-[600px]:grid-cols-4">
        {KPI_GROUPS.map((g, i) => {
          const isSel = i === selected;
          return (
            <button
              key={g.id}
              id={`s13m-tab-${g.id}`}
              type="button"
              role="tab"
              aria-selected={isSel}
              aria-controls="s13m-panel"
              tabIndex={0}
              onClick={() => onSelect(i)}
              className={`flex min-w-0 items-baseline gap-1.5 rounded-[var(--radius-sm)] border px-3 py-2 text-left transition-colors duration-300 ${
                isSel
                  ? 'border-[rgba(37,147,250,0.6)] bg-[rgba(37,147,250,0.18)] text-white'
                  : 'border-[rgba(142,180,255,0.16)] bg-[rgba(14,22,41,0.6)] text-soft'
              }`}
            >
              <span className="font-display t-micro text-highlight">{pad2(i + 1)}</span>
              <span className="t-small truncate font-semibold">{g.title}</span>
            </button>
          );
        })}
      </div>

      <div id="s13m-panel" role="tabpanel" aria-labelledby={`s13m-tab-${group.id}`} className="mt-[var(--gap-2)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={group.id}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={{ duration: reducedMotion ? 0 : 0.25 }}
            className="grid grid-cols-1 gap-2 min-[600px]:grid-cols-2"
          >
            {group.metrics.map((m, k) => {
              const t = parseTarget(m);
              const Icon = t.icon;
              return (
                <li key={m.label} className="glass flex items-center gap-3 px-3 py-2.5">
                  {t.kind === 'share' ? (
                    <TargetRing share={t.share} size={50} caption delay={k * 0.08} />
                  ) : (
                    <span className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-[var(--radius-sm)] border border-[rgba(142,180,255,0.22)] bg-[rgba(37,80,250,0.12)]">
                      <Icon className="h-5 w-5 text-highlight" aria-hidden />
                    </span>
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="t-small font-semibold leading-snug text-white">{m.label}</span>
                    <TargetValue target={t} size="sm" className="mt-0.5" />
                    <span className="t-micro leading-snug text-soft">{m.hint}</span>
                  </span>
                </li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </div>
    </div>
  );
}
