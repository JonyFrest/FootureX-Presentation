import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { BacklogBadge, LevelTag } from './RiskRegister';
import { REGISTER, RISK_BY_ID, type RankedRisk } from './riskData';

/** Карточка выбранного риска: балл и уровень, стратегия, мера реагирования, владелец. */
export function RiskDetail({ riskId, className = '' }: { riskId: string | null; className?: string }) {
  const { reducedMotion } = useScene();
  const risk = (riskId ? RISK_BY_ID.get(riskId) : undefined) ?? REGISTER[0];
  return (
    <div className={`glass-strong relative overflow-hidden px-[var(--gap-3)] py-[var(--gap-2)] ${className}`} aria-live="polite" data-risk-detail>
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: 'var(--grad-brand)' }} />
      <motion.div
        key={risk.id}
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <RiskDetailBody risk={risk} />
      </motion.div>
    </div>
  );
}

export function RiskDetailBody({ risk, compact = false }: { risk: RankedRisk; compact?: boolean }) {
  return (
    <>
      {compact ? null : (
        <div className="flex min-w-0 flex-wrap items-center gap-x-[var(--gap-1)] gap-y-1">
          <span className="t-small font-display text-highlight">{risk.id}</span>
          <h2 className="t-h3 min-w-0 flex-1 leading-snug text-white">{risk.title}</h2>
          {risk.fromBacklog ? <BacklogBadge /> : null}
        </div>
      )}
      <dl
        className={`grid gap-x-[var(--gap-3)] gap-y-[calc(var(--gap-1)*0.6)] ${compact ? 'mt-0 grid-cols-2' : 'mt-[var(--gap-1)] grid-cols-[auto_auto_minmax(0,1fr)]'}`}
      >
        <div className="min-w-0">
          <dt className="t-micro text-mute">Балл p × i</dt>
          <dd className="t-small mt-0.5 flex flex-wrap items-center gap-[6px] text-white t-num">
            {risk.probability} × {risk.impact} = <LevelTag risk={risk} />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="t-micro text-mute">Стратегия</dt>
          <dd className="t-small mt-0.5 font-semibold text-white">{risk.strategyTitle}</dd>
        </div>
        <div className={`min-w-0 ${compact ? 'col-span-2' : ''}`}>
          <dt className="t-micro text-mute">Владелец риска</dt>
          <dd className="t-small mt-0.5 text-white">{risk.ownerTitle}</dd>
        </div>
      </dl>
      <p className={`t-micro text-mute ${compact ? 'mt-1.5' : 'mt-[calc(var(--gap-1)*1.2)]'}`}>Мера реагирования</p>
      <p className="t-small mt-0.5 text-ice text-pretty">{risk.response}</p>
      {compact && risk.fromBacklog ? (
        <p className="mt-2">
          <BacklogBadge />
        </p>
      ) : null}
    </>
  );
}
