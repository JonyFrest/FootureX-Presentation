import { useId } from 'react';
import { Gauge } from 'lucide-react';
import { LOW_TIER } from '@/app/deviceTier';
import { CORE, PILLARS } from './data';

/* Координаты viewBox. Ядро «Контроль» в центре, четыре сегмента-измерения на диагоналях,
   кнопки измерений — сверху (2) и снизу (2), каждая напротив своего сегмента. */
const VB_W = 560;
const VB_H = 450;
const CX = 280;
const CY = 225;
const R_CORE = 98;
const R_SEG_IN = 110;
const R_SEG_OUT = 124;
/** Угол сегмента на экране (0° — вправо, по часовой). Порядок — как читается сетка 2×2: СЗ, СВ, ЮЗ, ЮВ. */
const ANGLES = [-135, -45, 135, 45];
/** Центры кнопок измерений (в том же порядке). */
const PILL_POS = [
  { x: 129, y: 38 },
  { x: 431, y: 38 },
  { x: 129, y: 412 },
  { x: 431, y: 412 },
];

const rad = (d: number) => (d * Math.PI) / 180;
const polar = (r: number, d: number) => ({ x: CX + r * Math.cos(rad(d)), y: CY + r * Math.sin(rad(d)) });
const pct = (v: number, total: number) => `${(v / total) * 100}%`;

