import { FUNNEL_STAGES, funnelConversion } from '@/data/hr';

/**
 * Геометрия воронки найма. Толщина сегмента — корневая шкала от числа кандидатов
 * (sqrt(value / value₀)), чтобы последние этапы оставались читаемыми; подписи
 * показывают истинные числа из hr.ts.
 */
export const STAGE_COUNT = FUNNEL_STAGES.length;
const FIRST_VALUE = FUNNEL_STAGES[0].value;
const MIN_RATIO = 0.11;

export const stageRatio: readonly number[] = FUNNEL_STAGES.map((s) => Math.sqrt(s.value / FIRST_VALUE));

/** Конверсия этапа, округлённая для подписи: «25%», «30%», «31%», «81%». */
export const stageConversion: readonly (number | null)[] = FUNNEL_STAGES.map((_, i) => funnelConversion(i));

/** Дни этапа внутри срока закрытия вакансии: «дни 6–12». */
export const stageDayRange: readonly { from: number; to: number }[] = (() => {
  let acc = 0;
  return FUNNEL_STAGES.map((s) => {
    const from = acc + 1;
    acc += s.days;
    return { from, to: acc };
  });
})();

export interface FunnelGeom {
  /** Начало области этапов по главной оси, px. */
  start: number;
  /** Длина области этапов по главной оси, px. */
  length: number;
  /** Максимальная толщина (поперечная ось), px. */
  cross: number;
  /** Центр по поперечной оси, px. */
  center: number;
}

export type Orientation = 'h' | 'v';

const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** Первый этап занимает 88% толщины — устье воронки слегка расширяется к каналам. */
const FIRST_SHARE = 0.88;

function stageThickness(g: FunnelGeom, i: number): number {
  return g.cross * Math.max(stageRatio[i], MIN_RATIO) * FIRST_SHARE;
}

/** Толщина воронки в точке m главной оси: короткое плато в центре этапа, плавный переход между этапами. */
export function thicknessAt(g: FunnelGeom, m: number): number {
  const cw = g.length / STAGE_COUNT;
  const plateau = cw * 0.16;
  const rel = Math.min(Math.max(m - g.start, 0), g.length);
  const i = Math.min(STAGE_COUNT - 1, Math.floor(rel / cw));
  const c = (i + 0.5) * cw;
  if (rel > c + plateau && i < STAGE_COUNT - 1) {
    const t = (rel - (c + plateau)) / (cw - 2 * plateau);
    return stageThickness(g, i) + (stageThickness(g, i + 1) - stageThickness(g, i)) * smooth(t);
  }
  if (rel < c - plateau && i > 0) {
    const t = (rel - (c - cw + plateau)) / (cw - 2 * plateau);
    return stageThickness(g, i - 1) + (stageThickness(g, i) - stageThickness(g, i - 1)) * smooth(t);
  }
  if (rel < c - plateau && i === 0) {
    const t = (c - plateau - rel) / (c - plateau);
    return stageThickness(g, 0) + (g.cross - stageThickness(g, 0)) * smooth(t);
  }
  return stageThickness(g, i);
}

export function toXY(o: Orientation, main: number, cross: number): [number, number] {
  return o === 'h' ? [main, cross] : [cross, main];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Контур сегмента этапа i (с зазором 2px между сегментами). */
export function segmentPath(g: FunnelGeom, o: Orientation, i: number, gap = 1): string {
  const cw = g.length / STAGE_COUNT;
  const a = g.start + i * cw + (i === 0 ? 0 : gap);
  const b = g.start + (i + 1) * cw - (i === STAGE_COUNT - 1 ? 0 : gap);
  const steps = Math.max(8, Math.ceil((b - a) / 5));
  const top: string[] = [];
  const bottom: string[] = [];
  for (let k = 0; k <= steps; k++) {
    const m = a + ((b - a) * k) / steps;
    const h = thicknessAt(g, m) / 2;
    const [x1, y1] = toXY(o, m, g.center - h);
    const [x2, y2] = toXY(o, m, g.center + h);
    top.push(`${r1(x1)} ${r1(y1)}`);
    bottom.unshift(`${r1(x2)} ${r1(y2)}`);
  }
  return `M ${top.join(' L ')} L ${bottom.join(' L ')} Z`;
}

/** Верхняя или нижняя кромка воронки целиком (для светящейся обводки). */
export function edgePath(g: FunnelGeom, o: Orientation, side: -1 | 1): string {
  const steps = Math.max(24, Math.ceil(g.length / 6));
  const pts: string[] = [];
  for (let k = 0; k <= steps; k++) {
    const m = g.start + (g.length * k) / steps;
    const [x, y] = toXY(o, m, g.center + (side * thicknessAt(g, m)) / 2);
    pts.push(`${r1(x)} ${r1(y)}`);
  }
  return `M ${pts.join(' L ')}`;
}

export interface Point {
  x: number;
  y: number;
}

export function cubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

/** Кривая от канала привлечения к устью воронки (горизонтальная раскладка). */
export function connectorPoints(g: FunnelGeom, src: Point, lane: number): [Point, Point, Point, Point] {
  const endY = g.center + lane * (thicknessAt(g, g.start) / 2) * 0.82;
  const dx = g.start - src.x;
  return [src, { x: src.x + dx * 0.55, y: src.y }, { x: g.start - dx * 0.45, y: endY }, { x: g.start, y: endY }];
}

export { smooth };
