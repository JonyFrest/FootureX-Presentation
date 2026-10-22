import { SceneFrame, SceneHeader } from '@/components/scene';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { OrgChart } from './s08/OrgChart';
import { OrgTree } from './s08/OrgTree';

/**
 * 08 · Org Structure — интерактивная оргструктура этапа 1:
 * CEO → 5 функциональных направлений → сотрудники. Данные — src/data/hr.ts.
 */
export default function Scene08Structure() {
  const compact = useIsCompact();
  return (
    <SceneFrame justify="center">
      <SceneHeader title="Организационная структура" />
      <div className="mt-[var(--gap-4)]">{compact ? <OrgTree /> : <OrgChart />}</div>
    </SceneFrame>
  );
}
