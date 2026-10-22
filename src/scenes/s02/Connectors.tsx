import { useEffect, useState, type RefObject } from 'react';
import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { TASKS } from './data';
import { ANCHOR_RATIO } from './GoalCore';

interface Line {
  id: string;
  d: string;
  x: number;
  y: number;
}

/** Смещение элемента внутри контейнера по offset-цепочке (не зависит от CSS-трансформаций сцены). */
function offsetWithin(el: HTMLElement, container: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== container) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

interface ConnectorsProps {
  containerRef: RefObject<HTMLDivElement | null>;
  coreRef: RefObject<HTMLDivElement | null>;
  cardRefs: RefObject<Map<string, HTMLElement>>;
  activeId: string | null;
}

/**
 * Линии от карточек задач к точкам подключения на кольце ядра.
 * Координаты измеряются по раскладке и пересчитываются при любом изменении размеров.
 */
export function Connectors({ containerRef, coreRef, cardRefs, activeId }: ConnectorsProps) {
  const { ready, reducedMotion } = useScene();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [lines, setLines] = useState<Line[]>([]);

  // useEffect (а не useLayoutEffect): ref контейнера-родителя назначается после эффектов потомков.
  useEffect(() => {
    const container = containerRef.current;
    const core = coreRef.current;
    if (!container || !core) return;

    const measure = () => {
      const c = offsetWithin(core, container);
      const size = core.offsetWidth;
      const cx = c.x + size / 2;
      const cy = c.y + core.offsetHeight / 2;
      const r = size * ANCHOR_RATIO;
      const next: Line[] = [];
      for (const task of TASKS) {
        const card = cardRefs.current.get(task.id);
        if (!card) continue;
        const o = offsetWithin(card, container);
        const sx = task.side === 'left' ? o.x + card.offsetWidth : o.x;
        const sy = o.y + card.offsetHeight / 2;
        const rad = (task.angle * Math.PI) / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);
        const mid = sx + (ex - sx) * 0.55;
        next.push({ id: task.id, d: `M ${sx} ${sy} C ${mid} ${sy}, ${mid} ${ey}, ${ex} ${ey}`, x: sx, y: sy });
      }
      setBox({ w: container.offsetWidth, h: container.offsetHeight });
      setLines(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(core);
    cardRefs.current.forEach((el) => ro.observe(el));
    void document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [containerRef, coreRef, cardRefs]);

  if (!box.w) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={box.w}
      height={box.h}
      viewBox={`0 0 ${box.w} ${box.h}`}
      aria-hidden
    >
      <defs>
        <filter id="s02-line-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {lines.map((line, i) => {
        const on = activeId === line.id;
        return (
          <g key={line.id}>
            <motion.path
              d={line.d}
              fill="none"
              stroke="#8EB4FF"
              strokeWidth={1.2}
              strokeDasharray="1 5"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? (on ? 0 : 0.75) : 0 }}
              transition={{ duration: reducedMotion ? 0.15 : 0.6, delay: ready && !reducedMotion ? 0.1 * i : 0 }}
            />
            <motion.path
              d={line.d}
              fill="none"
              stroke="#2593FA"
              strokeWidth={2}
              strokeLinecap="round"
              filter="url(#s02-line-glow)"
              initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
              animate={on ? { pathLength: 1, opacity: 1 } : reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: reducedMotion ? 0.15 : 0.55, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.circle
              cx={line.x}
              cy={line.y}
              r={on ? 4 : 3}
              fill={on ? '#FFFFFF' : '#2593FA'}
              stroke="#0E1629"
              strokeWidth={1.5}
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? 1 : 0 }}
              transition={{ duration: 0.4, delay: ready && !reducedMotion ? 0.1 * i : 0 }}
            />
            {on && ready && !reducedMotion ? (
              <circle r="3" fill="#DCE7FF" filter="url(#s02-line-glow)">
                <animateMotion dur="1.8s" repeatCount="indefinite" path={line.d} />
              </circle>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
