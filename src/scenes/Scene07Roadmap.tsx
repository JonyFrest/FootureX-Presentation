import { useState } from 'react';
import { SceneFrame, SceneHeader, Reveal, useScene } from '@/components/scene';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { Timeline } from './s07/Timeline';
import { TimelineMobile } from './s07/TimelineMobile';

const TITLE = 'Дорожная карта развития';
const LEAD = 'Каждый этап развития FootureX требует своей кадровой стратегии.';

export default function Scene07Roadmap() {
  const { ready, reducedMotion } = useScene();
  const compact = useIsCompact();
  const [selected, setSelected] = useState(0);

  if (compact) {
    return (
      <SceneFrame justify="start">
        <SceneHeader title={TITLE} lead={LEAD} />
        <Reveal delay={0.2} className="mt-[var(--gap-3)]">
          <TimelineMobile selected={selected} onSelect={setSelected} ready={ready} reducedMotion={reducedMotion} />
        </Reveal>
      </SceneFrame>
    );
  }

  return (
    <SceneFrame justify="center">
      <SceneHeader title={TITLE} lead={LEAD} />
      <Reveal delay={0.2} className="mt-[var(--gap-4)]">
        <Timeline selected={selected} onSelect={setSelected} ready={ready} reducedMotion={reducedMotion} />
      </Reveal>
    </SceneFrame>
  );
}
