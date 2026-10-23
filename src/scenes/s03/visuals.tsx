import { Fragment, useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useScene } from '@/components/scene';

const EASE = [0.16, 1, 0.3, 1] as const;

interface VisualProps {
  /** Доля 0…1, которую показывает инфографика. */
  fraction: number;
  /** Задержка запуска после ready, с. */
  delay?: number;
}

/* ------------------------------------------------------------------
   Радиальный индикатор (240°): дуга заполняется до значения, стрелка поворачивается.
   ------------------------------------------------------------------ */

const G_START = 150; // градусы, по часовой от оси X (вниз-влево)
const G_SWEEP = 240;
const G_R = 74;
const G_C = { x: 100, y: 96 };

function gPoint(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: G_C.x + r * Math.cos(rad), y: G_C.y + r * Math.sin(rad) };
}

function arcPath(r: number, from: number, sweep: number) {
  const a = gPoint(r, from);
  const b = gPoint(r, from + sweep);
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
}

const G_TICKS = Array.from({ length: 41 }, (_, i) => G_START + (G_SWEEP / 40) * i);

export function GaugeVisual({ fraction, delay = 0 }: VisualProps) {
  const { ready, reducedMotion } = useScene();
  const on = ready || reducedMotion;
  const instant = reducedMotion ? { duration: 0 } : { duration: 1.6, delay, ease: EASE };
  const needleDeg = G_START + G_SWEEP * fraction;
  const tip = gPoint(G_R, needleDeg);

  // Стрелка: угол анимируется числом, концы линии считаются из угла (без transform-origin в SVG).
  const angle = useMotionValue(reducedMotion ? needleDeg : G_START);
  const needleX = useTransform(angle, (deg) => gPoint(56, deg).x);
  const needleY = useTransform(angle, (deg) => gPoint(56, deg).y);
  useEffect(() => {
    if (!on) return;
    if (reducedMotion) {
      angle.set(needleDeg);
      return;
    }
    const controls = animate(angle, needleDeg, { duration: 1.6, delay, ease: EASE });
    return () => controls.stop();
  }, [on, reducedMotion, needleDeg, delay, angle]);

  return (
    <svg viewBox="0 0 200 144" className="h-full w-auto max-w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="s03-gauge" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#2550FA" />
          <stop offset="0.6" stopColor="#2593FA" />
          <stop offset="1" stopColor="#8EB4FF" />
        </linearGradient>
        <radialGradient id="s03-gauge-hub" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#2593FA" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2593FA" stopOpacity="0" />
        </radialGradient>
        <filter id="s03-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Риски шкалы: подсвечиваются до значения */}
      {G_TICKS.map((deg, i) => {
        const major = i % 10 === 0;
        const a = gPoint(major ? 84 : 86, deg);
        const b = gPoint(92, deg);
        const lit = i / 40 <= fraction;
        return (
          <motion.line
            key={deg}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={lit ? '#8EB4FF' : '#5B6B88'}
            strokeWidth={major ? 1.4 : 0.8}
            initial={{ opacity: 0.25 }}
            animate={{ opacity: on ? (lit ? 0.95 : 0.35) : 0.25 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.3, delay: delay + (i / 40) * 1.2 }}
          />
        );
      })}

      {/* Трек и заполнение */}
      <path d={arcPath(G_R, G_START, G_SWEEP)} fill="none" stroke="rgba(142,180,255,0.14)" strokeWidth="11" strokeLinecap="round" />
      <motion.path
        d={arcPath(G_R, G_START, G_SWEEP)}
        fill="none"
        stroke="url(#s03-gauge)"
        strokeWidth="11"
        strokeLinecap="round"
        filter="url(#s03-glow)"
        initial={{ pathLength: reducedMotion ? fraction : 0 }}
        animate={{ pathLength: on ? fraction : 0 }}
        transition={instant}
      />

      {/* Стрелка */}
      <circle cx={G_C.x} cy={G_C.y} r="34" fill="url(#s03-gauge-hub)" />
      <motion.line
        x1={G_C.x}
        y1={G_C.y}
        x2={needleX}
        y2={needleY}
        stroke="#DCE7FF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx={G_C.x} cy={G_C.y} r="6.5" fill="#0E1629" stroke="#8EB4FF" strokeWidth="2" />
      <motion.circle
        cx={tip.x}
        cy={tip.y}
        r="6"
        fill="#FFFFFF"
        filter="url(#s03-glow)"
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: on ? 1 : 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: delay + 1.3 }}
      />

    </svg>
  );
}

