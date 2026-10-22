import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { BUDGET, MILESTONES } from '@/data/project';
import { MONTH_POINTS, SLICE_BY_ID, formatUsd, type SliceId } from './budgetMath';

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Шаг сетки по оси Y: 1, 2 или 5 × 10^n — не больше 4 делений. */
function niceStep(max: number): number {
  const raw = max / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((k) => k * p).find((s) => s >= raw) ?? raw;
}

const Y_MAX = BUDGET.baseline * 1.1;
const STEP = niceStep(BUDGET.baseline);
const TICKS = Array.from({ length: Math.floor(Y_MAX / STEP) + 1 }, (_, i) => i * STEP);
const STACK_ORDER: SliceId[] = ['team', 'infra', 'marketing'];
const lcFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
const PEAK = MONTH_POINTS.reduce((a, b) => (b.value > a.value ? b : a));
const PEAK_MILESTONE = MILESTONES.find((m) => m.month === PEAK.month);

interface SCurveProps {
  activeMonth: number | null;
  activeSlice: SliceId | null;
  bindMonth: (m: number) => Record<string, unknown>;
}

/**
 * S-кривая базового плана затрат: столбцы — затраты месяца, линия — накопленная плановая стоимость (PV).
 * Одна ось: оба ряда в долларах. Подписи — HTML поверх SVG.
 */
