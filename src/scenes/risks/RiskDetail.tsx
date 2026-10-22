import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { BacklogBadge, LevelTag } from './RiskRegister';
import { REGISTER, RISK_BY_ID, STRATEGIES, type RankedRisk } from './riskData';

/** Карточка выбранного риска: балл и уровень, владелец, стратегия, мера реагирования. */
export function RiskDetail({ riskId, className = '' }: { riskId: string | null; className?: string }) {
  const { reducedMotion } = useScene();
  const risk = (riskId ? RISK_BY_ID.get(riskId) : undefined) ?? REGISTER[0];
  return (
    <div
      className={`glass-strong relative flex flex-col justify-center overflow-hidden px-[var(--gap-3)] py-[var(--gap-2)] ${className}`}
      aria-live="polite"
      data-risk-detail
      data-interactive
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: 'var(--grad-brand)' }} />
      <motion.div
        key={risk.id}
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-[var(--gap-1)] gap-y-1">
          <span className="t-small font-display text-highlight">{risk.id}</span>
          <h2 className="t-h3 min-w-0 flex-1 leading-snug text-white">{risk.title}</h2>
          {risk.fromBacklog ? <BacklogBadge /> : null}
        </div>
        <RiskFacts risk={risk} className="mt-[var(--gap-1)]" />
      </motion.div>
    </div>
  );
}

/** Строки «подпись — значение»: оценка, владелец, стратегия (4 стратегии, выбранная подсвечена), мера. */
export function RiskFacts({ risk, className = '' }: { risk: RankedRisk; className?: string }) {
  return (
    <dl
      className={`grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-[var(--gap-2)] gap-y-[calc(var(--gap-1)*0.75)] ${className}`}
    >
      <dt className="t-micro text-mute">Оценка</dt>
      <dd className="t-small flex flex-wrap items-center gap-x-[6px] gap-y-1 text-white t-num">
        <span>
          вероятность {risk.probability} × влияние {risk.impact} =
        </span>
        <LevelTag risk={risk} />
      </dd>
      <dt className="t-micro text-mute">Владелец</dt>
      <dd className="t-small text-white">{risk.ownerTitle}</dd>
      <dt className="t-micro text-mute">Стратегия</dt>
      <dd className="flex flex-wrap gap-[5px]" aria-label={`Стратегия: ${risk.strategyTitle}`}>
        {STRATEGIES.map((s) => {
          const on = s.id === risk.strategy;
          return (
            <span
              key={s.id}
              aria-hidden={!on}
              className={`t-micro inline-flex items-center gap-1.5 rounded-full border px-2 py-[1px] whitespace-nowrap ${
                on
                  ? 'border-transparent bg-[linear-gradient(135deg,#2593FA,#2550FA)] font-semibold text-white shadow-[0_4px_14px_-6px_rgba(37,80,250,0.9)]'
                  : 'border-[rgba(142,180,255,0.22)] text-mute'
              }`}
            >
              {s.title}
              <span className={`t-num font-normal ${on ? 'text-ice' : 'text-mute'}`} title="рисков с этой стратегией">
                {s.count}
              </span>
            </span>
          );
        })}
      </dd>
      <dt className="t-micro text-mute">Мера</dt>
      <dd className="t-small text-ice text-pretty">{risk.response}</dd>
    </dl>
  );
}
