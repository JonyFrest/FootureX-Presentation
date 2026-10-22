import { useState } from 'react';
import { FUNNEL_STAGES, HIRING_WAVE_POSITIONS, TIME_TO_HIRE_DAYS } from '@/data/hr';
import { Reveal, SceneFrame, SceneHeader } from '@/components/scene';
import { Glass } from '@/components/ui';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { CHANNELS } from './s11/channels';
import { FunnelHorizontal } from './s11/FunnelHorizontal';
import { FunnelVertical } from './s11/FunnelVertical';
import { HireSummary } from './s11/HireSummary';
import { StageDetail } from './s11/StageDetail';
import { DAY_FORMS, formatInt, plural } from './s11/format';

function ChannelsRow() {
  return (
    <div className="flex flex-col gap-[var(--gap-1)]">
      <p className="t-eyebrow">Каналы привлечения</p>
      <ul className="flex flex-wrap gap-[var(--gap-1)]">
        {CHANNELS.map((c) => (
          <li key={c} className="chip">
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Scene11Recruitment() {
  const [selected, setSelected] = useState(0);
  /** Телефон в портрете: вертикальная воронка. */
  const vertical = useMediaQuery('(max-width: 700px)');
  /** Каналы слева от воронки — только когда хватает ширины. */
  const wide = useMediaQuery('(min-width: 1100px)');
  const lead = `План этапа 1: ${formatInt(FUNNEL_STAGES[0].value)} откликов → ${HIRING_WAVE_POSITIONS} сотрудников, до ${TIME_TO_HIRE_DAYS} ${plural(TIME_TO_HIRE_DAYS, DAY_FORMS)} на вакансию.`;

  return (
    <SceneFrame justify="center">
      <div className="flex flex-wrap items-end justify-between gap-x-[var(--gap-4)] gap-y-[var(--gap-3)]">
        <SceneHeader className="min-w-0 flex-[1_1_480px]" title="Воронка найма" lead={lead} />
        <Reveal delay={0.22} className={vertical ? 'w-full' : 'shrink-0'}>
          <HireSummary compact={vertical} />
        </Reveal>
      </div>

      {vertical ? (
        <>
          <Reveal delay={0.3} className="mt-[var(--gap-3)]">
            <Glass className="px-[var(--gap-2)] py-[var(--gap-3)]">
              <FunnelVertical selected={selected} onSelect={setSelected} />
            </Glass>
          </Reveal>
          <Reveal delay={0.3} className="mt-[var(--gap-3)]">
            <StageDetail selected={selected} compact />
          </Reveal>
          <Reveal delay={0.36} className="mt-[var(--gap-3)]">
            <ChannelsRow />
          </Reveal>
        </>
      ) : (
        <>
          {!wide ? (
            <Reveal delay={0.26} className="mt-[var(--gap-3)]">
              <ChannelsRow />
            </Reveal>
          ) : null}
          <Reveal delay={0.3} className="mt-[var(--gap-3)]">
            <Glass className="px-[var(--gap-3)] py-[var(--gap-2)]">
              <FunnelHorizontal selected={selected} onSelect={setSelected} withSources={wide} />
            </Glass>
          </Reveal>
          <Reveal delay={0.38} className="mt-[var(--gap-3)]">
            <StageDetail selected={selected} compact={false} />
          </Reveal>
        </>
      )}
    </SceneFrame>
  );
}
