import { useEffect, useId, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { FUNNEL_STAGES } from '@/data/hr';
import { useScene } from '@/components/scene';
import { DAY_FORMS, formatPercent, pad2, plural } from './format';
import { STAGE_COUNT, edgePath, segmentPath, stageConversion, type FunnelGeom } from './funnel';
import { useElementSize } from './useElementSize';
import { useFlowParticles } from './useFlowParticles';
import { CountUp } from '@/components/ui';

interface FunnelProps {
  selected: number;
  onSelect: (index: number) => void;
}

const ROW = 78;

/** Вертикальная воронка для телефонов: этапы сверху вниз, подписи справа. */
export function FunnelVertical({ selected, onSelect }: FunnelProps) {
  const { ready, reducedMotion } = useScene();
  const uid = useId().replace(/:/g, '');
  const [ref, size] = useElementSize<HTMLDivElement>();
  const W = size.width;
  const total = ROW * STAGE_COUNT;
  const bw = Math.min(200, Math.max(110, W * 0.36));

  const geom = useMemo<FunnelGeom | null>(
    () => (W > 0 ? { start: 0, length: total, cross: bw - 6, center: bw / 2 } : null),
    [W, total, bw],
  );
  const segments = useMemo(() => (geom ? FUNNEL_STAGES.map((_, i) => segmentPath(geom, 'v', i)) : []), [geom]);
  const edges = useMemo(() => (geom ? [edgePath(geom, 'v', -1), edgePath(geom, 'v', 1)] : []), [geom]);

  const shown = ready || reducedMotion;
  const [flowOn, setFlowOn] = useState(false);
  useEffect(() => {
    if (!ready || reducedMotion) return;
    const t = window.setTimeout(() => setFlowOn(true), 900);
    return () => window.clearTimeout(t);
  }, [ready, reducedMotion]);
  const count = 40;
  const nodes = useFlowParticles({ geom, orientation: 'v', count, enabled: flowOn && !reducedMotion && !!geom });

  return (
    <div ref={ref} className="relative w-full" style={{ height: total }}>
      {geom ? (
        <svg className="absolute top-0 left-0 overflow-visible" width={bw} height={total} aria-hidden>
          <defs>
            <linearGradient id={`${uid}-fill`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={total}>
              <stop offset="0" stopColor="#2550FA" />
              <stop offset="0.55" stopColor="#2593FA" />
              <stop offset="1" stopColor="#8EB4FF" />
            </linearGradient>
            <filter id={`${uid}-glow`} x="-60%" y="-20%" width="220%" height="140%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <clipPath id={`${uid}-clip`}>
              <motion.rect
                x={-40}
                y={0}
                width={bw + 80}
                initial={{ height: reducedMotion ? total : 0 }}
                animate={{ height: shown ? total + 4 : 0 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </clipPath>
          </defs>
          <g clipPath={`url(#${uid}-clip)`}>
            <path d={segments[selected]} fill={`url(#${uid}-fill)`} opacity={0.42} filter={`url(#${uid}-glow)`} />
            {segments.map((d, i) => (
              <path
                key={i}
                d={d}
                fill={`url(#${uid}-fill)`}
                fillOpacity={i === selected ? 0.66 : 0.2}
                style={{ transition: 'fill-opacity 0.35s ease' }}
              />
            ))}
            {edges.map((d, k) => (
              <path key={k} d={d} fill="none" stroke="#8EB4FF" strokeOpacity={0.7} strokeWidth={1.4} />
            ))}
          </g>
          {!reducedMotion ? (
            <g fill="#DCE7FF">
              {Array.from({ length: count }, (_, i) => (
                <circle
                  key={i}
                  ref={(n) => {
                    nodes.current[i] = n;
                  }}
                  r={i % 4 === 0 ? 2.2 : 1.6}
                  cx={-20}
                  cy={-20}
                  opacity={0}
                />
              ))}
            </g>
          ) : null}
        </svg>
      ) : null}

      {FUNNEL_STAGES.map((stage, i) => {
        const isSel = i === selected;
        const conv = stageConversion[i];
        return (
          <button
            key={stage.id}
            type="button"
            aria-pressed={isSel}
            aria-controls="s11-stage-detail"
            aria-label={`Этап ${i + 1}: ${stage.label}. ${stage.metric}: ${stage.value}${
              conv !== null ? `, конверсия ${formatPercent(conv)}` : ''
            }. ${stage.days} ${plural(stage.days, DAY_FORMS)}, план`}
            onFocus={(e) => {
              if (e.currentTarget.matches(':focus-visible')) onSelect(i);
            }}
            onClick={() => onSelect(i)}
            className="absolute left-0 grid w-full cursor-pointer items-center rounded-[var(--radius-sm)] text-left transition-colors duration-300"
            style={{
              top: i * ROW,
              height: ROW,
              gridTemplateColumns: `${bw}px minmax(0, 1fr)`,
              background: isSel
                ? 'linear-gradient(90deg, rgba(37,147,250,0.04), rgba(37,147,250,0.14))'
                : undefined,
            }}
          >
            <span aria-hidden />
            <span className="flex min-w-0 flex-col pl-3">
              <span className={`t-small font-semibold ${isSel ? 'text-white' : 'text-soft'}`}>
                <span className="mr-1.5 font-display t-micro text-highlight">{pad2(i + 1)}</span>
                {stage.label}
                <span className="ml-2 t-micro font-normal text-mute">
                  {stage.days} {plural(stage.days, DAY_FORMS)}
                </span>
              </span>
              <span className="flex items-baseline gap-x-2">
                <span className={`t-h2 font-display ${isSel ? 'text-gradient' : 'text-ice'}`}>
                  <CountUp to={stage.value} duration={1.2} />
                </span>
                <span className="t-micro leading-tight text-soft">{stage.metric}</span>
              </span>
            </span>
          </button>
        );
      })}

      {geom
        ? stageConversion.map((conv, i) =>
            conv === null ? null : (
              <span
                key={i}
                className="pointer-events-none absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-full border px-2 py-0.5 font-display t-micro text-ice"
                style={{
                  left: bw / 2,
                  top: i * ROW,
                  background: 'rgba(7,10,18,0.9)',
                  borderColor: i === selected ? 'rgba(37,147,250,0.85)' : 'rgba(142,180,255,0.32)',
                }}
              >
                <ChevronDown className="h-3 w-3 text-secondary" strokeWidth={2.5} aria-hidden />
                {formatPercent(conv)}
              </span>
            ),
          )
        : null}
    </div>
  );
}
