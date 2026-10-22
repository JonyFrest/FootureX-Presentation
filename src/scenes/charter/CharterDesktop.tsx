import { useState } from 'react';
import { Reveal } from '@/components/scene';
import { Glass } from '@/components/ui';
import { PROJECT, SMART } from '@/data/project';
import { StackedPanels, Tabs, useHoverSelect } from './kit';
import { CHARTER_TABS, type CharterTab, type SmartLetter } from './charterData';
import {
  AcceptContent,
  Approval,
  FACTS,
  FactValue,
  GoalSentence,
  LimitsContent,
  MilestoneTrack,
  ScopeContent,
  SmartTile,
  type LetterBind,
} from './parts';

const ID_BASE = 's08-charter';

/** Документ устава: код и название проекта, цель (главный акцент) и разбор SMART. */
function CharterDocument({ active, bind }: { active: SmartLetter | null; bind: LetterBind }) {
  return (
    <Glass strong className="relative flex w-full flex-col overflow-hidden p-[var(--gap-3)]">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(180deg,#2593FA,#2550FA)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(37,80,250,0.28),transparent_65%)]"
      />
      <div className="relative flex flex-wrap items-center gap-x-[var(--gap-2)] gap-y-1">
        <span className="rounded-full border border-secondary/50 bg-primary/25 px-3 py-1 font-display text-[length:var(--fs-small)] leading-none tracking-[0.04em] text-white">
          {PROJECT.code}
        </span>
        <span className="t-small text-highlight">{PROJECT.program}</span>
        <Approval className="ml-auto" />
      </div>
      <h2 className="t-h2 relative mt-[var(--gap-1)] text-balance text-white">{PROJECT.name}</h2>

      <p className="t-small mt-[var(--gap-2)] flex items-center gap-[var(--gap-2)] font-semibold text-highlight">
        Цель проекта
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-highlight/45 to-transparent" />
      </p>
      <GoalSentence
        active={active}
        bind={bind}
        className="t-h3 mt-[calc(var(--gap-1)*0.8)] font-medium text-pretty [line-height:1.5]"
      />

      <div
        className="mt-auto grid gap-[var(--gap-1)] pt-[var(--gap-3)]"
        style={{ gridTemplateColumns: `repeat(${SMART.length}, minmax(0, 1fr))` }}
        aria-label="Цель по SMART"
      >
        {SMART.map((item) => (
          <SmartTile
            key={item.letter}
            item={item}
            on={active === item.letter}
            dim={active !== null && active !== item.letter}
            handlers={bind(item.letter)}
          />
        ))}
      </div>
    </Glass>
  );
}

function CharterTabs() {
  const [tab, setTab] = useState<CharterTab>('scope');
  return (
    <Glass strong className="flex w-full flex-col p-[var(--gap-3)]">
      <Tabs
        tabs={CHARTER_TABS.map((t) => ({ id: t.id, label: t.label }))}
        value={tab}
        onChange={setTab}
        idBase={ID_BASE}
        label="Разделы устава"
        stretch
      />
      <StackedPanels
        className="mt-[var(--gap-3)] flex-1"
        ids={CHARTER_TABS.map((t) => t.id)}
        value={tab}
        idBase={ID_BASE}
        render={(id) => (id === 'scope' ? <ScopeContent /> : id === 'limits' ? <LimitsContent /> : <AcceptContent />)}
      />
    </Glass>
  );
}

function FactsStrip() {
  return (
    <Glass
      className="grid items-stretch"
      style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1.1fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,1.15fr) minmax(0,1.45fr)' }}
    >
      {FACTS.map((fact, i) => (
        <div
          key={fact.id}
          className={`min-w-0 px-[var(--gap-3)] py-[var(--gap-2)] ${i > 0 ? 'border-l border-white/[0.08]' : ''} ${
            i === 0 ? '' : 'pl-[var(--gap-2)]'
          }`}
        >
          <p className="t-small text-mute">{fact.label}</p>
          <div className="mt-[calc(var(--gap-1)*0.8)]">
            <FactValue fact={fact} />
          </div>
        </div>
      ))}
      <div className="min-w-0 border-l border-white/[0.08] px-[var(--gap-3)] py-[var(--gap-2)]">
        <MilestoneTrack />
      </div>
    </Glass>
  );
}

export function CharterDesktop() {
  const { active, bind } = useHoverSelect<SmartLetter>(null, { toggle: true });
  return (
    <div className="mt-[var(--gap-3)] flex flex-col gap-[var(--gap-2)]">
      <div className="grid items-stretch gap-[var(--gap-3)]" style={{ gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)' }}>
        <Reveal delay={0.15} className="flex min-w-0">
          <CharterDocument active={active} bind={bind} />
        </Reveal>
        <Reveal delay={0.26} className="flex min-w-0">
          <CharterTabs />
        </Reveal>
      </div>
      <Reveal delay={0.36}>
        <FactsStrip />
      </Reveal>
    </div>
  );
}
