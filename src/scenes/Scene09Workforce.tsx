import { SceneFrame, SceneHeader } from '@/components/scene';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { WorkforceCards } from './s09/WorkforceCards';
import { WorkforceDesktop } from './s09/WorkforceDesktop';

/**
 * 09 · Workforce Planning — проект штатного расписания этапа 1:
 * численность по подразделениям, должности, оклады и окладный фонд (src/data/hr.ts).
 */
export default function Scene09Workforce() {
  const compact = useIsCompact();
  return (
    <SceneFrame justify="center">
      <SceneHeader title="Штатное расписание этапа 1" />
      {compact ? <WorkforceCards /> : <WorkforceDesktop />}
    </SceneFrame>
  );
}
