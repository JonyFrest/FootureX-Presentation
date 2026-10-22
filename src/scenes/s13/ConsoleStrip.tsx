import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { Glass } from '@/components/ui';
import { HEADLINE, parseTarget } from './kpi';
import { TargetValue } from './TargetValue';

/** Верхняя «HR-консоль»: 4 ключевые цели. Всё помечено как цель/план — это не телеметрия. */
export function ConsoleStrip({ compact }: { compact: boolean }) {
  const { ready, reducedMotion } = useScene();

  return (
    <Glass strong className="relative overflow-hidden">
      {/* однократный проход «скан-линии» после остановки камеры */}
      {!reducedMotion ? (
        <motion.span
          className="pointer-events-none absolute inset-y-0 w-24"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(37,147,250,0.22), transparent)' }}
          initial={{ left: '-10%', opacity: 0 }}
          animate={ready ? { left: '105%', opacity: [0, 1, 1, 0] } : undefined}
          transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.2 }}
          aria-hidden
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[rgba(142,180,255,0.12)] px-[var(--gap-3)] py-[var(--gap-1)]">
        <p className="t-eyebrow flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary shadow-[0_0_8px_#2593FA]" aria-hidden />
          HR Console · Targets
        </p>
        <span className="chip chip-plan">Целевые показатели · план</span>
      </div>
      <dl className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {HEADLINE.map((h, i) => {
          const t = parseTarget(h.metric);
          const borderLeft = compact ? i % 2 === 1 : i > 0;
          const borderTop = compact && i > 1;
          return (
            <div
              key={h.key}
              className={`flex min-w-0 flex-col px-[var(--gap-3)] py-[var(--gap-2)] ${
                borderLeft ? 'border-l border-[rgba(142,180,255,0.12)]' : ''
              } ${borderTop ? 'border-t border-[rgba(142,180,255,0.12)]' : ''}`}
            >
              <span
                className={`order-1 font-display t-micro tracking-[0.12em] text-mute ${h.key === 'enps' ? '' : 'uppercase'}`}
                aria-hidden
              >
                {h.latin}
              </span>
              <dt className="t-micro order-3 mt-1 leading-snug text-soft">{h.label}</dt>
              <dd className="order-2 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <TargetValue target={t} size="md" />
                <span className="t-micro rounded border border-dashed border-[rgba(142,180,255,0.4)] px-1.5 leading-tight text-highlight">
                  цель
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </Glass>
  );
}
