import { useState } from 'react';
import { Reveal, SceneFrame, SceneHeader } from '@/components/scene';
import { Glass } from '@/components/ui';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { GanttChart } from './schedule/GanttChart';
import { ScheduleDetail } from './schedule/ScheduleDetail';
import { ScheduleMobile } from './schedule/ScheduleMobile';
import { CriticalToggle } from './schedule/parts';
import { SUMMARY } from './schedule/gantt';
import { useHoverSelect } from './schedule/shared';

const TITLE = 'Календарный план';

/**
 * 11 · Schedule · Gantt — диаграмма Ганта проекта: 12 спринтов по месяцам, пакеты WBS по результатам,
 * критический путь, задел из буфера и вехи M1–M5. Наведение / фокус / касание показывает детали.
 */
export default function Scene11Schedule() {
  const compact = useIsCompact();
  const { active, pinned, bind, select } = useHoverSelect<string>(null);
  const [criticalMode, setCriticalMode] = useState(false);
  const toggleCritical = () => setCriticalMode((v) => !v);

  if (compact) {
    return (
      <SceneFrame justify="start">
        <SceneHeader title={TITLE} lead={SUMMARY.line} />
        <Reveal delay={0.15} className="mt-3 flex flex-wrap items-center gap-2">
          <CriticalToggle on={criticalMode} onToggle={toggleCritical} />
          <span className="chip chip-plan">план</span>
        </Reveal>
        <div className="mt-3 pb-2">
          <ScheduleMobile activeKey={pinned} onSelect={select} criticalMode={criticalMode} />
        </div>
      </SceneFrame>
    );
  }

  return (
    <SceneFrame justify="center">
      <div className="flex items-end justify-between gap-[var(--gap-4)]">
        <SceneHeader title={TITLE} className="max-w-none! min-w-0 shrink-0" />
        <Reveal delay={0.2} className="min-w-0 flex-1" y={10}>
          <ScheduleDetail
            activeKey={active}
            className="ml-auto h-[clamp(84px,calc(var(--u)*6.2),124px)] max-w-[clamp(400px,calc(var(--u)*40),760px)]"
          />
        </Reveal>
      </div>
      <Reveal delay={0.15} className="mt-[var(--gap-3)]">
        <Glass strong className="px-[var(--gap-3)] py-[var(--gap-2)]">
          <GanttChart
            activeKey={active}
            pinnedKey={pinned}
            bind={bind}
            criticalMode={criticalMode}
            onToggleCritical={toggleCritical}
          />
        </Glass>
      </Reveal>
    </SceneFrame>
  );
}
