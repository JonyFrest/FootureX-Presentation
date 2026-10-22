import { useEffect, useRef } from 'react';
import {
  STAGE_COUNT,
  connectorPoints,
  cubic,
  smooth,
  stageRatio,
  thicknessAt,
  toXY,
  type FunnelGeom,
  type Orientation,
  type Point,
} from './funnel';

interface Particle {
  /** Прогресс по области этапов: 0..1; отрицательный — путь от канала к устью. */
  s: number;
  lane: number;
  /** Последний этап, до которого доходит частица. */
  reach: number;
  /** Скорость, доля длины воронки в секунду. */
  speed: number;
  src: number;
  alpha: number;
}

interface FlowOptions {
  geom: FunnelGeom | null;
  orientation: Orientation;
  /** Точки каналов привлечения (только горизонтальная раскладка). */
  sources?: readonly Point[];
  count: number;
  enabled: boolean;
}

/**
 * Частицы, текущие сквозь воронку. Доля частиц, доходящих до этапа, совпадает с
 * толщиной сегмента (та же корневая шкала), поэтому плотность потока выглядит ровной,
 * а «отсев» происходит перед каждым шлюзом конверсии. Анимация через rAF напрямую в SVG.
 */
export function useFlowParticles({ geom, orientation, sources, count, enabled }: FlowOptions) {
  const nodes = useRef<(SVGCircleElement | null)[]>([]);
  const geomRef = useRef(geom);
  const sourcesRef = useRef(sources);
  geomRef.current = geom;
  sourcesRef.current = sources;

  useEffect(() => {
    if (!enabled) return;
    const pre = () => {
      const g = geomRef.current;
      const src = sourcesRef.current;
      if (!g || !src?.length) return 0;
      return Math.max(0.06, (g.start - src[0].x) / g.length);
    };
    const spawn = (p: Particle, initial: boolean) => {
      const u = Math.random();
      let reach = 0;
      for (let i = 1; i < STAGE_COUNT; i++) if (u < stageRatio[i]) reach = i;
      p.reach = reach;
      p.lane = (Math.random() * 2 - 1) * 0.86;
      p.speed = (1 / 9) * (0.8 + Math.random() * 0.4);
      p.src = Math.floor(Math.random() * Math.max(1, sourcesRef.current?.length ?? 1));
      p.alpha = 0.45 + Math.random() * 0.5;
      const end = (reach + 1) / STAGE_COUNT;
      p.s = initial ? -pre() + Math.random() * (end + pre()) : -pre() - Math.random() * 0.04;
    };
    const particles: Particle[] = Array.from({ length: count }, () => {
      const p: Particle = { s: 0, lane: 0, reach: 0, speed: 0, src: 0, alpha: 1 };
      spawn(p, true);
      return p;
    });

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = geomRef.current;
      const src = sourcesRef.current;
      const preLen = pre();
      if (g) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const node = nodes.current[i];
          p.s += p.speed * dt;
          const end = (p.reach + 1) / STAGE_COUNT;
          if (p.s >= end) spawn(p, false);
          let x: number;
          let y: number;
          let alpha: number;
          if (p.s < 0 && src?.length && preLen > 0) {
            const t = (p.s + preLen) / preLen;
            const pt = cubic(...connectorPoints(g, src[p.src % src.length], p.lane), Math.max(0, t));
            x = pt.x;
            y = pt.y;
            alpha = smooth(t / 0.2);
          } else {
            const s = Math.max(0, p.s);
            const main = g.start + s * g.length;
            const half = Math.max(0, thicknessAt(g, main) / 2 - 3);
            [x, y] = toXY(orientation, main, g.center + p.lane * half);
            const fadeLen = (p.reach === STAGE_COUNT - 1 ? 0.18 : 0.42) / STAGE_COUNT;
            alpha = 1 - smooth((s - (end - fadeLen)) / (fadeLen * 0.85));
            if (!src?.length) alpha *= smooth(s / 0.025);
          }
          if (node) {
            node.setAttribute('cx', x.toFixed(1));
            node.setAttribute('cy', y.toFixed(1));
            node.setAttribute('opacity', (alpha * p.alpha).toFixed(3));
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [enabled, count, orientation]);

  return nodes;
}
