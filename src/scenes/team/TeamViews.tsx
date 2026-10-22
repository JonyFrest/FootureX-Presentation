import { useState } from 'react';
import { Reveal, SceneHeader } from '@/components/scene';
import { Glass } from '@/components/ui';
import { STAKEHOLDERS } from '@/data/project';
import { StackedPanels, Tabs, useHoverSelect } from '../charter/kit';
import { RaciCards, RaciDetail, RaciLegend, RaciMatrix } from './Raci';
import { CommunicationPlan, StakeholderDetail, StakeholderGroups, StakeholderMatrix } from './Stakeholders';

export type TeamTab = 'raci' | 'stakeholders';

const TABS = [
  { id: 'raci' as const, label: 'Команда и RACI' },
  { id: 'stakeholders' as const, label: 'Стейкхолдеры', badge: STAKEHOLDERS.length },
];
const TAB_IDS = TABS.map((t) => t.id);
const ID_BASE = 's09-team';

/* ------------------------------------------------------------------
   Проектор / ноутбук.
   ------------------------------------------------------------------ */

function RaciView({ visible }: { visible: boolean }) {
  const { active, bind } = useHoverSelect<string>(null, { toggle: true });
  return (
    <div className="grid h-full items-stretch gap-[var(--gap-3)]" style={{ gridTemplateColumns: 'minmax(0, 8fr) minmax(0, 4fr)' }}>
      <Glass strong className="min-w-0 p-[var(--gap-3)] pt-[var(--gap-2)]">
        <RaciMatrix activeKey={active} bind={bind} visible={visible} />
      </Glass>
      <div className="flex min-w-0 flex-col gap-[var(--gap-2)]">
        <Glass strong className="relative flex-1 overflow-hidden p-[var(--gap-3)]">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(180deg,#2593FA,#2550FA)]"
          />
          <RaciDetail activeKey={active} />
        </Glass>
        <Glass className="p-[var(--gap-3)]">
          <RaciLegend />
        </Glass>
      </div>
    </div>
  );
}

function StakeholdersView({ visible }: { visible: boolean }) {
  const { active, bind } = useHoverSelect<string>(STAKEHOLDERS[0]?.id ?? null);
  return (
    <div className="grid h-full items-stretch gap-[var(--gap-3)]" style={{ gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)' }}>
      <Glass strong className="flex min-w-0 flex-col p-[var(--gap-3)] pb-[var(--gap-2)]">
        <div className="min-h-0 flex-1">
          <StakeholderMatrix active={active} bind={bind} visible={visible} />
        </div>
      </Glass>
      <div className="flex min-w-0 flex-col gap-[var(--gap-2)]">
        <Glass strong className="relative overflow-hidden p-[var(--gap-3)]">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(180deg,#2593FA,#2550FA)]"
          />
          <StakeholderDetail active={active} />
        </Glass>
        <Glass className="flex-1 p-[var(--gap-3)]">
          <CommunicationPlan />
        </Glass>
      </div>
    </div>
  );
}

export function TeamDesktop() {
  const [tab, setTab] = useState<TeamTab>('raci');
  return (
    <>
      <div className="flex items-end justify-between gap-[var(--gap-3)]">
        <SceneHeader title="Команда и стейкхолдеры" />
        <Reveal delay={0.2} y={10} className="shrink-0 pb-1">
          <Tabs tabs={TABS} value={tab} onChange={setTab} idBase={ID_BASE} label="Разделы сцены" />
        </Reveal>
      </div>
      <Reveal delay={0.28} className="mt-[var(--gap-3)]">
        <StackedPanels
          ids={TAB_IDS}
          value={tab}
          idBase={ID_BASE}
          render={(id, on) => (id === 'raci' ? <RaciView visible={on} /> : <StakeholdersView visible={on} />)}
        />
      </Reveal>
    </>
  );
}

/* ------------------------------------------------------------------
   Телефон: вкладки + карточки.
   ------------------------------------------------------------------ */

export function TeamMobile() {
  const [tab, setTab] = useState<TeamTab>('raci');
  return (
    <>
      <SceneHeader title="Команда и стейкхолдеры" />
      <Reveal delay={0.16} className="mt-[var(--gap-3)]">
        <Tabs tabs={TABS} value={tab} onChange={setTab} idBase={ID_BASE} label="Разделы сцены" stretch />
      </Reveal>
      <Reveal delay={0.24} className="mt-[var(--gap-2)]">
        {TAB_IDS.map((id) =>
          id === tab ? (
            <div key={id} role="tabpanel" id={`${ID_BASE}-panel-${id}`} aria-labelledby={`${ID_BASE}-tab-${id}`}>
              {id === 'raci' ? (
                <RaciCards />
              ) : (
                <div className="grid gap-[var(--gap-2)]">
                  <StakeholderGroups />
                  <Glass className="p-[var(--gap-3)]">
                    <CommunicationPlan compact />
                  </Glass>
                </div>
              )}
            </div>
          ) : null,
        )}
      </Reveal>
    </>
  );
}
