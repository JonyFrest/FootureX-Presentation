import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { Glass } from '@/components/ui';
import { STRATEGY_LABEL, type StakeholderStrategy } from '@/data/project';
import { EASE, fmtNum, useHoverSelect } from '../charter/kit';
import {
  axisPos,
  COMM_RHYTHM,
  QUADRANT_ORDER,
  QUADRANT_POS,
  SCALE_MAX,
  SCALE_MIN,
  STAKEHOLDER_VIEWS,
  STAKEHOLDERS_BY_QUADRANT,
  STRATEGY_COLOR,
  THRESHOLD,
  type StakeholderView,
} from './teamData';

type Bind = ReturnType<typeof useHoverSelect<string>>['bind'];

/** Значение ровно на пороге относится к «низкой» стороне — смещаем точку на несколько px внутрь своего квадранта. */
const NUDGE = 9;
const DOT = 14;
const LABEL_GAP = DOT / 2 + 6;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlap = (a: Box, b: Box, pad = 4) => {
  const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + pad;
  const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + pad;
  return ix > 0 && iy > 0 ? ix * iy : 0;
};

function dotOffset(s: StakeholderView) {
  return {
    nx: s.interest === THRESHOLD ? -NUDGE : 0,
    ny: s.power === THRESHOLD ? NUDGE : 0,
  };
}

/** Подписи ставятся там, где не перекрывают другие подписи, точки и названия квадрантов. */
function useLabelPlacement() {
  const plotRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef(new Map<string, HTMLElement>());
  const quadRefs = useRef(new Map<string, HTMLElement>());
  const [placement, setPlacement] = useState<Record<string, { dx: number; dy: number }>>({});
  const lastKey = useRef('');

  const measure = useCallback(() => {
    const plot = plotRef.current;
    if (!plot) return;
    const W = plot.clientWidth;
    const H = plot.clientHeight;
    if (W === 0 || H === 0) return;
    const centers = new Map(
      STAKEHOLDER_VIEWS.map((s) => {
        const { nx, ny } = dotOffset(s);
        return [s.id, { cx: axisPos(s.interest) * W + nx, cy: (1 - axisPos(s.power)) * H + ny }];
      }),
    );
    const obstacles: (Box & { id?: string })[] = [];
    quadRefs.current.forEach((el) => obstacles.push({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }));
    centers.forEach((c, id) => obstacles.push({ id, x: c.cx - DOT / 2, y: c.cy - DOT / 2, w: DOT, h: DOT }));

    const result: Record<string, { dx: number; dy: number }> = {};
    // Справа налево: правые подписи уходят влево и первыми занимают место.
    const order = [...STAKEHOLDER_VIEWS].sort((a, b) => b.interest - a.interest || b.power - a.power);
    for (const s of order) {
      const el = labelRefs.current.get(s.id);
      const c = centers.get(s.id);
      if (!el || !c) continue;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const preferRight = c.cx < W * 0.6;
      const sides: ('right' | 'left')[] = preferRight ? ['right', 'left'] : ['left', 'right'];
      const shifts = [0, -h / 2, h / 2, -h, h];
      let best: Box | null = null;
      let bestScore = Infinity;
      sides.forEach((side, si) => {
        for (const dy of shifts) {
          const box: Box = { x: side === 'right' ? c.cx + LABEL_GAP : c.cx - LABEL_GAP - w, y: c.cy - h / 2 + dy, w, h };
          const outside = box.x < 0 || box.x + box.w > W || box.y < 0 || box.y + box.h > H;
          let hit = 0;
          for (const o of obstacles) if (o.id !== s.id) hit += overlap(box, o);
          const score = (outside ? 1e9 : 0) + hit * 1000 + si * 40 + Math.abs(dy);
          if (score < bestScore) {
            bestScore = score;
            best = box;
          }
        }
      });
      if (!best) continue;
      const b: Box = best;
      obstacles.push(b);
      result[s.id] = { dx: Math.round(b.x - c.cx), dy: Math.round(b.y - c.cy) };
    }
    const key = JSON.stringify(result);
    if (key === lastKey.current) return;
    lastKey.current = key;
    setPlacement(result);
  }, []);

  useLayoutEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(plot);
    labelRefs.current.forEach((el) => ro.observe(el));
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [measure]);

  const setLabel = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) labelRefs.current.set(id, el);
      else labelRefs.current.delete(id);
    },
    [],
  );
  const setQuad = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) quadRefs.current.set(id, el);
      else quadRefs.current.delete(id);
    },
    [],
  );

  return { plotRef, setLabel, setQuad, placement };
}

const TICKS = Array.from({ length: SCALE_MAX - SCALE_MIN + 1 }, (_, i) => SCALE_MIN + i);

/* ------------------------------------------------------------------
   Сетка «влияние / заинтересованность».
   ------------------------------------------------------------------ */