/* ------------------------------------------------------------------
   Полосы сравнения (например, спрос 2025 → 2035): длина — доля от максимума строк.
   В последней строке ярко горит прирост относительно предыдущей.
   ------------------------------------------------------------------ */

const SEGMENTS = 25;

export interface BarRow {
  label: string;
  value: number;
  display: string;
}

interface BarsVisualProps {
  rows: readonly BarRow[];
  title?: string;
  delay?: number;
}

const SEG_OFF = 'rgba(142,180,255,0.14)';
const SEG_BASE = 'rgba(142,180,255,0.5)';
const SEG_KEEP = 'rgba(37,147,250,0.5)';
const SEG_GROW = '#2593FA';

export function BarsVisual({ rows, title, delay = 0 }: BarsVisualProps) {
  const { ready, reducedMotion } = useScene();
  const on = ready || reducedMotion;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const litCounts = rows.map((r) => Math.round((r.value / max) * SEGMENTS));

  return (
    <div className="flex h-full w-full flex-col justify-center gap-[var(--gap-2)]" aria-hidden>
      {title ? <p className="t-micro font-semibold text-highlight">{title}</p> : null}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[var(--gap-2)] gap-y-[var(--gap-2)]">
        {rows.map((row, r) => {
          const last = r === rows.length - 1;
          const lit = litCounts[r];
          const prev = r > 0 ? litCounts[r - 1] : 0;
          const rowDelay = delay + 0.3 + r * 0.45;
          return (
            <Fragment key={row.label}>
              <span className="t-micro font-display text-mute">{row.label}</span>
              <div className="flex h-[clamp(16px,calc(var(--u)*1.7),30px)] gap-[2px]">
                {Array.from({ length: SEGMENTS }, (_, i) => {
                  const isLit = i < lit;
                  const grow = last && rows.length > 1 && isLit && i >= prev;
                  const color = !isLit ? SEG_OFF : !last ? SEG_BASE : grow ? SEG_GROW : SEG_KEEP;
                  return (
                    <motion.span
                      key={i}
                      className="flex-1 rounded-[3px]"
                      initial={{ backgroundColor: SEG_OFF, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
                      animate={
                        on
                          ? {
                              backgroundColor: color,
                              boxShadow: grow ? '0 0 12px rgba(37,147,250,0.75)' : '0 0 0 rgba(0,0,0,0)',
                            }
                          : undefined
                      }
                      transition={reducedMotion ? { duration: 0 } : { duration: 0.3, delay: rowDelay + i * 0.035 }}
                    />
                  );
                })}
              </div>
              <span className={`t-micro whitespace-nowrap ${last ? 'font-semibold text-white' : 'text-soft'}`}>{row.display}</span>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Матрица 10×10: загорается N точек из 100 (по рядам снизу вверх).
   ------------------------------------------------------------------ */

export function DotMatrixVisual({ fraction, delay = 0 }: VisualProps) {
  const { ready, reducedMotion } = useScene();
  const on = ready || reducedMotion;
  const lit = Math.round(fraction * 100);
  const step = lit > 0 ? 1.4 / lit : 0;

  return (
    <svg viewBox="0 0 100 100" className="h-full w-auto max-w-full" aria-hidden>
      <defs>
        <filter id="s03-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {Array.from({ length: 100 }, (_, i) => {
        const row = 9 - Math.floor(i / 10); // заполнение снизу вверх
        const col = i % 10;
        const isLit = i < lit;
        return (
          <motion.circle
            key={i}
            cx={5 + col * 10}
            cy={5 + row * 10}
            r="3.1"
            initial={{ fill: 'rgba(91,107,136,0.4)', opacity: 0.7 }}
            animate={on ? { fill: isLit ? '#2593FA' : 'rgba(91,107,136,0.4)', opacity: 1 } : undefined}
            filter={isLit && on ? 'url(#s03-dot-glow)' : undefined}
            transition={
              reducedMotion ? { duration: 0 } : { duration: 0.3, delay: isLit ? delay + 0.2 + i * step : delay }
            }
          />
        );
      })}
    </svg>
  );
}
