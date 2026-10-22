import { useId } from 'react';
import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { CountUp } from '@/components/ui';
import { BUDGET } from '@/data/project';
import { fmtNum } from '../schedule/shared';
import { SLICES, formatUsd, type SliceId } from './budgetMath';

const VB = 220;
const C = VB / 2;
const R_OUT = 98;
const R_IN = 73;
const R_ACTIVE = 104;
const PAD_DEG = 0.9;

const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
const pt = (r: number, deg: number) => [C + r * Math.cos(rad(deg)), C + r * Math.sin(rad(deg))] as const;

/** Сектор кольца по часовой стрелке от 12 часов, углы в градусах. */
function arcPath(r0: number, r1: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = pt(r1, a0);
  const [x1, y1] = pt(r1, a1);
  const [x2, y2] = pt(r0, a1);
  const [x3, y3] = pt(r0, a0);
  return `M${x0} ${y0} A${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`;
}

function arcLine(r: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = pt(r, a0);
  const [x1, y1] = pt(r, a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

/** Углы секторов из точных долей. */
const GEOMETRY = (() => {
  let acc = 0;
  return SLICES.map((s) => {
    const a0 = acc;
    acc += (s.exactShare / 100) * 360;
    return { id: s.id, a0, a1: acc, mid: (a0 + acc) / 2 };
  });
})();
const BASELINE_END = GEOMETRY.filter((g) => SLICES.find((s) => s.id === g.id)?.inBaseline).at(-1)?.a1 ?? 0;

interface DonutProps {
  active: SliceId | null;
  onHover: (id: SliceId | null) => void;
  onSelect: (id: SliceId) => void;
}

/** Кольцевая диаграмма бюджета: три статьи базового плана и управленческий резерв (штриховка, вынесен наружу). */
export function BudgetDonut({ active, onHover, onSelect }: DonutProps) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  const uid = useId().replace(/:/g, '');
  const activeSlice = active ? SLICES.find((s) => s.id === active) : undefined;
  const maskR = R_ACTIVE / 2 + 4;
  const maskC = 2 * Math.PI * maskR;

  return (
    <div className="relative aspect-square w-full" data-interactive data-donut>
      <svg viewBox={`0 0 ${VB} ${VB}`} className="absolute inset-0 size-full overflow-visible" role="img" aria-label="Структура бюджета проекта по статьям">
        <defs>
          <pattern id={`${uid}-hatch`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" fill="rgba(220,231,255,0.1)" />
            <rect width="2" height="5" fill="#DCE7FF" opacity="0.8" />
          </pattern>
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0" stopColor="rgba(37,80,250,0.28)" />
            <stop offset="1" stopColor="rgba(37,80,250,0)" />
          </radialGradient>
          <mask id={`${uid}-sweep`} maskUnits="userSpaceOnUse" x="0" y="0" width={VB} height={VB}>
            <motion.circle
              cx={C}
              cy={C}
              r={maskR}
              fill="none"
              stroke="#fff"
              strokeWidth={maskR * 2 + 14}
              strokeDasharray={maskC}
              transform={`rotate(-90 ${C} ${C})`}
              initial={reducedMotion ? false : { strokeDashoffset: maskC }}
              animate={show ? { strokeDashoffset: 0 } : undefined}
              transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1], delay: 0.1 }}
            />
          </mask>
        </defs>

        <circle cx={C} cy={C} r={R_IN - 6} fill={`url(#${uid}-glow)`} />
        <circle cx={C} cy={C} r={(R_OUT + R_IN) / 2} fill="none" stroke="rgba(142,180,255,0.08)" strokeWidth={R_OUT - R_IN} />

        <g mask={`url(#${uid}-sweep)`}>
          {SLICES.map((s, i) => {
            const g = GEOMETRY[i];
            const on = active === s.id;
            const dim = active !== null && !on;
            const outer = on ? R_ACTIVE : R_OUT;
            const [dx, dy] = s.inBaseline ? [0, 0] : [Math.cos(rad(g.mid)) * 3.5, Math.sin(rad(g.mid)) * 3.5];
            return (
              <path
                key={s.id}
                d={arcPath(R_IN, outer, g.a0 + PAD_DEG, g.a1 - PAD_DEG)}
                transform={`translate(${dx} ${dy})`}
                fill={s.inBaseline ? s.color : `url(#${uid}-hatch)`}
                fillOpacity={dim ? 0.3 : 1}
                stroke={s.inBaseline ? 'none' : '#DCE7FF'}
                strokeOpacity={dim ? 0.35 : 0.9}
                strokeWidth={s.inBaseline ? 0 : 1}
                strokeDasharray={s.inBaseline ? undefined : '3 2'}
                data-slice={s.id}
                style={{ cursor: 'pointer', transition: 'fill-opacity 0.3s ease, stroke-opacity 0.3s ease' }}
                onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(s.id)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
                onClick={() => onSelect(s.id)}
              />
            );
          })}
          {/* Скобка базового плана затрат: резерв — вне базового плана. */}
          <path
            d={arcLine(R_ACTIVE + 6, PAD_DEG, BASELINE_END - PAD_DEG)}
            fill="none"
            stroke="rgba(142,180,255,0.55)"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
          {[PAD_DEG, BASELINE_END - PAD_DEG].map((a) => {
            const [x0, y0] = pt(R_ACTIVE + 3, a);
            const [x1, y1] = pt(R_ACTIVE + 9, a);
            return <line key={a} x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgba(142,180,255,0.55)" strokeWidth={1.2} strokeLinecap="round" />;
          })}
        </g>
      </svg>

      {/* Центр: итог или выбранная статья — настоящий HTML-текст. */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="grid max-w-[58%] text-center" aria-live="polite">
          <div
            className="transition-[opacity,transform] duration-300 [grid-area:1/1]"
            style={{ opacity: activeSlice ? 0 : 1, transform: activeSlice ? 'translateY(4px)' : 'none' }}
            aria-hidden={Boolean(activeSlice)}
          >
            <p className="t-eyebrow tracking-[0.16em]">Итого · план</p>
            <p className="mt-[calc(var(--gap-1)*0.8)] font-display text-[length:clamp(20px,calc(var(--u)*1.75),34px)] leading-none">
              <CountUp to={BUDGET.total} prefix="$" className="text-gradient" />
            </p>
            <p className="t-micro mt-[calc(var(--gap-1)*0.8)] text-soft">бюджет проекта</p>
          </div>
          <div
            className="transition-[opacity,transform] duration-300 [grid-area:1/1]"
            style={{ opacity: activeSlice ? 1 : 0, transform: activeSlice ? 'none' : 'translateY(4px)' }}
            aria-hidden={!activeSlice}
          >
            {activeSlice ? (
              <>
                <p className="t-micro leading-tight text-soft">{activeSlice.label}</p>
                <p className="mt-[calc(var(--gap-1)*0.6)] font-display text-[length:clamp(20px,calc(var(--u)*1.75),34px)] leading-none text-white t-num">
                  {formatUsd(activeSlice.value)}
                </p>
                <p className="t-micro mt-[calc(var(--gap-1)*0.6)] font-semibold text-highlight t-num">
                  {fmtNum(activeSlice.share, 1)}% бюджета
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
