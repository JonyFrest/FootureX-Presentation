import { useEffect, useId, useRef, useState } from 'react';
import { animate, useMotionValue, useMotionValueEvent } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { pad2 } from '@/data/scenes';
import { LIFECYCLE, LOOP_NOTE } from './stages';

/* Геометрия кольца в координатах viewBox. Кольцо — эллипс «в перспективе»:
   θ = 0 — ближняя к зрителю точка (низ), рост θ — по ходу цикла (низ → право → верх → лево). */
const VB_W = 1000;
const VB_H = 600;
const CX = 500;
const CY = 330;
const RX = 372;
const RY = 166;
const COUNT = LIFECYCLE.length;
const STEP = 360 / COUNT;
/** Длительность «прорисовки» кольца после остановки камеры, с. */
const DRAW_SEC = 1.3;

const RING_PATH = `M ${CX} ${CY + RY} A ${RX} ${RY} 0 0 0 ${CX} ${CY - RY} A ${RX} ${RY} 0 0 0 ${CX} ${CY + RY}`;

function project(deg: number, k = 1) {
  const t = (deg * Math.PI) / 180;
  return {
    x: CX + RX * k * Math.sin(t),
    y: CY + RY * k * Math.cos(t),
    /** 1 — ближняя точка, 0 — дальняя. */
    depth: (Math.cos(t) + 1) / 2,
  };
}

/** Направление касательной (по ходу цикла) в градусах экрана. */
function tangent(deg: number) {
  const t = (deg * Math.PI) / 180;
  return (Math.atan2(-RY * Math.sin(t), RX * Math.cos(t)) * 180) / Math.PI;
}

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

/** «Прорисовка» линии CSS-переходом stroke-dashoffset (у path задан pathLength=1). */
export function drawStyle(drawn: boolean, reducedMotion: boolean, sec: number, delay = 0) {
  return {
    strokeDasharray: 1,
    strokeDashoffset: drawn ? 0 : 1,
    opacity: drawn ? 1 : 0,
    transition: reducedMotion
      ? 'none'
      : `stroke-dashoffset ${sec}s cubic-bezier(0.45, 0, 0.2, 1) ${delay}s, opacity 0.2s ease ${delay}s`,
  } as const;
}

/** Размер .t-micro в px — повторяет --fs-micro из index.css: clamp(11.5px, u * 0.74, 14px). */
function microPx() {
  const u = Math.min(window.innerWidth, window.innerHeight * 1.7778) / 100;
  return Math.min(14, Math.max(11.5, u * 0.74));
}

/**
 * Минимальный масштаб дальних узлов: самый мелкий видимый текст (.t-micro) не меньше 11.5px.
 * На 1366×768 дальние узлы не уменьшаются, на больших экранах — до 0.88.
 */
