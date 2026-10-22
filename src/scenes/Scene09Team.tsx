import { SceneFrame } from '@/components/scene';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { TeamDesktop, TeamMobile } from './team/TeamViews';

/**
 * 09 · Team & Stakeholders — две вкладки: матрица RACI (роли × результаты WBS,
 * подсветка строки/столбца, ровно один «A» в столбце) и сетка стейкхолдеров
 * «влияние / заинтересованность» с планом коммуникаций. Данные — src/data/project.ts.
 */
export default function Scene09Team() {
  const compact = useIsCompact();
  return (
    <SceneFrame justify={compact ? 'start' : 'center'}>{compact ? <TeamMobile /> : <TeamDesktop />}</SceneFrame>
  );
}
