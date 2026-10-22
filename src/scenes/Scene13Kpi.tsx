import { useState } from 'react';
import { Reveal, SceneFrame, SceneHeader } from '@/components/scene';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ConsoleStrip } from './s13/ConsoleStrip';
import { GroupBoard } from './s13/GroupBoard';
import { GroupTabsCompact } from './s13/GroupTabsCompact';

export default function Scene13Kpi() {
  const [selected, setSelected] = useState(1);
  /** Полная панель 4 × 4 — только когда хватает ширины. */
  const board = useMediaQuery('(min-width: 1100px)');
  const phone = useMediaQuery('(max-width: 600px)');

  return (
    <SceneFrame justify="center">
      <div className="flex flex-wrap items-end gap-x-[var(--gap-4)] gap-y-[var(--gap-3)]">
        <SceneHeader
          className="min-w-0 flex-[1_1_calc(var(--u)*30)]"
          title="KPI-панель"
          lead="Целевые показатели этапа 1 по ролям — ориентиры для оценки и квартальных премий, а не достигнутые результаты."
        />
        <Reveal delay={0.2} className="min-w-0 flex-[999_1_620px]">
          <ConsoleStrip compact={phone} />
        </Reveal>
      </div>

      <Reveal delay={0.3} className="mt-[var(--gap-3)]">
        {board ? (
          <GroupBoard selected={selected} onSelect={setSelected} />
        ) : (
          <GroupTabsCompact selected={selected} onSelect={setSelected} />
        )}
      </Reveal>
    </SceneFrame>
  );
}
