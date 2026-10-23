import { useId, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Reveal, SceneFrame, SceneHeader, useScene } from '@/components/scene';
import { Glass } from '@/components/ui';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { BudgetDonut } from './budget/BudgetDonut';
import { SliceList, TeamBreakdown } from './budget/BudgetParts';
import { SCurve, SCurveNote } from './budget/SCurve';
import { FOOTNOTE, RESERVE_PERCENT, type SliceId } from './budget/budgetMath';
import { useHoverSelect } from './schedule/shared';

const TITLE = 'Бюджет проекта';
const LEAD = `В долларах США: базовый план затрат + резерв ${RESERVE_PERCENT}%`;
const PV_CAPTION = 'Базовый план затрат (PV) — основа для расчёта SPI и CPI';
const PV_HINT = 'Столбцы — затраты месяца, линия — накопленная PV, $';

type View = 'structure' | 'months';
const VIEWS: { id: View; label: string }[] = [
  { id: 'structure', label: 'Структура' },
  { id: 'months', label: 'По месяцам' },
];

/** 12 · Project Budget: кольцо статей + равенство «базовый план + резерв = итог», S-кривая PV, команда по ролям. */
export default function Scene12Budget() {
  const compact = useIsCompact();
  const slices = useHoverSelect<SliceId>(null);
  const months = useHoverSelect<string>(null);
  const activeMonth = months.active ? Number(months.active) : null;
  const bindMonth = (m: number) => months.bind(String(m));

  const donut = (
    <BudgetDonut
      active={slices.active}
      onHover={(id) => slices.setHovered(id)}
      onSelect={(id) => slices.select(id)}
    />
  );
  const curve = <SCurve activeMonth={activeMonth} activeSlice={slices.active} bindMonth={bindMonth} />;
  const note = <SCurveNote activeMonth={activeMonth} activeSlice={slices.active} />;
  const footnote = <p className="t-micro text-mute text-pretty">{FOOTNOTE}</p>;

  if (compact) {
    return (
      <SceneFrame justify="start">
        <SceneHeader title={TITLE} lead={LEAD} />
        <CompactBudget donut={donut} curve={curve} note={note} slices={slices} />
        <Reveal delay={0.4} className="mt-3 pb-2">
          {footnote}
        </Reveal>
      </SceneFrame>
    );
  }

  return (
    <SceneFrame justify="center">
      <SceneHeader title={TITLE} lead={LEAD} />
      <div
        className="mt-[var(--gap-3)] grid items-stretch gap-[var(--gap-3)]"
        style={{ gridTemplateColumns: 'minmax(0, 1.42fr) minmax(0, 1fr)' }}
      >
        <Reveal delay={0.2} className="min-w-0">
          <Glass strong className="flex h-full flex-col gap-[var(--gap-2)] p-[var(--gap-3)]">
            <div
              className="grid items-center gap-[var(--gap-3)]"
              style={{ gridTemplateColumns: 'clamp(196px, calc(var(--u) * 16.5), 330px) minmax(0, 1fr)' }}
            >
              {donut}
              <SliceList active={slices.active} bind={slices.bind} />
            </div>
            <TeamBreakdown active={slices.active} bind={slices.bind} />
          </Glass>
        </Reveal>
        <Reveal delay={0.3} className="min-w-0">
          <Glass strong className="flex h-full flex-col p-[var(--gap-3)]">
            <p className="t-small font-semibold leading-snug text-white">{PV_CAPTION}</p>
            <p className="t-micro mt-1 flex flex-wrap items-center gap-x-[var(--gap-1)] gap-y-1 text-mute">
              <span className="chip chip-plan">план</span>
              {PV_HINT}
            </p>
            <div className="mt-[var(--gap-2)] flex min-h-[clamp(190px,calc(var(--u)*15),330px)] flex-1 flex-col">{curve}</div>
            <div className="mt-[calc(var(--gap-1)*0.8)]">{note}</div>
          </Glass>
        </Reveal>
      </div>
      <Reveal delay={0.5} className="mt-[var(--gap-2)]">
        {footnote}
      </Reveal>
    </SceneFrame>
  );
}

function CompactBudget({
  donut,
  curve,
  note,
  slices,
}: {
  donut: ReactNode;
  curve: ReactNode;
  note: ReactNode;
  slices: ReturnType<typeof useHoverSelect<SliceId>>;
}) {
  const [view, setView] = useState<View>('structure');
  const { reducedMotion } = useScene();
  const idPrefix = useId().replace(/:/g, '');
  return (
    <>
      <Reveal delay={0.15} className="mt-3">
        <div role="tablist" aria-label="Вид бюджета" className="glass-strong inline-flex rounded-full p-1" style={{ borderRadius: 999 }}>
          {VIEWS.map((v) => {
            const on = v.id === view;
            return (
              <button
                key={v.id}
                id={`${idPrefix}-${v.id}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`${idPrefix}-panel`}
                onClick={() => setView(v.id)}
                className={`relative z-10 min-w-[118px] cursor-pointer rounded-full px-4 py-1.5 t-small font-semibold transition-colors duration-300 ${
                  on ? 'text-white' : 'text-soft'
                }`}
              >
                {on ? (
                  <motion.span
                    layoutId={`${idPrefix}-pill`}
                    className="absolute inset-0 -z-10 rounded-full"
                    style={{ background: 'var(--grad-brand)', boxShadow: '0 8px 24px -10px rgba(37,80,250,0.8)' }}
                    transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                  />
                ) : null}
                {v.label}
              </button>
            );
          })}
        </div>
      </Reveal>
      <div id={`${idPrefix}-panel`} role="tabpanel" aria-labelledby={`${idPrefix}-${view}`} className="mt-3">
        {view === 'structure' ? (
          <div className="grid gap-3 landscape:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
            <Reveal delay={0.2}>
              <Glass strong className="flex justify-center p-4">
                <div className="w-full max-w-[260px]">{donut}</div>
              </Glass>
            </Reveal>
            <Reveal delay={0.25} className="flex flex-col gap-3">
              <Glass strong className="p-3">
                <SliceList active={slices.active} bind={slices.bind} />
              </Glass>
              <TeamBreakdown active={slices.active} bind={slices.bind} compact />
            </Reveal>
          </div>
        ) : (
          <Glass strong className="p-3">
            <p className="t-small font-semibold leading-snug text-white">{PV_CAPTION}</p>
            <p className="t-micro mt-0.5 text-mute">{PV_HINT}</p>
            <div className="mt-3 flex h-[260px] flex-col">{curve}</div>
            <div className="mt-2">{note}</div>
          </Glass>
        )}
      </div>
    </>
  );
}
