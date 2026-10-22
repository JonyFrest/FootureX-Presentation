import { useState } from 'react';
import { SceneFrame, SceneHeader, Reveal, useScene } from '@/components/scene';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { LifecycleRing } from './s04/LifecycleRing';
import { StageDetail } from './s04/StageDetail';
import { MobileStepper } from './s04/MobileStepper';

const TITLE = 'Жизненный цикл проекта';
const LEAD = 'Пять групп процессов PMI ведут FootureX MVP от устава до приёмки.';

export default function Scene04Lifecycle() {
  const { ready, reducedMotion } = useScene();
  const compact = useIsCompact();
  const [selected, setSelected] = useState(0);

  if (compact) {
    return (
      <SceneFrame justify="start">
        <SceneHeader title={TITLE} lead={LEAD} />
        <Reveal delay={0.2} className="mt-[var(--gap-3)]">
          <MobileStepper selected={selected} onSelect={setSelected} reducedMotion={reducedMotion} />
        </Reveal>
      </SceneFrame>
    );
  }

  return (
    <SceneFrame justify="center">
      <div className="grid w-full grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] items-center gap-[var(--gap-4)]">
        <div className="flex flex-col gap-[var(--gap-4)]">
          <SceneHeader title={TITLE} lead={LEAD} />
          <Reveal delay={0.24}>
            <StageDetail selected={selected} onSelect={setSelected} reducedMotion={reducedMotion} />
          </Reveal>
        </div>
        <Reveal delay={0.12} scale={0.96} y={24}>
          <LifecycleRing selected={selected} onSelect={setSelected} ready={ready} reducedMotion={reducedMotion} />
        </Reveal>
      </div>
    </SceneFrame>
  );
}
