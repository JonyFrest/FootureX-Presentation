import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Reveal, useScene } from '@/components/scene';
import { Glass } from '@/components/ui';
import { PROJECT, SMART } from '@/data/project';
import { EASE, useHoverSelect } from './kit';
import { CHARTER_TABS, type CharterTab, type SmartLetter } from './charterData';
import {
  AcceptContent,
  FACTS,
  FactValue,
  GoalSentence,
  LimitsContent,
  MilestoneTrack,
  ScopeContent,
  SmartTile,
} from './parts';

function AccordionItem({ id, label, count, open, onToggle }: { id: CharterTab; label: string; count: number; open: boolean; onToggle: () => void }) {
  const { reducedMotion } = useScene();
  const regionId = useId();
  return (
    <Glass className={`overflow-hidden transition-[border-color] duration-300 ${open ? 'border-secondary/50!' : ''}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 px-[var(--gap-3)] py-[var(--gap-2)] text-left"
      >
        <span className="t-small flex-1 font-semibold text-white">{label}</span>
        <span className="chip t-num">{count}</span>
        <ChevronDown
          aria-hidden
          className={`size-4 shrink-0 text-highlight transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={regionId}
            key="body"
            initial={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.12 : 0.32, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-[var(--gap-3)] pt-[var(--gap-2)] pb-[var(--gap-3)]">
              {id === 'scope' ? <ScopeContent dense /> : id === 'limits' ? <LimitsContent /> : <AcceptContent />}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Glass>
  );
}

/** Телефон: карточки сверху вниз — документ и цель, SMART, паспорт, разделы-аккордеон. */
export function CharterMobile() {
  const { active, bind } = useHoverSelect<SmartLetter>(null, { toggle: true });
  const [open, setOpen] = useState<CharterTab | null>('scope');

  return (
    <div className="mt-[var(--gap-3)] grid gap-[var(--gap-2)] min-[640px]:grid-cols-2 min-[640px]:items-start">
      <div className="grid gap-[var(--gap-2)]">
        <Reveal delay={0.12}>
          <Glass strong className="relative overflow-hidden p-[var(--gap-3)]">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(180deg,#2593FA,#2550FA)]"
            />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="rounded-full border border-secondary/50 bg-primary/25 px-2.5 py-1 font-display text-[length:var(--fs-micro)] leading-none text-white">
                {PROJECT.code}
              </span>
              <span className="t-micro text-highlight">{PROJECT.program}</span>
            </div>
            <h2 className="t-h3 mt-2 text-white">{PROJECT.name}</h2>
            <p className="t-small mt-3 font-semibold text-highlight">Цель проекта</p>
            <GoalSentence active={active} bind={bind} className="t-small mt-1 font-medium [line-height:1.6]" />
          </Glass>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="grid gap-1.5" aria-label="Цель по SMART">
            {SMART.map((item) => (
              <SmartTile
                key={item.letter}
                item={item}
                layout="row"
                on={active === item.letter}
                dim={false}
                handlers={bind(item.letter)}
              />
            ))}
          </div>
        </Reveal>
      </div>

      <div className="grid gap-[var(--gap-2)]">
        <Reveal delay={0.24}>
          {/* Сетка 6 колонок: два текстовых факта по 3, три числовых по 2, вехи — на всю ширину. */}
          <Glass className="grid grid-cols-6">
            {FACTS.map((fact, i) => {
              const text = !fact.numeric;
              const firstInRow = i === 0 || i === FACTS.findIndex((f) => f.numeric);
              return (
                <div
                  key={fact.id}
                  className={`min-w-0 border-white/[0.08] p-[var(--gap-2)] ${text ? 'col-span-3' : 'col-span-2 border-t'} ${
                    firstInRow ? '' : 'border-l'
                  }`}
                >
                  <p className="t-micro text-mute">{fact.label}</p>
                  <div className="mt-1">
                    <FactValue fact={fact} />
                  </div>
                </div>
              );
            })}
            <div className="col-span-6 border-t border-white/[0.08] p-[var(--gap-2)]">
              <MilestoneTrack />
            </div>
          </Glass>
        </Reveal>

        {CHARTER_TABS.map((t, i) => (
          <Reveal key={t.id} delay={0.3 + i * 0.05}>
            <AccordionItem
              id={t.id}
              label={t.id === 'scope' ? 'Содержание проекта' : t.id === 'limits' ? 'Ограничения' : 'Критерии приёмки'}
              count={t.count}
              open={open === t.id}
              onToggle={() => setOpen((cur) => (cur === t.id ? null : t.id))}
            />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
