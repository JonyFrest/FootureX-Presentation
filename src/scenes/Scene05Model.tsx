import { SceneFrame, SceneHeader, Reveal, useScene } from '@/components/scene';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { FlowDiagram } from './s05/FlowDiagram';
import { FlowMobile } from './s05/FlowMobile';

const TITLE = 'Модель управления персоналом';
const LEAD =
  'HR-процессы развивают способности, мотивацию и возможности сотрудника — от них зависят эффективность и рост FootureX.';

export default function Scene05Model() {
  const { ready, reducedMotion } = useScene();
  const compact = useIsCompact();

  if (compact) {
    return (
      <SceneFrame justify="start">
        <SceneHeader title={TITLE} lead={LEAD} />
        <Reveal delay={0.2} className="mt-[var(--gap-3)]">
          <FlowMobile reducedMotion={reducedMotion} />
        </Reveal>
      </SceneFrame>
    );
  }

  return (
    <SceneFrame justify="center">
      <SceneHeader title={TITLE} lead={LEAD} className="!max-w-[min(100%,1200px)]" />
      <div className="mt-[var(--gap-4)]">
        <FlowDiagram ready={ready} reducedMotion={reducedMotion} />
      </div>
    </SceneFrame>
  );
}
