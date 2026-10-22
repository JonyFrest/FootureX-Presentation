import { SceneFrame, SceneHeader } from '@/components/scene';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { CharterDesktop } from './charter/CharterDesktop';
import { CharterMobile } from './charter/CharterMobile';

/**
 * 08 · Project Charter — устав проекта «FootureX MVP»: цель как главный акцент,
 * разбор SMART (буква ↔ фрагмент цели), содержание и границы, ограничения,
 * критерии приёмки и паспорт проекта. Все данные — src/data/project.ts.
 */
export default function Scene08Charter() {
  const compact = useIsCompact();
  return (
    <SceneFrame justify={compact ? 'start' : 'center'}>
      <SceneHeader title="Устав проекта" />
      {compact ? <CharterMobile /> : <CharterDesktop />}
    </SceneFrame>
  );
}
