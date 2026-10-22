import { motion } from 'motion/react';
import { Clock3, Users } from 'lucide-react';
import { FUNNEL_STAGES, TIME_TO_HIRE_DAYS } from '@/data/hr';
import { useScene } from '@/components/scene';
import { Glass } from '@/components/ui';
import { DAY_FORMS, formatInt, formatPercent, pad2, plural } from './format';
import { STAGE_COUNT, stageConversion, stageDayRange } from './funnel';

/** Полоса срока закрытия вакансии: 5 отрезков пропорционально дням этапов. */
export function DaysBar({ selected, className = '' }: { selected: number; className?: string }) {
  return (
    <div className={`flex h-1.5 w-full gap-[2px] ${className}`} aria-hidden>
      {FUNNEL_STAGES.map((s, i) => (
        <span
          key={s.id}
          className="h-full rounded-full transition-all duration-300"
          style={{
            flexGrow: s.days,
            flexBasis: 0,
            background: i === selected ? 'var(--grad-brand)' : 'rgba(142,180,255,0.2)',
            boxShadow: i === selected ? '0 0 10px rgba(37,147,250,0.7)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

/** Панель деталей выбранного этапа: что происходит, кто отвечает, сколько дней. */
export function StageDetail({ selected, compact }: { selected: number; compact: boolean }) {
  const { reducedMotion } = useScene();
  const stage = FUNNEL_STAGES[selected];
  const conv = stageConversion[selected];
  const range = stageDayRange[selected];

  return (
    <Glass strong className="relative overflow-hidden px-[var(--gap-3)] py-[var(--gap-3)] sm:px-[var(--gap-4)]">
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
        style={{ background: 'var(--grad-brand)' }}
        aria-hidden
      />
      <div id="s11-stage-detail" aria-live="polite">
        <motion.div
          key={stage.id}
          initial={reducedMotion ? false : { opacity: 0.35, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={
            compact
              ? 'grid grid-cols-2 gap-x-[var(--gap-3)] gap-y-[var(--gap-2)]'
              : 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)_minmax(0,0.9fr)_minmax(0,1.2fr)] items-center gap-x-[var(--gap-4)]'
          }
        >
          <div className={compact ? 'col-span-2' : ''}>
            <p className="t-eyebrow">
              Этап {pad2(selected + 1)} / {pad2(STAGE_COUNT)}
            </p>
            <p className="t-h3 mt-1 text-white">{stage.label}</p>
            <p className="t-small text-soft">
              <span className="font-display text-ice">{formatInt(stage.value)}</span> · {stage.metric.toLowerCase()}
              {conv !== null ? (
                <>
                  {' '}
                  · <span className="font-display text-ice">{formatPercent(conv)}</span>
                </>
              ) : null}
            </p>
          </div>
          <p className={`t-small text-pretty text-ice ${compact ? 'col-span-2' : ''}`}>{stage.detail}</p>
          <div>
            <p className="t-micro flex items-center gap-1.5 text-mute">
              <Users className="h-3.5 w-3.5 text-highlight" aria-hidden />
              Ответственный
            </p>
            <p className="t-small mt-0.5 font-medium text-white">{stage.owner}</p>
          </div>
          <div>
            <p className="t-micro flex items-center gap-1.5 text-mute">
              <Clock3 className="h-3.5 w-3.5 text-highlight" aria-hidden />
              Длительность · план
            </p>
            <p className="t-small mt-0.5 text-white">
              <span className="font-display">{stage.days}</span> {plural(stage.days, DAY_FORMS)}
              <span className="text-mute">
                {' '}
                · дни {range.from}–{range.to} из {TIME_TO_HIRE_DAYS}
              </span>
            </p>
            <DaysBar selected={selected} className="mt-2" />
          </div>
        </motion.div>

      </div>
    </Glass>
  );
}