export function StakeholderMatrix({ active, bind, visible }: { active: string | null; bind: Bind; visible: boolean }) {
  const { ready, reducedMotion } = useScene();
  const show = (ready || reducedMotion) && visible;
  const { plotRef, setLabel, setQuad, placement } = useLabelPlacement();
  const current = STAKEHOLDER_VIEWS.find((s) => s.id === active) ?? null;
  const t = axisPos(THRESHOLD) * 100;

  return (
    <div className="grid h-full min-h-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-x-[var(--gap-1)] gap-y-1">
      {/* Ось Y: влияние. */}
      <div className="relative flex items-stretch gap-1">
        <span className="t-micro self-center whitespace-nowrap text-soft [writing-mode:vertical-rl] rotate-180">
          Влияние →
        </span>
        <div className="t-micro relative w-[1.1em]">
          {TICKS.map((v) => (
            <span
              key={v}
              className={`t-micro absolute right-0 -translate-y-1/2 t-num ${v === THRESHOLD ? 'text-highlight' : 'text-mute'}`}
              style={{ top: `${(1 - axisPos(v)) * 100}%` }}
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Поле графика. */}
      <div
        ref={plotRef}
        data-interactive
        className="relative min-h-0 overflow-hidden rounded-[14px] border border-white/10 bg-[rgba(7,10,18,0.35)]"
      >
        {QUADRANT_ORDER.map((q) => {
          const pos = QUADRANT_POS[q];
          const on = current?.strategy === q;
          return (
            <div
              key={q}
              aria-hidden
              className="absolute transition-colors duration-500"
              style={{
                left: pos.right ? `${t}%` : 0,
                right: pos.right ? 0 : `${100 - t}%`,
                top: pos.top ? 0 : `${100 - t}%`,
                bottom: pos.top ? `${t}%` : 0,
                background: on
                  ? 'rgba(37,80,250,0.16)'
                  : q === 'manage'
                    ? 'rgba(37,80,250,0.07)'
                    : 'transparent',
              }}
            />
          );
        })}
        {/* Пороговые линии. */}
        <span aria-hidden className="absolute top-0 bottom-0 border-l border-dashed border-highlight/35" style={{ left: `${t}%` }} />
        <span aria-hidden className="absolute right-0 left-0 border-t border-dashed border-highlight/35" style={{ top: `${100 - t}%` }} />

        {/* Названия квадрантов: верхние — у верхнего края, нижние — у нижнего. */}
        {QUADRANT_ORDER.map((q) => {
          const pos = QUADRANT_POS[q];
          const on = current?.strategy === q;
          return (
            <span
              key={q}
              ref={setQuad(q)}
              className={`t-small absolute flex items-center gap-1.5 font-semibold whitespace-nowrap transition-colors duration-300 ${
                on ? 'text-white' : 'text-highlight/90'
              }`}
              style={{
                left: pos.right ? `calc(${t}% + 10px)` : 10,
                ...(pos.top ? { top: 8 } : { bottom: 8 }),
              }}
            >
              <span aria-hidden className="size-2 rounded-full" style={{ background: STRATEGY_COLOR[q] }} />
              {STRATEGY_LABEL[q]}
            </span>
          );
        })}

        {/* Стейкхолдеры. */}
        {STAKEHOLDER_VIEWS.map((s, i) => {
          const on = current?.id === s.id;
          const { nx, ny } = dotOffset(s);
          const p = placement[s.id];
          return (
            <motion.button
              key={s.id}
              type="button"
              {...bind(s.id)}
              aria-pressed={on}
              aria-label={`${s.title}: влияние ${fmtNum(s.power, 1)}, заинтересованность ${fmtNum(s.interest, 1)} из ${SCALE_MAX}. ${STRATEGY_LABEL[s.strategy]}`}
              className={`group absolute size-0 cursor-pointer outline-none ${on ? 'z-20' : 'z-10'}`}
              style={{
                left: `calc(${axisPos(s.interest) * 100}% + ${nx}px)`,
                top: `calc(${(1 - axisPos(s.power)) * 100}% + ${ny}px)`,
              }}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.4 }}
              animate={show ? { opacity: 1, scale: 1 } : undefined}
              transition={{ duration: 0.55, delay: 0.1 + i * 0.07, ease: EASE }}
            >
              {on && !reducedMotion ? (
                <span
                  aria-hidden
                  className="absolute -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full opacity-40 [animation-duration:2.2s]"
                  style={{ width: DOT + 10, height: DOT + 10, background: STRATEGY_COLOR[s.strategy] }}
                />
              ) : null}
              <span
                aria-hidden
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-[box-shadow,border-color] duration-300"
                style={{
                  width: DOT,
                  height: DOT,
                  background: STRATEGY_COLOR[s.strategy],
                  borderColor: on ? '#FFFFFF' : 'rgba(7,10,18,0.9)',
                  boxShadow: on ? `0 0 0 4px rgba(37,147,250,0.3), 0 0 18px 2px ${STRATEGY_COLOR[s.strategy]}` : 'none',
                }}
              />
              <span
                ref={setLabel(s.id)}
                className={`t-small absolute w-max max-w-[12.5em] rounded-[8px] border px-2 py-[2px] text-left leading-snug transition-colors duration-300 group-focus-visible:ring-2 group-focus-visible:ring-secondary ${
                  on
                    ? 'border-secondary/70 bg-[rgba(25,48,140,0.92)] text-white'
                    : 'border-white/10 bg-[rgba(10,16,32,0.82)] text-ice group-hover:border-secondary/50'
                }`}
                style={
                  p
                    ? { left: p.dx, top: p.dy }
                    : { left: LABEL_GAP, top: 0, transform: 'translateY(-50%)' }
                }
              >
                {s.title}
              </span>
            </motion.button>
          );
        })}
      </div>

      <span aria-hidden />
      {/* Ось X: заинтересованность. */}
      <div>
        <div className="relative h-[calc(var(--fs-micro)*1.45)]">
          {TICKS.map((v) => (
            <span
              key={v}
              className={`t-micro absolute top-0 -translate-x-1/2 t-num ${v === THRESHOLD ? 'text-highlight' : 'text-mute'}`}
              style={{ left: `${axisPos(v) * 100}%` }}
            >
              {v}
            </span>
          ))}
        </div>
        <p className="t-micro text-right text-soft">Заинтересованность →</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Карточка выбранного стейкхолдера (все варианты в одной ячейке — высота постоянна).
   ------------------------------------------------------------------ */

export function StakeholderDetail({ active }: { active: string | null }) {
  return (
    <div className="grid" aria-live="polite">
      {STAKEHOLDER_VIEWS.map((s) => {
        const on = s.id === active;
        return (
          <div
            key={s.id}
            aria-hidden={!on}
            className="min-w-0 transition-[opacity,transform] duration-300 ease-out [grid-area:1/1]"
            style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', visibility: on ? 'visible' : 'hidden' }}
          >
            <p className="t-small flex items-center gap-2 font-semibold text-highlight">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: STRATEGY_COLOR[s.strategy] }} />
              {STRATEGY_LABEL[s.strategy]}
            </p>
            <p className="t-h3 mt-1 text-white">{s.title}</p>
            <p className="t-small mt-1 leading-snug text-ice">{s.need}</p>
            <p className="t-small mt-[var(--gap-1)] text-mute t-num">
              Влияние {fmtNum(s.power, s.power % 1 ? 1 : 0)} · заинтересованность {fmtNum(s.interest, s.interest % 1 ? 1 : 0)} из{' '}
              {SCALE_MAX}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------
   План коммуникаций: ритм событий.
   ------------------------------------------------------------------ */

export function CommunicationPlan({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <p className="t-small flex items-center gap-2 font-semibold text-white">
        План коммуникаций <span className="chip chip-plan">план</span>
      </p>
      <ul className={`mt-[var(--gap-2)] grid ${compact ? 'gap-3' : 'gap-[calc(var(--gap-1)*1.2)]'}`}>
        {COMM_RHYTHM.map((g) => (
          <li
            key={g.cadence}
            className={`grid gap-x-[var(--gap-2)] gap-y-1 border-t border-white/[0.07] pt-[calc(var(--gap-1)*1.1)] first:border-t-0 first:pt-0 ${
              compact ? '' : 'grid-cols-[minmax(0,9.5em)_minmax(0,1fr)]'
            }`}
          >
            <span className="t-small leading-snug font-semibold text-highlight">{g.cadence}</span>
            <ul className="grid gap-0.5">
              {g.events.map((e) => (
                <li key={e.event} className="t-small leading-snug text-white">
                  {e.event}
                  <span className="text-mute"> · {e.audience}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------
   Телефон: стейкхолдеры списком по квадрантам.
   ------------------------------------------------------------------ */

export function StakeholderGroups() {
  return (
    <div className="grid gap-[var(--gap-2)] min-[640px]:grid-cols-2">
      {STAKEHOLDERS_BY_QUADRANT.map((g) => (
        <Glass key={g.strategy} className="p-[var(--gap-3)]">
          <p className="t-small flex items-center gap-2 font-semibold text-white">
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: STRATEGY_COLOR[g.strategy] }} />
            {STRATEGY_LABEL[g.strategy]}
          </p>
          <p className="t-micro mt-0.5 text-mute">{quadrantHint(g.strategy)}</p>
          <ul className="mt-[var(--gap-1)] grid gap-[var(--gap-1)]">
            {g.items.map((s) => (
              <li key={s.id} className="border-t border-white/[0.07] pt-[var(--gap-1)] first:border-t-0 first:pt-0">
                <p className="t-small font-semibold leading-snug text-ice">{s.title}</p>
                <p className="t-small leading-snug text-soft">{s.need}</p>
                <p className="t-micro text-mute t-num">
                  Влияние {fmtNum(s.power, s.power % 1 ? 1 : 0)} · заинтересованность {fmtNum(s.interest, s.interest % 1 ? 1 : 0)}
                </p>
              </li>
            ))}
          </ul>
        </Glass>
      ))}
    </div>
  );
}

function quadrantHint(q: StakeholderStrategy): string {
  const pos = QUADRANT_POS[q];
  return `${pos.top ? 'высокое' : 'низкое'} влияние, ${pos.right ? 'высокая' : 'низкая'} заинтересованность`;
}