function useMinNodeScale() {
  const [min, setMin] = useState(() => Math.min(1, 11.5 / microPx()));
  useEffect(() => {
    const onResize = () => setMin(Math.min(1, 11.5 / microPx()));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return min;
}

interface LifecycleRingProps {
  selected: number;
  onSelect: (index: number) => void;
  ready: boolean;
  reducedMotion: boolean;
}

export function LifecycleRing({ selected, onSelect, ready, reducedMotion }: LifecycleRingProps) {
  const uid = useId().replace(/:/g, '');
  const minScale = useMinNodeScale();
  const rot = useMotionValue(-selected * STEP);
  const [angle, setAngle] = useState(() => -selected * STEP);
  useMotionValueEvent(rot, 'change', (v) => setAngle(v));

  // Поворот кольца: выбранный этап выходит на передний план по кратчайшему пути.
  useEffect(() => {
    const current = rot.get();
    const target = -selected * STEP;
    const delta = ((((target - current) % 360) + 540) % 360) - 180;
    if (Math.abs(delta) < 0.01) return;
    if (reducedMotion) {
      rot.set(current + delta);
      return;
    }
    const controls = animate(rot, current + delta, { duration: 0.95, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [selected, reducedMotion, rot]);

  // Однократная «прорисовка» цикла: кольцо рисуется от этапа 1, узлы загораются по ходу.
  const [lit, setLit] = useState(reducedMotion ? COUNT : 0);
  useEffect(() => {
    if (!ready) return;
    if (reducedMotion) {
      setLit(COUNT);
      return;
    }
    const timers = LIFECYCLE.map((_, i) =>
      window.setTimeout(() => setLit((n) => Math.max(n, i + 1)), 150 + (i / COUNT) * DRAW_SEC * 1000),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [ready, reducedMotion]);

  const drawn = ready || reducedMotion;
  const spansAll = LIFECYCLE[selected]?.spansAll ?? false;
  const ticks = Array.from({ length: 48 }, (_, k) => k * 7.5 + angle);

  return (
    <div
      className="relative mx-auto w-full"
      style={{
        aspectRatio: `${VB_W} / ${VB_H}`,
        maxWidth: `calc((100dvh - var(--content-top) - var(--content-bottom)) * ${VB_W / VB_H})`,
      }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
        focusable="false"
      >
        <defs>
          <radialGradient id={`shade-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#070A12" stopOpacity="0.82" />
            <stop offset="70%" stopColor="#070A12" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#070A12" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`floor-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2550FA" stopOpacity="0.32" />
            <stop offset="55%" stopColor="#2550FA" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#2550FA" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`ring-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8EB4FF" stopOpacity="0.28" />
            <stop offset="60%" stopColor="#2593FA" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#DCE7FF" stopOpacity="1" />
          </linearGradient>
          <filter id={`soft-${uid}`} x="-10%" y="-20%" width="120%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2593FA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2593FA" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Платформа и вспомогательные орбиты */}
        <ellipse cx={CX} cy={CY - 30} rx={RX * 1.38} ry={RY * 1.75} fill={`url(#shade-${uid})`} />
        <ellipse cx={CX} cy={CY} rx={RX * 1.22} ry={RY * 1.22} fill={`url(#floor-${uid})`} />
        <ellipse cx={CX} cy={CY} rx={RX * 1.12} ry={RY * 1.12} fill="none" stroke="rgba(142,180,255,0.12)" strokeWidth="1" />
        {/* Внутренняя орбита — «сквозной» мониторинг и контроль: подсвечивается, когда выбран этот этап */}
        <ellipse
          cx={CX}
          cy={CY}
          rx={RX * 0.6}
          ry={RY * 0.6}
          fill="none"
          stroke={spansAll ? '#8EB4FF' : 'rgba(142,180,255,0.2)'}
          strokeOpacity={spansAll ? 0.75 : 1}
          strokeWidth={spansAll ? 1.6 : 1}
          strokeDasharray={spansAll ? '6 6' : '2 7'}
          style={{ transition: reducedMotion ? 'none' : 'stroke 0.5s ease, stroke-opacity 0.5s ease, stroke-width 0.5s ease' }}
        >
          {spansAll && ready && !reducedMotion ? (
            <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="2.4s" repeatCount="indefinite" />
          ) : null}
        </ellipse>

        {/* Шкала — вращается вместе с кольцом */}
        {ticks.map((deg, k) => {
          const a = project(deg, 0.955);
          const b = project(deg, k % 4 === 0 ? 1.06 : 1.03);
          return (
            <line
              key={k}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#8EB4FF"
              strokeOpacity={0.08 + 0.32 * a.depth}
              strokeWidth={k % 4 === 0 ? 1.4 : 1}
            />
          );
        })}

        {/* Основное кольцо цикла */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="rgba(142,180,255,0.12)" strokeWidth="2" />
        <path
          d={RING_PATH}
          pathLength={1}
          fill="none"
          stroke="#2593FA"
          strokeOpacity="0.55"
          strokeWidth="8"
          filter={`url(#soft-${uid})`}
          style={drawStyle(drawn, reducedMotion, DRAW_SEC)}
        />
        <path
          d={RING_PATH}
          pathLength={1}
          fill="none"
          stroke={`url(#ring-${uid})`}
          strokeWidth="2.6"
          strokeLinecap="round"
          style={drawStyle(drawn, reducedMotion, DRAW_SEC)}
        />

        {/* Стрелки направления между этапами */}
        {LIFECYCLE.map((_, i) => {
          const deg = i * STEP + STEP / 2 + angle;
          const p = project(deg);
          const s = 0.75 + 0.55 * p.depth;
          return (
            <g
              key={`arrow-${i}`}
              transform={`translate(${p.x} ${p.y}) rotate(${tangent(deg)}) scale(${s} ${s * (0.55 + 0.45 * p.depth)})`}
              opacity={lit > i ? 0.3 + 0.7 * p.depth : 0}
              style={{ transition: 'opacity 0.5s ease' }}
            >
              <path d="M -7 -8 L 4 0 L -7 8" fill="none" stroke="#DCE7FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}

        {/* Бегущий импульс по циклу (мягкий бесконечный цикл, выключен при reduced motion) */}
        {ready && !reducedMotion && lit >= COUNT ? <RingPulse glowId={`glow-${uid}`} /> : null}

        {/* Опорные точки узлов на кольце */}
        {LIFECYCLE.map((_, i) => {
          const p = project(i * STEP + angle);
          const isSel = i === selected;
          const on = lit > i;
          return (
            <g key={`anchor-${i}`} opacity={on ? 0.35 + 0.65 * p.depth : 0.25} style={{ transition: 'opacity 0.5s ease' }}>
              <ellipse cx={p.x} cy={p.y} rx={isSel ? 44 : 26} ry={isSel ? 16 : 10} fill={`url(#glow-${uid})`} opacity={isSel ? 0.9 : 0.55} />
              {isSel ? (
                <ellipse cx={p.x} cy={p.y} rx="26" ry="9.5" fill="none" stroke="#8EB4FF" strokeOpacity="0.8" strokeWidth="1.4" />
              ) : null}
              <circle cx={p.x} cy={p.y} r={isSel ? 6 : 4.2} fill={isSel ? '#FFFFFF' : '#DCE7FF'} />
            </g>
          );
        })}
      </svg>

      {/* Центр кольца */}
      <div
        className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
        style={{
          left: pct(CX, VB_W),
          top: pct(CY - 6, VB_H),
          width: pct(330, VB_W),
          opacity: drawn ? 1 : 0,
          transition: reducedMotion ? 'none' : 'opacity 0.7s ease 0.5s',
        }}
      >
        <RefreshCw className="mb-1.5 size-[clamp(14px,calc(var(--u)*1.2),22px)] text-secondary" aria-hidden strokeWidth={1.8} />
        <p className="t-small text-balance leading-snug text-ice">
          <span className="font-semibold text-white">{LOOP_NOTE.lead}</span> {LOOP_NOTE.rest}
        </p>
      </div>

      {/* Узлы-этапы: настоящие кнопки, глубина задаётся масштабом и прозрачностью */}
      {LIFECYCLE.map((stage, i) => {
        const p = project(i * STEP + angle);
        const isSel = i === selected;
        const on = lit > i;
        const scale = Math.max(minScale, 0.88 + 0.12 * p.depth);
        const opacity = on ? 0.62 + 0.38 * p.depth : 0.4;
        return (
          <button
            key={stage.id}
            type="button"
            data-interactive
            aria-pressed={isSel}
            aria-label={`Этап ${i + 1} из ${COUNT}: ${stage.ru}`}
            onClick={() => onSelect(i)}
            onFocus={(e) => {
              if (e.currentTarget.matches(':focus-visible')) onSelect(i);
            }}
            className="group absolute cursor-pointer outline-none focus-visible:outline-none"
            style={{
              left: pct(p.x, VB_W),
              top: pct(p.y, VB_H),
              zIndex: 10 + Math.round(p.depth * 10),
              transform: `translate(-50%, -100%) scale(${scale})`,
              transformOrigin: '50% 100%',
              opacity: isSel ? 1 : opacity,
              transition: 'opacity 0.5s ease',
            }}
          >
            <span
              className={`flex items-center gap-[var(--gap-1)] rounded-[14px] border py-[clamp(6px,calc(var(--u)*0.55),11px)] pl-[clamp(6px,calc(var(--u)*0.55),11px)] pr-[clamp(10px,calc(var(--u)*0.9),18px)] text-left transition-[transform,border-color,box-shadow,background-color] duration-300 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-secondary ${
                isSel
                  ? 'border-secondary/80 bg-[rgba(18,34,82,0.9)] shadow-[0_0_0_1px_rgba(37,147,250,0.35),0_16px_44px_-12px_rgba(37,80,250,0.85)]'
                  : 'border-white/12 bg-[rgba(9,14,30,0.82)] shadow-[0_12px_30px_-18px_rgba(0,0,0,0.9)] group-hover:border-secondary/60 group-hover:shadow-[0_0_0_1px_rgba(37,147,250,0.25),0_14px_36px_-16px_rgba(37,80,250,0.7)]'
              }`}
            >
              <span
                className={`t-micro grid size-[clamp(26px,calc(var(--u)*2.2),40px)] shrink-0 place-items-center rounded-full font-display ${
                  isSel ? 'bg-[image:var(--grad-brand)] text-white' : 'border border-highlight/30 text-highlight'
                }`}
              >
                {pad2(i + 1)}
              </span>
              <span className="flex flex-col">
                <span className="t-small max-w-[9.5em] font-semibold leading-tight text-white">{stage.ru}</span>
                <span className="t-micro font-display uppercase leading-tight tracking-[0.12em] text-highlight/85">
                  {stage.enShort ?? stage.en}
                </span>
              </span>
            </span>
            <span
              className={`mx-auto block h-[clamp(10px,calc(var(--u)*1.1),20px)] w-px bg-gradient-to-b ${
                isSel ? 'from-white to-secondary/0' : 'from-highlight/60 to-highlight/0'
              }`}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}

/** Импульс, бегущий по кольцу по ходу цикла; стартует с ближней точки. */
function RingPulse({ glowId }: { glowId: string }) {
  const glow = useRef<SVGAnimateMotionElement>(null);
  const dot = useRef<SVGAnimateMotionElement>(null);
  useEffect(() => {
    glow.current?.beginElement();
    dot.current?.beginElement();
  }, []);
  return (
    <g>
      <circle r="16" fill={`url(#${glowId})`} opacity="0.7">
        <animateMotion ref={glow} dur="9s" repeatCount="indefinite" path={RING_PATH} begin="indefinite" />
      </circle>
      <circle r="3.6" fill="#FFFFFF">
        <animateMotion ref={dot} dur="9s" repeatCount="indefinite" path={RING_PATH} begin="indefinite" />
      </circle>
    </g>
  );
}
