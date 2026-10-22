import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { FUNNEL_STAGES } from '@/data/hr';
import { useScene } from '@/components/scene';
import { DAY_FORMS, formatPercent, pad2, plural } from './format';
import { STAGE_COUNT, connectorPoints, edgePath, segmentPath, stageConversion, type FunnelGeom } from './funnel';
import { useElementSize } from './useElementSize';
import { useFlowParticles } from './useFlowParticles';
import { CHANNELS } from './channels';
import { CountUp } from '@/components/ui';

interface FunnelProps {
  selected: number;
  onSelect: (index: number) => void;
  /** Показывать каналы привлечения слева от воронки (широкие экраны). */
  withSources: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Горизонтальная воронка: каналы → 5 этапов, частицы потока, шлюзы конверсии. */
export function FunnelHorizontal({ selected, onSelect, withSources }: FunnelProps) {
  const { ready, reducedMotion } = useScene();
  const uid = useId().replace(/:/g, '');
  const [bandRef, size] = useElementSize<HTMLDivElement>();
  const W = size.width;
  const H = size.height;
  const S = withSources ? clamp(W * 0.19, 210, 300) : 0;
  const connLen = withSources ? clamp(S * 0.2, 36, 64) : 0;

  const geom = useMemo<FunnelGeom | null>(
    () => (W > 0 && H > 0 ? { start: S, length: W - S, cross: H - 8, center: H / 2 } : null),
    [W, H, S],
  );
  const sources = useMemo(
    () =>
      withSources && H > 0
        ? CHANNELS.map((_, k) => ({ x: S - connLen, y: (H * (k + 0.5)) / CHANNELS.length }))
        : undefined,
    [withSources, H, S, connLen],
  );

  const shown = ready || reducedMotion;
  const [flowOn, setFlowOn] = useState(false);
  useEffect(() => {
    if (!ready || reducedMotion) return;
    const t = window.setTimeout(() => setFlowOn(true), 900);
    return () => window.clearTimeout(t);
  }, [ready, reducedMotion]);

  const particleCount = 64;
  const nodes = useFlowParticles({
    geom,
    orientation: 'h',
    sources,
    count: particleCount,
    enabled: flowOn && !reducedMotion && geom !== null,
  });

  const segments = useMemo(
    () => (geom ? FUNNEL_STAGES.map((_, i) => segmentPath(geom, 'h', i)) : []),
    [geom],
  );
  const edges = useMemo(() => (geom ? [edgePath(geom, 'h', -1), edgePath(geom, 'h', 1)] : []), [geom]);
  const connectors = useMemo(() => {
    if (!geom || !sources) return [];
    return sources.map((src, k) => {
      const lane = ((k + 0.5) / sources.length) * 2 - 1;
      const [p0, p1, p2, p3] = connectorPoints(geom, src, lane);
      return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`;
    });
  }, [geom, sources]);

  const cw = geom ? geom.length / STAGE_COUNT : 0;

  const gridStyle: CSSProperties & Record<'--fx-band', string> = {
    gridTemplateColumns: `${withSources ? `${S}px ` : ''}repeat(${STAGE_COUNT}, minmax(0, 1fr))`,
    gridTemplateRows: 'auto var(--fx-band) auto',
    '--fx-band': 'clamp(160px, calc(var(--u) * 12), 270px)',
  };
  const col0 = withSources ? 2 : 1;

  return (
    <div className="relative grid w-full" style={gridStyle}>
      {withSources ? (
        <>
          <p className="t-eyebrow self-end pb-[var(--gap-2)]" style={{ gridColumn: 1, gridRow: 1 }}>
            Каналы
          </p>
          <p
            className="t-micro self-start pt-[var(--gap-2)] pr-[var(--gap-3)] text-mute"
            style={{ gridColumn: 1, gridRow: 3 }}
          >
            % — конверсия из предыдущего этапа. Толщина — корневая шкала, числа — точные.
          </p>
        </>
      ) : null}

      {/* Полоса воронки: SVG + каналы + шлюзы конверсии */}
      <div ref={bandRef} className="relative z-0" style={{ gridColumn: '1 / -1', gridRow: 2 }}>
        {geom ? (
          <svg
            className="absolute inset-0 overflow-visible"
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            aria-hidden
          >
            <defs>
              <linearGradient id={`${uid}-fill`} gradientUnits="userSpaceOnUse" x1={S} y1={0} x2={W} y2={0}>
                <stop offset="0" stopColor="#2550FA" />
                <stop offset="0.55" stopColor="#2593FA" />
                <stop offset="1" stopColor="#8EB4FF" />
              </linearGradient>
              <linearGradient id={`${uid}-conn`} gradientUnits="userSpaceOnUse" x1={S - connLen} y1={0} x2={S} y2={0}>
                <stop offset="0" stopColor="#8EB4FF" stopOpacity="0.55" />
                <stop offset="1" stopColor="#2593FA" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id={`${uid}-sheen`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={H}>
                <stop offset="0" stopColor="#DCE7FF" stopOpacity="0.2" />
                <stop offset="0.5" stopColor="#DCE7FF" stopOpacity="0" />
                <stop offset="1" stopColor="#DCE7FF" stopOpacity="0.06" />
              </linearGradient>
              <filter id={`${uid}-glow`} x="-20%" y="-60%" width="140%" height="220%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
              <clipPath id={`${uid}-clip`}>
                <motion.rect
                  x={0}
                  y={-40}
                  height={H + 80}
                  initial={{ width: reducedMotion ? W : 0 }}
                  animate={{ width: shown ? W + 4 : 0 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </clipPath>
            </defs>

            <g clipPath={`url(#${uid}-clip)`}>
              {connectors.map((d, k) => (
                <path key={k} d={d} fill="none" stroke={`url(#${uid}-conn)`} strokeWidth={1.2} />
              ))}
              {/* свечение выбранного этапа */}
              <path
                d={segments[selected]}
                fill={`url(#${uid}-fill)`}
                opacity={0.42}
                filter={`url(#${uid}-glow)`}
              />
              {segments.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill={`url(#${uid}-fill)`}
                  fillOpacity={i === selected ? 0.66 : 0.2}
                  style={{ transition: 'fill-opacity 0.35s ease' }}
                />
              ))}
              {segments.map((d, i) => (
                <path key={`s${i}`} d={d} fill={`url(#${uid}-sheen)`} />
              ))}
              {edges.map((d, k) => (
                <path key={k} d={d} fill="none" stroke="#8EB4FF" strokeOpacity={0.7} strokeWidth={1.4} />
              ))}
              <line
                x1={S}
                x2={W}
                y1={H / 2}
                y2={H / 2}
                stroke="#DCE7FF"
                strokeOpacity={0.12}
                strokeWidth={1}
              />
            </g>

            {!reducedMotion ? (
              <g fill="#DCE7FF">
                {Array.from({ length: particleCount }, (_, i) => (
                  <circle
                    key={i}
                    ref={(n) => {
                      nodes.current[i] = n;
                    }}
                    r={i % 4 === 0 ? 2.4 : 1.7}
                    cx={-20}
                    cy={-20}
                    opacity={0}
                  />
                ))}
              </g>
            ) : null}
          </svg>
        ) : null}

        {/* Каналы привлечения */}
        {sources
          ? CHANNELS.map((label, k) => (
              <span
                key={label}
                className="chip absolute -translate-y-1/2"
                style={{ top: sources[k].y, right: W - sources[k].x, background: 'rgba(10,16,32,0.72)' }}
              >
                {label}
              </span>
            ))
          : null}

        {/* Шлюзы конверсии на границах этапов */}
        {geom
          ? stageConversion.map((conv, i) =>
              conv === null ? null : (
                <motion.span
                  key={i}
                  className="pointer-events-none absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-full border px-2 py-0.5 font-display t-micro text-ice"
                  style={{
                    left: S + i * cw,
                    top: H / 2,
                    background: 'rgba(7,10,18,0.9)',
                    borderColor: i === selected ? 'rgba(37,147,250,0.85)' : 'rgba(142,180,255,0.32)',
                    boxShadow: i === selected ? '0 0 18px -4px rgba(37,147,250,0.8)' : 'none',
                  }}
                  initial={{ opacity: reducedMotion ? 1 : 0, scale: reducedMotion ? 1 : 0.6 }}
                  animate={shown ? { opacity: 1, scale: 1 } : undefined}
                  transition={
                    reducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.25 + i * 0.18, ease: [0.16, 1, 0.3, 1] }
                  }
                >
                  <ChevronRight className="h-3 w-3 text-secondary" strokeWidth={2.5} aria-hidden />
                  {formatPercent(conv)}
                </motion.span>
              ),
            )
          : null}
      </div>

      {/* Колонки этапов — кнопки (hover/focus/tap выбирают этап) */}
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
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') onSelect(i);
            }}
            onFocus={(e) => {
              if (e.currentTarget.matches(':focus-visible')) onSelect(i);
            }}
            onClick={() => onSelect(i)}
            className="group relative z-10 grid cursor-pointer rounded-[var(--radius-md)] text-center transition-colors duration-300"
            style={{
              gridColumn: col0 + i,
              gridRow: '1 / 4',
              gridTemplateRows: 'subgrid',
              background: isSel
                ? 'linear-gradient(180deg, rgba(37,147,250,0.12), rgba(37,147,250,0.02) 45%, rgba(37,147,250,0.02) 60%, rgba(37,147,250,0.12))'
                : undefined,
            }}
          >
            <span className="flex flex-col items-center justify-end gap-0.5 px-1 pt-[var(--gap-1)] pb-[var(--gap-2)] transition-transform duration-300 group-hover:-translate-y-0.5">
              <span className={`t-h3 whitespace-nowrap ${isSel ? 'text-white' : 'text-soft'}`}>
                <span className="mr-1.5 font-display t-micro text-highlight">{pad2(i + 1)}</span>
                {stage.label}
              </span>
              <span className={`t-micro ${isSel ? 'text-highlight' : 'text-mute'}`}>
                {stage.days} {plural(stage.days, DAY_FORMS)}
              </span>
            </span>
            <span aria-hidden />
            <span className="flex flex-col items-center px-1 pt-[var(--gap-2)] pb-[var(--gap-1)] transition-transform duration-300 group-hover:-translate-y-0.5">
              <span className={`t-stat ${isSel ? 'text-gradient' : 'text-ice'}`}>
                <CountUp to={stage.value} duration={1.2} delay={0.15 + i * 0.1} />
              </span>
              <span className={`t-small mt-1 leading-tight ${isSel ? 'text-ice' : 'text-soft'}`}>{stage.metric}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