function arcPath(rIn: number, rOut: number, from: number, to: number) {
  const a = polar(rOut, from);
  const b = polar(rOut, to);
  const c = polar(rIn, to);
  const d = polar(rIn, from);
  const large = to - from > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${rOut} ${rOut} 0 ${large} 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${rIn} ${rIn} 0 ${large} 0 ${d.x} ${d.y} Z`;
}

interface ControlCoreProps {
  selected: number;
  onSelect: (index: number) => void;
  ready: boolean;
  reducedMotion: boolean;
  /** Телефон: без латинских подписей в кнопках. */
  compact?: boolean;
}

/** Ядро контроля с четырьмя измерениями (сроки, бюджет, качество, ценность) — выбор измерения кнопкой. */
export function ControlCore({ selected, onSelect, ready, reducedMotion, compact = false }: ControlCoreProps) {
  const uid = useId().replace(/:/g, '');
  const drawn = ready || reducedMotion;
  // Телефон: без вращения орбит — SMIL-поворот перерисовывает всё ядро в каждом кадре.
  const spin = ready && !reducedMotion && !LOW_TIER;

  return (
    <div className="relative mx-auto w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}`, maxWidth: compact ? 460 : 680 }}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden focusable="false">
        <defs>
          <radialGradient id={`core-${uid}`} cx="50%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#2593FA" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#2550FA" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0E1629" stopOpacity="0.9" />
          </radialGradient>
          <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2550FA" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#2550FA" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`seg-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2593FA" />
            <stop offset="100%" stopColor="#2550FA" />
          </linearGradient>
        </defs>

        {/* Подложка для читаемости и ореол */}
        <circle cx={CX} cy={CY} r={230} fill={`url(#halo-${uid})`} opacity="0.55" />
        <circle cx={CX} cy={CY} r={214} fill="rgba(7,10,18,0.5)" />

        {/* Орбиты */}
        <circle cx={CX} cy={CY} r={214} fill="none" stroke="rgba(142,180,255,0.14)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={168} fill="none" stroke="rgba(142,180,255,0.22)" strokeWidth="1" strokeDasharray="3 7" />
        <g>
          {spin ? (
            <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="48s" repeatCount="indefinite" />
          ) : null}
          {[20, 140, 260].map((d) => {
            const p = polar(168, d);
            return <circle key={d} cx={p.x} cy={p.y} r="3.2" fill="#DCE7FF" opacity="0.9" />;
          })}
        </g>
        <g>
          {spin ? (
            <animateTransform attributeName="transform" type="rotate" from={`360 ${CX} ${CY}`} to={`0 ${CX} ${CY}`} dur="80s" repeatCount="indefinite" />
          ) : null}
          {[70, 250].map((d) => {
            const p = polar(214, d);
            return <circle key={d} cx={p.x} cy={p.y} r="2.4" fill="#8EB4FF" opacity="0.8" />;
          })}
        </g>

        {/* Лучи от ядра к измерениям */}
        {ANGLES.map((deg, i) => {
          const a = polar(R_SEG_OUT + 4, deg);
          const pill = PILL_POS[i];
          const b = { x: pill.x + (CX - pill.x) * 0.16, y: pill.y + (pill.y < CY ? 30 : -30) };
          const on = i === selected;
          return (
            <line
              key={`beam-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={on ? '#DCE7FF' : 'rgba(142,180,255,0.35)'}
              strokeWidth={on ? 2 : 1.2}
              strokeDasharray={on ? undefined : '3 5'}
              style={{
                opacity: drawn ? 1 : 0,
                transition: reducedMotion ? 'none' : `opacity 0.6s ease ${0.5 + i * 0.12}s`,
              }}
            />
          );
        })}

        {/* Сегменты-измерения вокруг ядра */}
        {ANGLES.map((deg, i) => {
          const on = i === selected;
          return (
            <g key={`seg-${i}`} style={{ cursor: 'pointer' }} data-interactive onClick={() => onSelect(i)}>
              {on ? (
                <path d={arcPath(R_SEG_IN - 4, R_SEG_OUT + 8, deg - 40, deg + 40)} fill="#2593FA" opacity="0.22" />
              ) : null}
              <path
                d={arcPath(R_SEG_IN, R_SEG_OUT, deg - 38, deg + 38)}
                fill={on ? `url(#seg-${uid})` : 'rgba(142,180,255,0.22)'}
                stroke={on ? '#8EB4FF' : 'rgba(142,180,255,0.35)'}
                strokeWidth="1"
                style={{
                  transformOrigin: `${CX}px ${CY}px`,
                  transformBox: 'view-box',
                  transform: drawn ? 'scale(1)' : 'scale(0.9)',
                  opacity: drawn ? 1 : 0,
                  transition: reducedMotion
                    ? 'none'
                    : `transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.12}s, opacity 0.7s ease ${0.15 + i * 0.12}s`,
                }}
              />
            </g>
          );
        })}

        {/* Ядро */}
        <circle cx={CX} cy={CY} r={R_CORE} fill={`url(#core-${uid})`} stroke="rgba(142,180,255,0.45)" strokeWidth="1.2" />
        <circle cx={CX} cy={CY} r={R_CORE - 10} fill="none" stroke="rgba(142,180,255,0.18)" strokeWidth="1" />
      </svg>

      {/* Текст ядра */}
      <div
        className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
        style={{ left: pct(CX, VB_W), top: pct(CY, VB_H), width: pct(R_CORE * 1.62, VB_W) }}
      >
        <Gauge className="mb-1 size-[clamp(18px,calc(var(--u)*1.7),32px)] text-secondary" aria-hidden strokeWidth={1.7} />
        <span className="t-h3 leading-tight text-white">{CORE.label}</span>
        <span className="t-micro mt-1 whitespace-nowrap font-semibold leading-tight text-highlight">{CORE.caption}</span>
        <span className="t-micro leading-tight text-soft">{CORE.note}</span>
      </div>

      {/* Измерения контроля — кнопки */}
      {PILLARS.map((p, i) => {
        const on = i === selected;
        const Icon = p.icon;
        const pos = PILL_POS[i];
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={on}
            aria-label={`${p.ru}: инструменты и целевое значение`}
            onClick={() => onSelect(i)}
            onFocus={(e) => {
              if (e.currentTarget.matches(':focus-visible')) onSelect(i);
            }}
            className={`group absolute flex w-[46%] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-[var(--gap-1)] rounded-[14px] border px-[clamp(8px,calc(var(--u)*0.8),16px)] py-[clamp(6px,calc(var(--u)*0.6),12px)] text-left transition-[border-color,background-color,box-shadow] duration-300 ${
              on
                ? 'border-secondary/80 bg-[rgba(18,34,82,0.92)] shadow-[0_0_0_1px_rgba(37,147,250,0.3),0_14px_40px_-14px_rgba(37,80,250,0.85)]'
                : 'border-white/12 bg-[rgba(9,14,30,0.85)] hover:border-secondary/60'
            }`}
            style={{ left: pct(pos.x, VB_W), top: pct(pos.y, VB_H) }}
          >
            <span
              className={`grid size-[clamp(28px,calc(var(--u)*2.4),44px)] shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:-translate-y-0.5 ${
                on ? 'bg-[image:var(--grad-brand)] text-white' : 'border border-highlight/30 text-highlight'
              }`}
            >
              <Icon className="size-[52%]" strokeWidth={1.8} aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col transition-transform duration-300 group-hover:-translate-y-0.5">
              <span className="t-small font-semibold leading-tight text-white">{p.ru}</span>
              {!compact ? (
                <span className="t-micro font-display uppercase leading-tight tracking-[0.12em] text-highlight/80">{p.en}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
