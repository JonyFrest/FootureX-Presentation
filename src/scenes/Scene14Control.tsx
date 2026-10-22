import { useState } from 'react';
import { SceneFrame, SceneHeader, Reveal, useScene } from '@/components/scene';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { ControlCore } from './s14/ControlCore';
import { PillarDetail, Takeaways } from './s14/Panels';

const TITLE = 'Мониторинг, контроль и выводы';
const LEAD = 'Четыре измерения контроля MVP с целевыми значениями — и итоги проекта.';

export default function Scene14Control() {
  const { ready, reducedMotion } = useScene();
  const compact = useIsCompact();
  const [selected, setSelected] = useState(0);

  if (compact) {
    return (
      <SceneFrame justify="start">
        <SceneHeader title={TITLE} lead={LEAD} />
        <Reveal delay={0.16} className="mt-[var(--gap-3)]">
          <ControlCore selected={selected} onSelect={setSelected} ready={ready} reducedMotion={reducedMotion} compact />
        </Reveal>
        <Reveal delay={0.22} className="mt-[var(--gap-3)]">
          <PillarDetail selected={selected} reducedMotion={reducedMotion} />
        </Reveal>
        <Reveal delay={0.28} className="mt-[var(--gap-3)]">
          <Takeaways reducedMotion={reducedMotion} />
        </Reveal>
      </SceneFrame>
    );
  }

  return (
    <SceneFrame justify="center">
      <SceneHeader title={TITLE} lead={LEAD} />
      <div className="mt-[var(--gap-3)] grid grid-cols-[minmax(0,1.08fr)_minmax(0,1.84fr)] items-center gap-[var(--gap-4)]">
        <Reveal delay={0.12} scale={0.95}>
          <ControlCore selected={selected} onSelect={setSelected} ready={ready} reducedMotion={reducedMotion} />
        </Reveal>
        {/* Две панели одной высоты: инструменты измерения и итоги */}
        <div className="grid grid-cols-[minmax(0,0.84fr)_minmax(0,1fr)] items-stretch gap-[var(--gap-4)]">
          <Reveal delay={0.2} className="h-full">
            <PillarDetail selected={selected} reducedMotion={reducedMotion} />
          </Reveal>
          <Reveal delay={0.28} className="h-full">
            <Takeaways reducedMotion={reducedMotion} />
          </Reveal>
        </div>
      </div>
    </SceneFrame>
  );
}