export function SCurve({ activeMonth, activeSlice, bindMonth }: SCurveProps) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  const uid = useId().replace(/:/g, '');
  const [ref, { w, h }] = useElementSize<HTMLDivElement>();

  const gutter = Math.max(50, Math.min(76, w * 0.11));
  const top = Math.max(22, h * 0.09);
  const plotW = Math.max(0, w - gutter - 6);
  const plotH = Math.max(0, h - top - 1);
  const band = plotW / MONTH_POINTS.length;
  const barW = Math.min(band * 0.46, 46);
  const y = (v: number) => top + plotH * (1 - v / Y_MAX);
  const xEdge = (i: number) => gutter + band * i;
  const points = [{ x: xEdge(0), y: y(0) }, ...MONTH_POINTS.map((p, i) => ({ x: xEdge(i + 1), y: y(p.cumulative) }))];
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const area = `${line} L${points[points.length - 1].x} ${y(0)} L${points[0].x} ${y(0)} Z`;
  const stackSlice = activeSlice && activeSlice !== 'reserve' ? activeSlice : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={ref} className="relative min-h-0 flex-1" data-interactive data-scurve>
        {w > 0 && h > 0 ? (
          <>
            <svg width={w} height={h} className="absolute inset-0 overflow-visible" aria-hidden>
              <defs>
                <linearGradient id={`${uid}-bar`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#2593FA" />
                  <stop offset="1" stopColor="#2550FA" />
                </linearGradient>
                <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgba(142,180,255,0.24)" />
                  <stop offset="1" stopColor="rgba(142,180,255,0)" />
                </linearGradient>
              </defs>

              {TICKS.map((t) => (
                <line key={t} x1={gutter} x2={w} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'rgba(142,180,255,0.4)' : 'rgba(142,180,255,0.1)'} strokeWidth={1} />
              ))}

              {MONTH_POINTS.map((p, i) => {
                const on = activeMonth === p.month;
                return on ? (
                  <rect key={`hl-${p.month}`} x={xEdge(i)} y={top - 6} width={band} height={plotH + 6} rx={8} fill="rgba(37,147,250,0.1)" />
                ) : null;
              })}

              <motion.path
                d={area}
                fill={`url(#${uid}-area)`}
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={show ? { opacity: 1 } : undefined}
                transition={{ duration: 0.8, delay: 1.1 }}
              />

              {MONTH_POINTS.map((p, i) => {
                const cx = xEdge(i) + band / 2;
                const bh = y(0) - y(p.value);
                const dim = (activeMonth !== null && activeMonth !== p.month) || stackSlice !== null;
                let below = 0;
                const seg = stackSlice
                  ? (() => {
                      for (const id of STACK_ORDER) {
                        const v = p.parts.find((q) => q.id === id)?.value ?? 0;
                        if (id === stackSlice) return { from: below, to: below + v };
                        below += v;
                      }
                      return null;
                    })()
                  : null;
                return (
                  <g key={p.month}>
                    <motion.rect
                      x={cx - barW / 2}
                      y={y(p.value)}
                      width={barW}
                      height={bh}
                      rx={4}
                      fill={`url(#${uid}-bar)`}
                      style={{ originY: 1, transformBox: 'fill-box', transition: 'opacity 0.3s ease' }}
                      opacity={dim ? 0.32 : 0.92}
                      initial={reducedMotion ? false : { scaleY: 0 }}
                      animate={show ? { scaleY: 1 } : undefined}
                      transition={{ duration: 0.7, delay: 0.15 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                    />
                    {seg && seg.to > seg.from ? (
                      <rect
                        x={cx - barW / 2}
                        y={y(seg.to)}
                        width={barW}
                        height={Math.max(1.5, y(seg.from) - y(seg.to))}
                        rx={3}
                        fill={SLICE_BY_ID.get(stackSlice!)?.color}
                        stroke="#DCE7FF"
                        strokeWidth={1}
                        data-stack={stackSlice}
                      />
                    ) : null}
                  </g>
                );
              })}

              <motion.path
                d={line}
                fill="none"
                stroke="#DCE7FF"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(142,180,255,0.6))' }}
                initial={reducedMotion ? false : { pathLength: 0 }}
                animate={show ? { pathLength: 1 } : undefined}
                transition={{ duration: 1.3, delay: 0.55, ease: [0.45, 0, 0.25, 1] }}
              />
              {points.slice(1).map((p, i) => {
                const on = activeMonth === i + 1;
                return (
                  <motion.circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={on ? 5.5 : 4}
                    fill="#DCE7FF"
                    stroke="#0A1020"
                    strokeWidth={2}
                    initial={reducedMotion ? false : { opacity: 0 }}
                    animate={show ? { opacity: 1 } : undefined}
                    transition={{ duration: 0.3, delay: 0.7 + i * 0.2 }}
                  />
                );
              })}
            </svg>

            {/* Ось Y: доллары. */}
            {TICKS.map((t) => (
              <span
                key={t}
                className="t-micro pointer-events-none absolute left-0 -translate-y-1/2 pr-2 text-right text-mute t-num"
                style={{ top: y(t), width: gutter }}
              >
                {formatUsd(t)}
              </span>
            ))}

            {/* Подписи накопленной PV над точками. */}
            {points.slice(1).map((p, i) => {
              const last = i === MONTH_POINTS.length - 1;
              return (
                <motion.span
                  key={i}
                  className={`pointer-events-none absolute whitespace-nowrap t-num ${
                    last ? 't-small font-semibold text-white' : 't-micro text-ice'
                  }`}
                  style={{
                    left: p.x,
                    top: p.y,
                    x: last ? '-100%' : '-50%',
                    y: '-135%',
                  }}
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={show ? { opacity: activeMonth === null || activeMonth === i + 1 ? 1 : 0.45 } : undefined}
                  transition={{ duration: 0.3, delay: show && activeMonth === null ? 0.75 + i * 0.2 : 0 }}
                >
                  {formatUsd(MONTH_POINTS[i].cumulative)}
                </motion.span>
              );
            })}
          </>
        ) : null}
      </div>

      {/* Ось месяцев: кнопки — затраты месяца. */}
      <div className="grid shrink-0 pt-[calc(var(--gap-1)*0.8)]" style={{ marginLeft: gutter, marginRight: 6, gridTemplateColumns: `repeat(${MONTH_POINTS.length}, minmax(0, 1fr))` }}>
        {MONTH_POINTS.map((p) => {
          const on = activeMonth === p.month;
          return (
            <button
              key={p.month}
              type="button"
              {...bindMonth(p.month)}
              aria-pressed={on}
              data-month={p.month}
              className={`cursor-pointer rounded-[8px] px-0.5 py-[3px] text-center transition-[background-color,transform] duration-300 hover:-translate-y-0.5 ${
                on ? 'bg-[rgba(37,147,250,0.16)]' : 'hover:bg-[rgba(142,180,255,0.06)]'
              }`}
            >
              <span className="t-micro block leading-tight text-soft">Месяц {p.month}</span>
              <span className="t-micro block font-semibold leading-tight text-white t-num">{formatUsd(p.value)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Строка пояснения под графиком: состав выбранного месяца или статьи. */
export function SCurveNote({ activeMonth, activeSlice }: { activeMonth: number | null; activeSlice: SliceId | null }) {
  const month = activeMonth ? MONTH_POINTS.find((p) => p.month === activeMonth) : undefined;
  let text: ReactNode;
  if (month) {
    text = (
      <>
        <span className="font-semibold text-white">Месяц {month.month}:</span>{' '}
        {month.parts.map((q) => `${lcFirst(q.label)} ${formatUsd(q.value)}`).join(' + ')} ={' '}
        <span className="font-semibold text-white">{formatUsd(month.value)}</span> · PV {formatUsd(month.cumulative)}
      </>
    );
  } else if (activeSlice === 'reserve') {
    text = <>Резерв {formatUsd(BUDGET.reserve)} не входит в базовый план затрат и в PV</>;
  } else if (activeSlice) {
    const s = SLICE_BY_ID.get(activeSlice)!;
    const values = MONTH_POINTS.map((p) => p.parts.find((q) => q.id === activeSlice)?.value ?? 0);
    text = (
      <>
        <span className="font-semibold text-white">{s.label}:</span> {values.map(formatUsd).join(' + ')} ={' '}
        <span className="font-semibold text-white">{formatUsd(s.value)}</span>
      </>
    );
  } else {
    text = (
      <>
        Пик — месяц {PEAK.month} ({formatUsd(PEAK.value)})
        {PEAK_MILESTONE ? `, веха ${PEAK_MILESTONE.id} «${PEAK_MILESTONE.title}»` : ''} · итог PV {formatUsd(BUDGET.baseline)}
      </>
    );
  }
  return (
    <p className="t-micro min-h-[2.8em] text-soft t-num" aria-live="polite">
      {text}
    </p>
  );
}
