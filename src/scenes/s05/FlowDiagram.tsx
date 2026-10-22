import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { drawStyle } from '../s04/LifecycleRing';
import { ChartLine, Users } from 'lucide-react';
import { Reveal } from '@/components/scene';
import {
  AMO,
  AMO_NOTE,
  EDGES,
  EFFECTIVENESS,
  GROWTH_ITEMS,
  HR_PROCESSES,
  LOOP_LABEL,
  highlightedEdges,
  highlightedNodes,
  type Edge,
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

function curve(a: Pt, b: Pt): string {
  const dx = Math.max(28, (b.x - a.x) * 0.5);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

interface Geometry {
  w: number;
  h: number;
  paths: Record<string, string>;
  lengths: Record<string, number>;
  loopLabel: Pt;
}

/** Схема «HR-процессы → Сотрудник (AMO) → Эффективность → Рост» с обратной связью. */
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
    const amoCard = get('card:amo');
    const effCard = get('card:eff');
    const growth = get('growth');
    const hrGroup = get('card:hr');
    if (!amoCard || !effCard || !growth || !hrGroup) return;

    const paths: Record<string, string> = {};
    const lengths: Record<string, number> = {};
    const portOut = (b: Box, x = b.left + b.width): Pt => ({ x, y: b.top + b.height / 2 });
    const portIn = (b: Box, x = b.left): Pt => ({ x, y: b.top + b.height / 2 });

    for (const e of EDGES) {
      let a: Pt | null = null;
      let b: Pt | null = null;
      if (e.kind === 'hr') {
        const src = get(e.from);
        const dst = get(e.to);
        if (src && dst) {
          a = portOut(src);
          b = portIn(dst, amoCard.left);
        }
      } else if (e.kind === 'amo') {
        const src = get(e.from);
        const dst = get(e.to);
        if (src && dst) {
          a = portOut(src, amoCard.left + amoCard.width);
          b = portIn(dst, effCard.left);
        }
      } else if (e.kind === 'eff') {
        const src = get(e.from);
        if (src) {
          a = portOut(src, effCard.left + effCard.width);
          b = { x: growth.left, y: growth.top + growth.height / 2 };
        }
      }
      if (a && b) {
        paths[e.id] = curve(a, b);
        lengths[e.id] = Math.hypot(b.x - a.x, b.y - a.y) * 1.08;
      }
    }

    // Петля обратной связи: из «Роста» вниз, влево под схемой и вверх в HR-процессы.
    const gx = growth.left + growth.width / 2;
    const gy = growth.top + growth.height;
    const hx = hrGroup.left + hrGroup.width / 2;
    const hy = hrGroup.top + hrGroup.height;
    const loopY = Math.max(gy, hy, amoCard.top + amoCard.height) + 34;
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
      loopLabel: { x: (amoCard.left + amoCard.width + effCard.left) / 2, y: loopY },
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
    const t = window.setTimeout(() => setFlowing(true), 1700);
    return () => window.clearTimeout(t);
  }, [ready, reducedMotion]);

  const litEdges = useMemo(() => highlightedEdges(hover), [hover]);
  const litNodes = useMemo(() => highlightedNodes(litEdges, hover), [litEdges, hover]);
  const nodeState = (key: NodeKey): 'on' | 'off' | 'idle' => (litNodes ? (litNodes.has(key) ? 'on' : 'off') : 'idle');

  const hoverProps = (key: NodeKey) => ({
    onMouseEnter: () => setHover(key),
    onMouseLeave: () => setHover((h) => (h === key ? null : h)),
    onFocus: () => setHover(key),
    onBlur: () => setHover((h) => (h === key ? null : h)),
    onClick: () => setHover(key),
  });

  const delayFor = (e: Edge) => (e.kind === 'hr' ? 0 : e.kind === 'amo' ? 0.35 : e.kind === 'eff' ? 0.7 : 1.0);

  return (
    <div ref={container} className="relative w-full">
      {/* Слой связей */}
      {geo ? (
        <svg
          className="pointer-events-none absolute inset-0 z-0 overflow-visible"
          width={geo.w}
          height={geo.h}
          viewBox={`0 0 ${geo.w} ${geo.h}`}
          aria-hidden
          focusable="false"
        >
          <defs>
            <marker id={`arr-${uid}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#8EB4FF" />
            </marker>
            <marker id={`arr-hi-${uid}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#FFFFFF" />
            </marker>
          </defs>
          {EDGES.map((e) => {
            const d = geo.paths[e.id];
            if (!d) return null;
            const on = litEdges?.has(e.id) ?? false;
            const dim = litEdges !== null && !on;
            const isLoop = e.kind === 'loop';
            return (
              <g key={e.id} style={{ opacity: dim ? 0.12 : 1, transition: 'opacity 0.35s ease' }}>
                {on ? <path d={d} fill="none" stroke="#2593FA" strokeOpacity="0.35" strokeWidth="7" strokeLinecap="round" /> : null}
                <path
                  d={d}
                  pathLength={1}
                  fill="none"
                  stroke={on ? '#DCE7FF' : isLoop ? 'rgba(142,180,255,0.5)' : e.kind === 'eff' ? 'rgba(142,180,255,0.6)' : 'rgba(142,180,255,0.4)'}
                  strokeWidth={on ? 2.2 : e.kind === 'eff' ? 2 : 1.4}
                  strokeLinecap="round"
                  markerEnd={`url(#${on ? 'arr-hi' : 'arr'}-${uid})`}
                  style={drawStyle(drawn, reducedMotion, 0.9, delayFor(e))}
                />
                {flowing ? (
                  <FlowDot d={d} length={geo.lengths[e.id] ?? 200} bright={on} seed={e.id} />
                ) : null}
              </g>
            );
          })}
        </svg>
      ) : null}

      {/* Колонки */}
      <div className="relative z-10 grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)] grid-rows-[auto_auto] items-center gap-x-[clamp(44px,calc(var(--u)*6.4),130px)] gap-y-[var(--gap-2)]">
        <ColumnLabel n="01" en="HR Processes" ru="HR-процессы" />
        <ColumnLabel n="02" en="Employee · AMO" ru="Сотрудник" focal />
        <ColumnLabel n="03" en="Performance" ru="Эффективность" />
        <ColumnLabel n="04" en="Growth" ru="Рост FootureX" />

        {/* 01 — HR-процессы */}
        <Reveal delay={0.16} x={-14} y={0}>
          <div
            ref={register('card:hr')}
            className="relative flex flex-col gap-[clamp(4px,calc(var(--u)*0.45),9px)] rounded-[var(--radius-md)] border border-white/8 bg-[rgba(7,10,18,0.35)] p-[clamp(5px,calc(var(--u)*0.45),9px)]"
          >
            {HR_PROCESSES.map((p) => {
              const key: NodeKey = `hr:${p.id}`;
              const st = nodeState(key);
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  ref={register(key)}
                  type="button"
                  aria-label={`${p.label}: показать связи`}
                  {...hoverProps(key)}
                  className={`group flex cursor-pointer items-center gap-[var(--gap-1)] rounded-[12px] border px-[clamp(8px,calc(var(--u)*0.7),14px)] py-[clamp(5px,calc(var(--u)*0.5),10px)] text-left transition-[transform,border-color,background-color,opacity,box-shadow] duration-300 hover:-translate-y-0.5 ${
                    st === 'on'
                      ? 'border-secondary/80 bg-[rgba(18,34,82,0.88)] shadow-[0_0_0_1px_rgba(37,147,250,0.3),0_10px_30px_-12px_rgba(37,80,250,0.8)]'
                      : 'border-white/10 bg-[rgba(10,16,32,0.78)] hover:border-secondary/50'
                  } ${st === 'off' ? 'opacity-45' : 'opacity-100'}`}
                >
                  <Icon className="size-[clamp(14px,calc(var(--u)*1.15),21px)] shrink-0 text-secondary" aria-hidden strokeWidth={1.8} />
                  <span className="t-small font-medium text-white">{p.label}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* 02 — Сотрудник: модель AMO (главный акцент) */}
        <Reveal delay={0.24} scale={0.97} y={10}>
          <div
            ref={register('card:amo')}
            className="glass-strong relative flex flex-col gap-[var(--gap-1)] p-[clamp(8px,calc(var(--u)*0.8),16px)] shadow-[0_0_0_1px_rgba(37,147,250,0.35),0_24px_70px_-26px_rgba(37,80,250,0.85)]"
            style={{ borderColor: 'rgba(37,147,250,0.55)' }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-secondary to-transparent"
            />
            <div className="flex items-center gap-2 px-1 pb-0.5">
              <Users className="size-[clamp(14px,calc(var(--u)*1.1),20px)] text-highlight" aria-hidden strokeWidth={1.8} />
              <span className="t-micro font-display uppercase tracking-[0.16em] text-highlight">A · M · O</span>
            </div>
            {AMO.map((a) => {
              const key: NodeKey = `amo:${a.id}`;
              const st = nodeState(key);
              return (
                <button
                  key={a.id}
                  ref={register(key)}
                  type="button"
                  aria-label={`${a.ru} (${a.en}): показать связи`}
                  {...hoverProps(key)}
                  className={`flex cursor-pointer items-center gap-[var(--gap-2)] rounded-[12px] border px-[clamp(8px,calc(var(--u)*0.7),14px)] py-[clamp(6px,calc(var(--u)*0.6),12px)] text-left transition-[transform,border-color,background-color,opacity] duration-300 hover:-translate-y-0.5 ${
                    st === 'on' ? 'border-secondary/80 bg-[rgba(37,80,250,0.22)]' : 'border-white/8 bg-white/[0.03] hover:border-secondary/50'
                  } ${st === 'off' ? 'opacity-45' : 'opacity-100'}`}
                >
                  <span className="t-h2 text-brand-gradient w-[1.1em] shrink-0 text-center leading-none">{a.id}</span>
                  <span className="flex min-w-0 flex-col">
                    <span className="t-small font-semibold leading-tight text-white">{a.ru}</span>
                    <span className="t-micro font-display uppercase leading-tight tracking-[0.12em] text-highlight/80">{a.en}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* 03 — Эффективность */}
        <Reveal delay={0.32} x={10} y={0}>
          <div ref={register('card:eff')} className="glass relative flex flex-col gap-[clamp(4px,calc(var(--u)*0.4),8px)] p-[clamp(6px,calc(var(--u)*0.6),12px)]">
            {EFFECTIVENESS.map((e) => {
              const key: NodeKey = `eff:${e.id}`;
              const st = nodeState(key);
              const Icon = e.icon;
              return (
                <button
                  key={e.id}
                  ref={register(key)}
                  type="button"
                  aria-label={`${e.label}: показать связи`}
                  {...hoverProps(key)}
                  className={`flex cursor-pointer items-center gap-[var(--gap-1)] rounded-[12px] border px-[clamp(8px,calc(var(--u)*0.7),14px)] py-[clamp(6px,calc(var(--u)*0.6),12px)] text-left transition-[transform,border-color,background-color,opacity] duration-300 hover:-translate-y-0.5 ${
                    st === 'on' ? 'border-secondary/80 bg-[rgba(37,80,250,0.2)]' : 'border-transparent bg-white/[0.03] hover:border-secondary/50'
                  } ${st === 'off' ? 'opacity-45' : 'opacity-100'}`}
                >
                  <Icon className="size-[clamp(14px,calc(var(--u)*1.15),21px)] shrink-0 text-secondary" aria-hidden strokeWidth={1.8} />
                  <span className="t-small font-medium leading-tight text-white">{e.label}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* 04 — Рост FootureX */}
        <Reveal delay={0.4} x={14} y={0}>
          <button
            ref={register('growth')}
            type="button"
            aria-label="Рост FootureX: показать связи"
            {...hoverProps('growth')}
            className={`glass relative flex w-full cursor-pointer flex-col gap-[var(--gap-1)] p-[clamp(10px,calc(var(--u)*0.9),18px)] text-left transition-[transform,border-color,box-shadow,opacity] duration-300 hover:-translate-y-0.5 hover:border-secondary/60 ${
              nodeState('growth') === 'on' ? 'border-secondary/80 shadow-[0_0_0_1px_rgba(37,147,250,0.3),0_14px_40px_-14px_rgba(37,80,250,0.8)]' : ''
            } ${nodeState('growth') === 'off' ? 'opacity-45' : ''}`}
          >
            {GROWTH_ITEMS.map((item, i) => (
              <span key={item} className="flex items-center gap-[var(--gap-1)]">
                <span className="t-micro font-display text-highlight">{String(i + 1).padStart(2, '0')}</span>
                <span className="t-small font-medium leading-tight text-white">{item}</span>
              </span>
            ))}
          </button>
        </Reveal>
      </div>

      {/* Петля обратной связи: место под линией + подпись */}
      <div className="h-[clamp(56px,calc(var(--u)*5),96px)]" aria-hidden />
      {geo ? (
        <button
          type="button"
          aria-label={`${LOOP_LABEL}: обратная связь от роста к HR-процессам`}
          {...hoverProps('loop')}
          className={`chip absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer gap-2 px-3 py-1.5 hover:border-secondary/70 hover:bg-[rgba(37,80,250,0.3)] ${
            nodeState('loop') === 'on' ? 'border-secondary/80 bg-[rgba(37,80,250,0.32)]' : 'bg-[rgba(10,16,32,0.92)]'
          }`}
          style={{
            left: geo.loopLabel.x,
            top: geo.loopLabel.y,
            opacity: drawn ? 1 : 0,
            transition: reducedMotion ? 'none' : 'opacity 0.5s ease 1.2s, border-color 0.3s ease, background-color 0.3s ease',
          }}
        >
          <ChartLine className="size-[1.15em] text-secondary" aria-hidden />
          <span className="t-small font-medium text-ice">{LOOP_LABEL}</span>
        </button>
      ) : null}
      <p className="t-micro mt-[var(--gap-1)] text-right text-mute">{AMO_NOTE}</p>
    </div>
  );
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

/** Точка данных, бегущая по связи (SVG animateMotion). Фаза зависит от id, чтобы потоки не шли в ногу. */
function FlowDot({ d, length, bright, seed }: { d: string; length: number; bright: boolean; seed: string }) {
  const dur = Math.min(4.2, Math.max(1.8, length / 120));
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
