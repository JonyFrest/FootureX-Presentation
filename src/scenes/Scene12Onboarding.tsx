import { useState } from 'react';
import { Reveal, SceneFrame, SceneHeader } from '@/components/scene';
import { Glass } from '@/components/ui';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { TimelineDesktop } from './s12/TimelineDesktop';
import { TimelineMobile } from './s12/TimelineMobile';
import { useDaySweep } from './s12/useDaySweep';

export default function Scene12Onboarding() {
  const [selected, setSelected] = useState(0);
  const vertical = useMediaQuery('(max-width: 700px)');
  const sweep = useDaySweep();

  return (
    <SceneFrame justify="center">
      <div className="flex flex-wrap items-end justify-between gap-x-[var(--gap-4)] gap-y-[var(--gap-2)]">
        <SceneHeader
          className="min-w-0 flex-[1_1_520px]"
          title="Адаптация: 90 дней"
          lead="План на весь испытательный срок — до 3 месяцев по ТК РУз. Две дорожки: сотрудник и HR."
        />
        <Reveal delay={0.2} className="pb-1">
          <span className="chip chip-plan uppercase tracking-[0.14em]">План адаптации</span>
        </Reveal>
      </div>

      <Reveal delay={0.3} className="mt-[var(--gap-3)]">
        {vertical ? (
          <TimelineMobile selected={selected} onSelect={setSelected} sweep={sweep} />
        ) : (
          <Glass className="px-[var(--gap-3)] py-[var(--gap-2)]">
            <TimelineDesktop selected={selected} onSelect={setSelected} sweep={sweep} />
          </Glass>
        )}
      </Reveal>
    </SceneFrame>
  );
}
