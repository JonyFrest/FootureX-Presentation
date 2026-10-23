import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChartLine, Package, Presentation, Rocket } from 'lucide-react';
import { Reveal } from '@/components/scene';
import { drawStyle } from '../s04/LifecycleRing';
import {
  CASCADE,
  COLUMNS,
  EDGES,
  INPUTS,
  LOOP_LABEL,
  METHOD_NOTE,
  OUTPUTS,
  SCRUM,
  SPRINTS,
  SPRINTS_BADGE,
  highlightedEdges,
  highlightedNodes,
  type EdgeKind,
  type NodeKey,
} from './model';

interface FlowDiagramProps {
  ready: boolean;
  reducedMotion: boolean;
}

interface Pt {
  x: number;
  y: number;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Иконки результатов (в данных — только текст). */
export const OUTPUT_ICONS: Record<string, LucideIcon> = { increment: Package, launch: Rocket, seed: Presentation };

/** Положение элемента относительно контейнера по offset-цепочке (не зависит от CSS-трансформаций сцены). */
function relBox(el: HTMLElement, container: HTMLElement): Box {
  let left = 0;
  let top = 0;
  let node: HTMLElement | null = el;
  while (node && node !== container) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { left, top, width: el.offsetWidth, height: el.offsetHeight };
}

const right = (b: Box): Pt => ({ x: b.left + b.width, y: b.top + b.height / 2 });
const left = (b: Box): Pt => ({ x: b.left, y: b.top + b.height / 2 });
const bottom = (b: Box) => b.top + b.height;
const cx = (b: Box) => b.left + b.width / 2;
const cy = (b: Box) => b.top + b.height / 2;

function curve(a: Pt, b: Pt): string {
  const dx = Math.max(28, (b.x - a.x) * 0.5);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

const line = (a: Pt, b: Pt) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

/** Отступ «ворот» каскада от левого края следующей ступени, px. */
const GATE_INSET = 22;

interface Geometry {
  w: number;
  h: number;
  paths: Record<string, string>;
  lengths: Record<string, number>;
  /** Середины рёбер каскада — там стоят ромбы «ворот». */
  gates: Record<string, Pt>;
  loopLabel: Pt;
}

const DELAY: Record<EdgeKind, number> = {
  in: 0,
  gate: 0.3,
  feed: 0.45,
  cycle: 0.6,
  milestone: 0.75,
  out: 0.9,
  chain: 1.05,
  loop: 1.25,
};

const STROKE: Record<EdgeKind, { color: string; width: number }> = {
  in: { color: 'rgba(142,180,255,0.4)', width: 1.4 },
  gate: { color: 'rgba(142,180,255,0.7)', width: 1.6 },
  feed: { color: 'rgba(142,180,255,0.6)', width: 2 },
  cycle: { color: 'rgba(142,180,255,0.75)', width: 1.8 },
  milestone: { color: 'rgba(142,180,255,0.32)', width: 1.4 },
  out: { color: 'rgba(142,180,255,0.6)', width: 2 },
  chain: { color: 'rgba(142,180,255,0.6)', width: 1.6 },
  loop: { color: 'rgba(142,180,255,0.5)', width: 1.4 },
};

/** Схема «Вход → Каскад этапа → Scrum-цикл → Результат» с обратной связью от метрик беты к бэклогу. */
export function FlowDiagram({ ready, reducedMotion }: FlowDiagramProps) {
  const uid = useId().replace(/:/g, '');
  const container = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [hover, setHover] = useState<NodeKey | null>(null);

  const register = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) nodes.current.set(key, el);
      else nodes.current.delete(key);
    },
    [],
  );

  const measure = useCallback(() => {
    const root = container.current;
    if (!root) return;
    const get = (key: string) => {
      const el = nodes.current.get(key);
      return el ? relBox(el, root) : null;
    };
    const inCard = get('card:in');
    const scCard = get('card:sc');
    const outCard = get('card:out');
    const stCol = get('card:st');
    if (!inCard || !scCard || !outCard || !stCol) return;

    const paths: Record<string, string> = {};
    const lengths: Record<string, number> = {};
    const gates: Record<string, Pt> = {};
    const channelY = bottom(scCard) + 18;

    for (const e of EDGES) {
      if (e.kind === 'loop') continue;
      const src = get(e.from);
      const dst = get(e.to);
      if (!src || !dst) continue;
      switch (e.kind) {
        case 'in':
        case 'feed':
        case 'out': {
          // Связи Scrum-цикла с соседями начинаются/заканчиваются на краю стеклянной карточки цикла.
          const a = e.kind === 'out' ? { x: scCard.left + scCard.width, y: cy(src) } : right(src);
          const b = e.kind === 'feed' ? { x: scCard.left, y: cy(dst) } : left(dst);
          paths[e.id] = curve(a, b);
          lengths[e.id] = dist(a, b) * 1.08;
          break;
        }
        case 'gate': {
          const x = dst.left + GATE_INSET;
          const a = { x, y: bottom(src) };
          const b = { x, y: dst.top };
          paths[e.id] = line(a, b);
          lengths[e.id] = dist(a, b);
          gates[e.id] = { x, y: (a.y + b.y) / 2 };
          break;
        }
        case 'chain': {
          const x = cx(dst);
          const a = { x, y: bottom(src) };
          const b = { x, y: dst.top };
          paths[e.id] = line(a, b);
          lengths[e.id] = dist(a, b);
          break;
        }
        case 'cycle': {
          // Короткие прямые стрелки по кругу 2×2: вправо, вниз, влево, вверх.
          let a: Pt;
          let b: Pt;
          if (Math.abs(cy(src) - cy(dst)) < 4) {
            const y = cy(src);
            a = dst.left > src.left ? { x: src.left + src.width, y } : { x: src.left, y };
            b = dst.left > src.left ? { x: dst.left, y } : { x: dst.left + dst.width, y };
          } else {
            const x = cx(src);
            a = dst.top > src.top ? { x, y: bottom(src) } : { x, y: src.top };
            b = dst.top > src.top ? { x, y: dst.top } : { x, y: bottom(dst) };
          }
          paths[e.id] = line(a, b);
          lengths[e.id] = dist(a, b);
          break;
        }
        case 'milestone': {
          // Вехи идут к результатам «под» Scrum-циклом: этап управляется каскадом, а не спринтами.
          const a = right(src);
          const b = left(dst);
          const x1 = scCard.left - 4;
          const x2 = scCard.left + scCard.width + 4;
          const d1 = x1 - a.x;
          const d2 = b.x - x2;
          paths[e.id] = [
            `M ${a.x} ${a.y}`,
            `C ${a.x + d1 * 0.55} ${a.y}, ${x1 - d1 * 0.45} ${channelY}, ${x1} ${channelY}`,
            `L ${x2} ${channelY}`,
            `C ${x2 + d2 * 0.45} ${channelY}, ${b.x - d2 * 0.55} ${b.y}, ${b.x} ${b.y}`,
          ].join(' ');
          lengths[e.id] = dist(a, { x: x1, y: channelY }) + (x2 - x1) + dist({ x: x2, y: channelY }, b);
          break;
        }
      }
    }

    // Петля обратной связи: из «Результата» вниз, влево под схемой и вверх во «Вход» (бэклог).
    const gx = cx(outCard);
    const gy = bottom(outCard);
    const hx = cx(inCard);
    const hy = bottom(inCard);
    const loopY = Math.max(gy, hy, bottom(stCol), channelY) + 30;
    const r = 18;
    paths.loop = [
      `M ${gx} ${gy}`,
      `L ${gx} ${loopY - r}`,
      `Q ${gx} ${loopY} ${gx - r} ${loopY}`,
      `L ${hx + r} ${loopY}`,
      `Q ${hx} ${loopY} ${hx} ${loopY - r}`,
      `L ${hx} ${hy + 4}`,
    ].join(' ');
    lengths.loop = loopY - gy + (gx - hx) + (loopY - hy);

    setGeo({
      w: root.offsetWidth,
      h: root.offsetHeight,
      paths,
      lengths,
      gates,
      loopLabel: { x: (hx + gx) / 2, y: loopY },
    });
  }, []);

  useLayoutEffect(() => {
    measure();
    const root = container.current;
    if (!root) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    void document.fonts?.ready.then(() => measure());
    return () => ro.disconnect();
  }, [measure]);

  // Порядок прорисовки: колонка за колонкой, затем петля; потом бегут точки.
  const drawn = ready || reducedMotion;
  const [flowing, setFlowing] = useState(false);
  useEffect(() => {
    if (!ready || reducedMotion) return;
    const t = window.setTimeout(() => setFlowing(true), 1900);
    return () => window.clearTimeout(t);
  }, [ready, reducedMotion]);

  const litEdges = useMemo(() => highlightedEdges(hover), [hover]);
  const litNodes = useMemo(() => highlightedNodes(litEdges, hover), [litEdges, hover]);
  const nodeState = (key: NodeKey): NodeState => (litNodes ? (litNodes.has(key) ? 'on' : 'off') : 'idle');

  const hoverProps = (key: NodeKey) => ({
    onMouseEnter: () => setHover(key),
    onMouseLeave: () => setHover((h) => (h === key ? null : h)),
    onFocus: () => setHover(key),
    onBlur: () => setHover((h) => (h === key ? null : h)),
    onClick: () => setHover(key),
  });

  const node = (key: NodeKey) => ({ ref: register(key), state: nodeState(key), hover: hoverProps(key) });

  const renderEdge = (e: (typeof EDGES)[number], g: Geometry) => {
    const d = g.paths[e.id];
    if (!d) return null;
    const on = litEdges?.has(e.id) ?? false;
    const dim = litEdges !== null && !on;
    const st = STROKE[e.kind];
    const gate = g.gates[e.id];
    const short = e.kind === 'cycle' || e.kind === 'gate' || e.kind === 'chain';
    return (
      <g key={e.id} style={{ opacity: dim ? 0.12 : 1, transition: 'opacity 0.35s ease' }}>
        {on ? <path d={d} fill="none" stroke="#2593FA" strokeOpacity="0.35" strokeWidth="7" strokeLinecap="round" /> : null}
        <path
          d={d}
          pathLength={1}
          fill="none"
          stroke={on ? '#DCE7FF' : st.color}
          strokeWidth={on ? 2.2 : st.width}
          strokeLinecap="round"
          markerEnd={`url(#${on ? 'arr-hi' : 'arr'}-${uid})`}
          style={drawStyle(drawn, reducedMotion, short ? 0.4 : 0.9, DELAY[e.kind])}
        />
        {gate ? <GateMark at={gate} on={on} drawn={drawn} reducedMotion={reducedMotion} delay={DELAY.gate + 0.25} /> : null}
        {flowing ? <FlowDot d={d} length={g.lengths[e.id] ?? 200} bright={on} seed={e.id} /> : null}
      </g>
    );
  };

  /** Слой связей (обычная функция, а не компонент — чтобы SVG и бегущие точки не пересоздавались при подсветке). */
  const edgeLayer = (layer: 'base' | 'top') =>
    geo ? (
      <svg
        className={`pointer-events-none absolute inset-0 overflow-visible ${layer === 'top' ? 'z-20' : 'z-0'}`}
        width={geo.w}
        height={geo.h}
        viewBox={`0 0 ${geo.w} ${geo.h}`}
        aria-hidden
        focusable="false"
      >
        {layer === 'base' ? (
          <defs>
            <marker id={`arr-${uid}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#8EB4FF" />
            </marker>
            <marker id={`arr-hi-${uid}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#FFFFFF" />
            </marker>
          </defs>
        ) : null}
        {EDGES.filter((e) => (e.kind === 'cycle') === (layer === 'top')).map((e) => renderEdge(e, geo))}
      </svg>
    ) : null;

  return (
    <div ref={container} className="relative w-full">
      {/* Слой связей: основной — под колонками, Scrum-цикл — поверх стеклянной карточки цикла */}
      {edgeLayer('base')}
      {edgeLayer('top')}

      {/* Колонки */}
      <div className="relative z-10 grid grid-cols-[minmax(0,0.92fr)_minmax(0,0.98fr)_minmax(0,1.3fr)_minmax(0,0.95fr)] grid-rows-[auto_auto] items-center gap-x-[clamp(40px,calc(var(--u)*5.2),110px)] gap-y-[var(--gap-2)]">
        {COLUMNS.map((c) => (
          <ColumnLabel key={c.id} n={c.n} en={c.en} ru={c.ru} focal={c.id === 'sc'} />
        ))}

        {/* 01 — Вход */}
        <Reveal delay={0.16} x={-14} y={0}>
          <div
            ref={register('card:in')}
            className="relative flex flex-col gap-[clamp(4px,calc(var(--u)*0.45),9px)] rounded-[var(--radius-md)] border border-white/8 bg-[rgba(7,10,18,0.35)] p-[clamp(5px,calc(var(--u)*0.45),9px)]"
          >
            {INPUTS.map((n) => {
              const p = node(`in:${n.id}`);
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  ref={p.ref}
                  type="button"
                  aria-label={`${n.label}: показать связи`}
                  {...p.hover}
                  className={`flex cursor-pointer items-center gap-[var(--gap-1)] rounded-[12px] border px-[clamp(8px,calc(var(--u)*0.7),14px)] py-[clamp(5px,calc(var(--u)*0.5),10px)] text-left transition-[transform,border-color,background-color,opacity,box-shadow] duration-300 hover:-translate-y-0.5 ${stateClass(p.state, 'dark')}`}
                >
                  {Icon ? <Icon className="size-[clamp(14px,calc(var(--u)*1.15),21px)] shrink-0 text-secondary" aria-hidden strokeWidth={1.8} /> : null}
                  <span className="t-small font-medium leading-tight text-white">{n.label}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* 02 — Каскад этапа: ступени сдвигаются вправо, между ними — «ворота» */}
        <Reveal delay={0.22} x={-8} y={0}>
          <div ref={register('card:st')} className="flex flex-col gap-[clamp(18px,calc(var(--u)*2),38px)]">
            {CASCADE.map((n, i) => {
              const p = node(`st:${n.id}`);
              return (
                <button
                  key={n.id}
                  ref={p.ref}
                  type="button"
                  aria-label={`Каскад, шаг ${i + 1}: ${n.label}${n.sub ? ` (${n.sub})` : ''}: показать связи`}
                  {...p.hover}
                  style={{ marginLeft: `${i * 9}%`, width: '82%' }}
                  className={`glass relative flex cursor-pointer flex-col rounded-[12px] border py-[clamp(6px,calc(var(--u)*0.6),12px)] pl-[clamp(12px,calc(var(--u)*1),20px)] pr-[clamp(8px,calc(var(--u)*0.7),14px)] text-left transition-[transform,border-color,background-color,opacity,box-shadow] duration-300 hover:-translate-y-0.5 ${stateClass(p.state, 'glass')}`}
                >
                  <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[image:var(--grad-brand)]" />
                  <span className="t-small font-semibold leading-tight text-white">{n.label}</span>
                  {n.sub ? <span className="t-micro leading-tight text-highlight/85">{n.sub}</span> : null}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* 03 — Scrum-цикл (главный акцент) */}
        <Reveal delay={0.3} scale={0.97} y={10}>
          <div
            ref={register('card:sc')}
            className="glass-strong relative p-[clamp(8px,calc(var(--u)*0.8),16px)] shadow-[0_0_0_1px_rgba(37,147,250,0.35),0_24px_70px_-26px_rgba(37,80,250,0.85)]"
            style={{ borderColor: 'rgba(37,147,250,0.55)' }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-secondary to-transparent"
            />
            <div className="relative grid auto-rows-fr grid-cols-2 gap-[clamp(26px,calc(var(--u)*2.7),52px)]">
              {SCRUM.map((n, i) => {
                const p = node(`sc:${n.id}`);
                // Порядок в сетке 2×2 по часовой стрелке: ↖ ↗ ↘ ↙.
                const area = ['1 / 1', '1 / 2', '2 / 2', '2 / 1'][i];
                return (
                  <button
                    key={n.id}
                    ref={p.ref}
                    type="button"
                    aria-label={`Scrum, шаг ${i + 1}: ${n.label}: показать связи`}
                    {...p.hover}
                    style={{ gridArea: area }}
                    className={`flex cursor-pointer flex-col justify-center gap-0.5 rounded-[12px] border px-[clamp(8px,calc(var(--u)*0.7),14px)] py-[clamp(6px,calc(var(--u)*0.6),12px)] text-left transition-[transform,border-color,background-color,opacity] duration-300 hover:-translate-y-0.5 ${stateClass(p.state, 'focal')}`}
                  >
                    <span className="t-micro font-display text-highlight">{String(i + 1).padStart(2, '0')}</span>
                    <span className="t-small font-semibold leading-tight text-white">{n.label}</span>
                  </button>
                );
              })}
              {/* Центр цикла: сколько раз он повторяется */}
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 grid size-[clamp(44px,calc(var(--u)*3.6),70px)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-secondary/60 bg-[rgba(14,22,41,0.95)] shadow-[0_0_24px_-4px_rgba(37,147,250,0.75)]"
                aria-label={SPRINTS_BADGE}
                role="img"
              >
                <span className="t-small font-display leading-none text-white" aria-hidden>
                  ×{SPRINTS}
                </span>
              </span>
            </div>
          </div>
        </Reveal>

        {/* 04 — Результат */}
        <Reveal delay={0.38} x={14} y={0}>
          <div ref={register('card:out')} className="flex flex-col gap-[clamp(16px,calc(var(--u)*1.7),32px)]">
            {OUTPUTS.map((n, i) => {
              const p = node(`out:${n.id}`);
              const Icon = OUTPUT_ICONS[n.id];
              const last = i === OUTPUTS.length - 1;
              return (
                <button
                  key={n.id}
                  ref={p.ref}
                  type="button"
                  aria-label={`${n.label}: показать связи`}
                  {...p.hover}
                  className={`glass flex cursor-pointer items-center gap-[var(--gap-1)] rounded-[12px] border px-[clamp(8px,calc(var(--u)*0.8),16px)] py-[clamp(6px,calc(var(--u)*0.6),12px)] text-left transition-[transform,border-color,background-color,opacity,box-shadow] duration-300 hover:-translate-y-0.5 ${stateClass(p.state, last ? 'goal' : 'glass')}`}
                >
                  {Icon ? <Icon className="size-[clamp(14px,calc(var(--u)*1.15),21px)] shrink-0 text-secondary" aria-hidden strokeWidth={1.8} /> : null}
                  <span className={`t-small leading-tight text-white ${last ? 'font-semibold' : 'font-medium'}`}>{n.label}</span>
                </button>
              );
            })}
          </div>
        </Reveal>
      </div>

      {/* Петля обратной связи: место под линией + подпись */}
      <div className="h-[clamp(64px,calc(var(--u)*5.6),108px)]" aria-hidden />
      {geo ? (
        <button
          type="button"
          aria-label={`Обратная связь: ${LOOP_LABEL}`}
          {...hoverProps('loop')}
          className={`chip absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer gap-2 px-3 py-1.5 hover:border-secondary/70 hover:bg-[rgba(37,80,250,0.3)] ${
            nodeState('loop') === 'on' ? 'border-secondary/80 bg-[rgba(37,80,250,0.32)]' : 'bg-[rgba(10,16,32,0.92)]'
          }`}
          style={{
            left: geo.loopLabel.x,
            top: geo.loopLabel.y,
            opacity: drawn ? 1 : 0,
            transition: reducedMotion ? 'none' : 'opacity 0.5s ease 1.4s, border-color 0.3s ease, background-color 0.3s ease',
          }}
        >
          <ChartLine className="size-[1.15em] text-secondary" aria-hidden />
          <span className="t-small font-medium text-ice">{LOOP_LABEL}</span>
        </button>
      ) : null}
      <p className="t-micro mt-[var(--gap-1)] text-right text-mute">{METHOD_NOTE}</p>
    </div>
  );
}

type NodeState = 'on' | 'off' | 'idle';

/** Классы состояния узла: подсвечен / приглушён / обычный. */
function stateClass(st: NodeState, tone: 'dark' | 'glass' | 'focal' | 'goal'): string {
  const off = st === 'off' ? 'opacity-45' : 'opacity-100';
  if (st === 'on') {
    return `${off} border-secondary/80 bg-[rgba(18,34,82,0.88)] shadow-[0_0_0_1px_rgba(37,147,250,0.3),0_10px_30px_-12px_rgba(37,80,250,0.8)]`;
  }
  switch (tone) {
    case 'dark':
      return `${off} border-white/10 bg-[rgba(10,16,32,0.78)] hover:border-secondary/50`;
    case 'focal':
      return `${off} border-white/10 bg-white/[0.04] hover:border-secondary/50`;
    case 'goal':
      return `${off} border-secondary/45 hover:border-secondary/70`;
    default:
      return `${off} border-white/10 hover:border-secondary/50`;
  }
}

function ColumnLabel({ n, en, ru, focal = false }: { n: string; en: string; ru: string; focal?: boolean }): ReactNode {
  return (
    <Reveal delay={0.1} y={8}>
      <p className="t-micro font-display uppercase tracking-[0.18em] text-highlight">
        <span className="text-white">{n}</span> · {en}
      </p>
      <p className={`t-h3 mt-0.5 ${focal ? 'text-gradient' : 'text-white'}`}>{ru}</p>
    </Reveal>
  );
}

/** Ромб «ворот» stage-gate на переходе между ступенями каскада. */
function GateMark({ at, on, drawn, reducedMotion, delay }: { at: Pt; on: boolean; drawn: boolean; reducedMotion: boolean; delay: number }) {
  const s = 5.5;
  return (
    <path
      d={`M ${at.x} ${at.y - s} L ${at.x + s} ${at.y} L ${at.x} ${at.y + s} L ${at.x - s} ${at.y} Z`}
      fill={on ? '#2593FA' : '#0E1629'}
      stroke={on ? '#FFFFFF' : '#8EB4FF'}
      strokeWidth="1.4"
      style={{ opacity: drawn ? 1 : 0, transition: reducedMotion ? 'none' : `opacity 0.4s ease ${delay}s` }}
    />
  );
}

/** Точка данных, бегущая по связи (SVG animateMotion). Фаза зависит от id, чтобы потоки не шли в ногу. */
function FlowDot({ d, length, bright, seed }: { d: string; length: number; bright: boolean; seed: string }) {
  const dur = Math.min(4.2, Math.max(1.6, length / 120));
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  const begin = `${-((h % 100) / 100) * dur}s`;
  const common = { dur: `${dur}s`, repeatCount: 'indefinite', begin } as const;
  return (
    <g opacity={bright ? 1 : 0.75}>
      <circle r={bright ? 7 : 5.5} fill="#2593FA" opacity="0.35">
        <animateMotion {...common} path={d} />
        <animate attributeName="opacity" values="0;0.35;0.35;0" keyTimes="0;0.12;0.85;1" {...common} />
      </circle>
      <circle r={bright ? 2.8 : 2.2} fill="#FFFFFF">
        <animateMotion {...common} path={d} />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.85;1" {...common} />
      </circle>
    </g>
  );
}

