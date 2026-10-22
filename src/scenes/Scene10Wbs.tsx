import { SceneFrame, SceneHeader } from '@/components/scene';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { WbsDesktop } from './wbs/WbsDesktop';
import { WbsMobile } from './wbs/WbsMobile';

/**
 * 10 · WBS — иерархическая структура работ: проект → 4 результата → 13 пакетов работ,
 * доли результатов, ёмкость команды и буфер, задел вне содержания MVP.
 * Перекрёстная подсветка «результат ↔ строки таблицы». Данные — src/data/project.ts.
 */
export default function Scene10Wbs() {
  const compact = useIsCompact();
  return (
    <SceneFrame justify={compact ? 'start' : 'center'}>
      <SceneHeader title="Иерархическая структура работ" className="max-w-none!" />
      {compact ? <WbsMobile /> : <WbsDesktop />}
    </SceneFrame>
  );
}
