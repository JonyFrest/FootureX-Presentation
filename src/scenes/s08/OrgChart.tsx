import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Reveal, useScene } from '@/components/scene';
import { CountUp, Glass } from '@/components/ui';
import type { DepartmentId } from '@/data/hr';
import { DIRECTION_FORMS, EMPLOYEE_FORMS, plural, useHoverSelect } from './shared';
import { findUnit, ORG_ROOT, ORG_TOTAL, ORG_UNITS, UNIT_ICONS, type OrgUnit } from './orgData';

/* ------------------------------------------------------------------
   Геометрия соединительных линий: измеряется по фактической раскладке
   (offset-координаты не зависят от transform перехода и параллакса).
   ------------------------------------------------------------------ */

interface UnitGeometry {
  id: DepartmentId;
  cx: number;
  left: number;
  top: number;
  bottom: number;
  members: { left: number; cy: number }[];
}

interface Geometry {
  width: number;
  height: number;
  rootCx: number;
  rootBottom: number;
  busY: number;
  units: UnitGeometry[];
}

/** Отступ вертикальной «оси» сотрудников от левого края карточки, px. */
const SPINE = 18;
const CORNER = 10;

function offsetWithin(el: HTMLElement, container: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== container) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { left: x, top: y, width: el.offsetWidth, height: el.offsetHeight };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Ортогональная ветка: корень → шина → карточка, со скруглёнными поворотами. */
function branchPath(g: Geometry, u: UnitGeometry): string {
  const { rootCx: x0, rootBottom: y0, busY } = g;
  if (Math.abs(u.cx - x0) < 1) return `M${r1(x0)} ${r1(y0)} V${r1(u.top)}`;
  const dir = u.cx > x0 ? 1 : -1;
  const r = Math.max(0, Math.min(CORNER, Math.abs(u.cx - x0) / 2, busY - y0, u.top - busY));
  return [
    `M${r1(x0)} ${r1(y0)}`,
    `V${r1(busY - r)}`,
    `Q${r1(x0)} ${r1(busY)} ${r1(x0 + dir * r)} ${r1(busY)}`,
    `H${r1(u.cx - dir * r)}`,
    `Q${r1(u.cx)} ${r1(busY)} ${r1(u.cx)} ${r1(busY + r)}`,
    `V${r1(u.top)}`,
  ].join(' ');
}

/** Ось сотрудников направления: от карточки вниз и отводы к каждой должности. */
function membersPath(u: UnitGeometry): string | null {
  if (u.members.length === 0) return null;
  const x = u.left + SPINE;
  const last = u.members[u.members.length - 1];
  const r = Math.min(CORNER * 0.8, Math.max(0, last.left - x));
  const parts = [`M${r1(x)} ${r1(u.bottom)} V${r1(last.cy - r)} Q${r1(x)} ${r1(last.cy)} ${r1(x + r)} ${r1(last.cy)} H${r1(last.left)}`];
  for (const m of u.members.slice(0, -1)) parts.push(`M${r1(x)} ${r1(m.cy)} H${r1(m.left)}`);
  return parts.join(' ');
}

function useOrgGeometry() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLButtonElement>(null);
  const cardRefs = useRef(new Map<DepartmentId, HTMLElement>());
  const memberRefs = useRef(new Map<string, HTMLElement>());
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const lastKey = useRef('');

  const measure = useCallback(() => {
    const container = containerRef.current;
    const root = rootRef.current;
    if (!container || !root) return;
    const rootBox = offsetWithin(root, container);
    const units: UnitGeometry[] = [];
    for (const unit of ORG_UNITS) {
      const card = cardRefs.current.get(unit.id);
      if (!card) return;
      const box = offsetWithin(card, container);
      const members = unit.members.flatMap((m) => {
        const el = memberRefs.current.get(`${unit.id}:${m.id}`);
        if (!el) return [];
        const mb = offsetWithin(el, container);
        return [{ left: mb.left, cy: mb.top + mb.height / 2 }];
      });
      units.push({ id: unit.id, cx: box.left + box.width / 2, left: box.left, top: box.top, bottom: box.top + box.height, members });
    }
    const rootBottom = rootBox.top + rootBox.height;
    const cardsTop = Math.min(...units.map((u) => u.top));
    const next: Geometry = {
      width: container.offsetWidth,
      height: container.offsetHeight,
      rootCx: rootBox.left + rootBox.width / 2,
      rootBottom,
      busY: rootBottom + (cardsTop - rootBottom) / 2,
      units,
    };
    const key = JSON.stringify(next);
    if (key === lastKey.current) return;
    lastKey.current = key;
    setGeometry(next);
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    if (rootRef.current) ro.observe(rootRef.current);
    cardRefs.current.forEach((el) => ro.observe(el));
    memberRefs.current.forEach((el) => ro.observe(el));
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [measure]);

  const setCard = useCallback((id: DepartmentId) => (el: HTMLElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);
  const setMember = useCallback((key: string) => (el: HTMLElement | null) => {
    if (el) memberRefs.current.set(key, el);
    else memberRefs.current.delete(key);
  }, []);

  return { containerRef, rootRef, setCard, setMember, geometry };
}

/* ------------------------------------------------------------------
   Соединительные линии (SVG под карточками).
   ------------------------------------------------------------------ */

function Connectors({ geometry, selected }: { geometry: Geometry; selected: DepartmentId }) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  const selectedUnit = geometry.units.find((u) => u.id === selected) ?? null;
  const draw = (delay: number) =>
    reducedMotion
      ? { initial: { pathLength: 1 }, animate: { pathLength: 1 } }
      : {
          initial: { pathLength: 0 },
          animate: { pathLength: show ? 1 : 0 },
          transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <svg
      data-org-connectors
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={geometry.width}
      height={geometry.height}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="org-hi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8EB4FF" />
          <stop offset="100%" stopColor="#2593FA" />
        </linearGradient>
        <filter id="org-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Базовые линии всех ветвей. */}
      <g fill="none" stroke="rgba(142,180,255,0.32)" strokeWidth={1.5} strokeLinecap="round">
        {geometry.units.map((u, i) => (
          <motion.path key={`b-${u.id}`} d={branchPath(geometry, u)} {...draw(0.05 * i)} />
        ))}
        {geometry.units.map((u, i) => {
          const d = membersPath(u);
          return d ? <motion.path key={`m-${u.id}`} d={d} {...draw(0.45 + 0.05 * i)} /> : null;
        })}
      </g>

      {/* Подсветка выбранной ветви. */}
      {selectedUnit && show ? (
        <g key={selectedUnit.id} fill="none" strokeLinecap="round">
          {[branchPath(geometry, selectedUnit), membersPath(selectedUnit)].map((d, i) =>
            d ? (
              <g key={i}>
                <path d={d} stroke="#2593FA" strokeWidth={6} opacity={0.35} filter="url(#org-glow)" />
                <motion.path
                  d={d}
                  stroke="url(#org-hi)"
                  strokeWidth={2.25}
                  initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.45, delay: i * 0.25, ease: 'easeOut' }}
                />
              </g>
            ) : null,
          )}
          {!reducedMotion ? (
            <circle r={3.5} fill="#DCE7FF">
              <animateMotion dur="2.8s" repeatCount="indefinite" path={branchPath(geometry, selectedUnit)} />
            </circle>
          ) : null}
        </g>
      ) : null}
      {selected === 'leadership' && show ? (
        <circle cx={geometry.rootCx} cy={geometry.rootBottom} r={3.5} fill="#8EB4FF" />
      ) : null}
    </svg>
  );
}

/* ------------------------------------------------------------------
   Карточки.
   ------------------------------------------------------------------ */

function UnitIcon({ id, large = false }: { id: DepartmentId; large?: boolean }) {
  const Icon = UNIT_ICONS[id];
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[10px] border border-highlight/25 bg-primary/15 text-highlight ${
        large ? 'size-[clamp(36px,calc(var(--u)*2.8),54px)]' : 'size-[clamp(26px,calc(var(--u)*1.9),38px)]'
      }`}
      aria-hidden
    >
      <Icon className="size-[55%]" strokeWidth={1.75} />
    </span>
  );
}

/** Карточка направления: значок, латинская подпись и численность — в одной строке; ниже название и руководитель. */
function UnitHead({ unit }: { unit: OrgUnit }) {
  return (
    <>
      <div className="flex items-center gap-[var(--gap-1)]">
        <UnitIcon id={unit.id} />
        <span className="min-w-0 flex-1 truncate font-display text-[length:var(--fs-micro)] tracking-[0.16em] text-highlight uppercase">
          {unit.short}
        </span>
        <span className="shrink-0 whitespace-nowrap" aria-hidden>
          <span className="font-display text-[length:var(--fs-h3)] leading-none text-white t-num">{unit.headcount}</span>
          <span className="t-micro ml-1 text-mute">чел.</span>
        </span>
      </div>
      <p className="t-small mt-[var(--gap-1)] font-semibold leading-snug text-white">{unit.name}</p>
      <p className="t-micro mt-0.5 text-soft">{unit.head}</p>
    </>
  );
}

/** Корень: CEO. */
function RootHead() {
  return (
    <div className="flex items-center gap-[var(--gap-2)]">
      <UnitIcon id={ORG_ROOT.id} large />
      <div className="min-w-0">
        <p className="font-display text-[length:var(--fs-micro)] tracking-[0.16em] text-highlight uppercase">Leadership</p>
        <p className="t-h3 mt-0.5 whitespace-nowrap text-white">{ORG_ROOT.head}</p>
        <p className="t-micro text-soft">
          {ORG_ROOT.name} · {ORG_ROOT.headcount} {plural(ORG_ROOT.headcount, EMPLOYEE_FORMS)}
        </p>
      </div>
    </div>
  );
}

function DetailPanel({ selected }: { selected: DepartmentId }) {
  const units = [ORG_ROOT, ...ORG_UNITS];
  return (
    <Glass strong className="relative overflow-hidden p-[var(--gap-3)]" aria-live="polite">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(180deg,#2593FA,#2550FA)]"
      />
      {/* Все варианты в одной ячейке сетки: высота панели постоянна, раскладка не прыгает. */}
      <div className="grid">
        {units.map((unit) => {
          const on = unit.id === selected;
          return (
            <div
              key={unit.id}
              className="transition-[opacity,transform] duration-300 ease-out [grid-area:1/1]"
              style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', visibility: on ? 'visible' : 'hidden' }}
              aria-hidden={!on}
            >
              <p className="t-eyebrow">Зоны ответственности</p>
              <p className="t-h3 mt-[var(--gap-1)] text-white">{unit.name}</p>
              <p className="t-micro text-soft">
                Руководитель: {unit.head} · {unit.headcount} {plural(unit.headcount, EMPLOYEE_FORMS)}
              </p>
              <ul className="mt-[var(--gap-2)] space-y-[calc(var(--gap-1)*0.6)]">
                {unit.responsibilities.map((r) => (
                  <li key={r} className="t-small flex items-start gap-[var(--gap-1)] text-ice">
                    <span className="mt-[0.6em] size-1.5 shrink-0 rotate-45 bg-secondary" aria-hidden />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Glass>
  );
}

/** Счётчик изолирован от перерисовок оргструктуры (наведение не должно прерывать счёт). */
const TotalCount = memo(function TotalCount() {
  return <CountUp to={ORG_TOTAL} className="t-stat text-gradient" />;
});

/* ------------------------------------------------------------------
   Оргструктура для проектора / ноутбука.
   ------------------------------------------------------------------ */

export function OrgChart() {
  const { containerRef, rootRef, setCard, setMember, geometry } = useOrgGeometry();
  const { ready, reducedMotion } = useScene();
  const showMembers = ready || reducedMotion;
  const { active, bind } = useHoverSelect<DepartmentId>('leadership');
  const selected = active ?? 'leadership';
  const selectedUnit = findUnit(selected);
  const cols = { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' } as const;

  return (
    <div ref={containerRef} className="relative">
      {geometry ? <Connectors geometry={geometry} selected={selected} /> : null}

      {/* Ряд 1: итог · CEO · зоны ответственности (боковые колонки равны — CEO точно по центру). */}
      <div
        className="relative grid items-end gap-x-[var(--gap-3)]"
        style={{ gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)' }}
      >
        <Reveal delay={0.25} className="pb-1">
          <div className="flex flex-wrap items-baseline gap-x-[var(--gap-2)]">
            <TotalCount />
            <span className="t-h3 text-white">
              {plural(ORG_TOTAL, EMPLOYEE_FORMS)} · этап 1 <span className="text-highlight">(план)</span>
            </span>
          </div>
          <p className="t-small mt-[var(--gap-1)] text-soft">
            CEO и {ORG_UNITS.length} {plural(ORG_UNITS.length, DIRECTION_FORMS)}
          </p>
        </Reveal>

        <Reveal delay={0.15} y={12}>
          <button
            ref={rootRef}
            type="button"
            {...bind('leadership')}
            aria-pressed={selected === 'leadership'}
            aria-label={`${ORG_ROOT.head}: показать зоны ответственности`}
            data-active={selected === 'leadership' ? 'true' : undefined}
            className="glass-strong glass-hover block w-full cursor-pointer px-[var(--gap-3)] py-[var(--gap-2)] text-left"
            style={{
              background:
                'linear-gradient(160deg, rgba(37,80,250,0.32), rgba(10,16,32,0.82) 70%)',
            }}
          >
            <RootHead />
          </button>
        </Reveal>

        <Reveal delay={0.35}>
          <DetailPanel selected={selectedUnit.id} />
        </Reveal>
      </div>

      {/* Зазор под шину соединений. */}
      <div aria-hidden style={{ height: 'clamp(30px, calc(var(--u) * 3.4), 64px)' }} />

      {/* Ряд 2: 5 направлений (одна высота карточек) и ряд 3: сотрудники. */}
      <div className="relative grid gap-x-[var(--gap-3)] gap-y-[var(--gap-2)]" style={cols}>
        {ORG_UNITS.map((unit, i) => {
          const on = selected === unit.id;
          return (
            <Reveal key={unit.id} delay={0.3 + i * 0.06} y={14} className="flex">
              <button
                ref={setCard(unit.id)}
                type="button"
                {...bind(unit.id)}
                aria-pressed={on}
                aria-label={`${unit.name}: ${unit.head}, ${unit.headcount} ${plural(unit.headcount, EMPLOYEE_FORMS)}. Показать зоны ответственности`}
                data-active={on ? 'true' : undefined}
                className={`glass glass-hover flex w-full cursor-pointer flex-col justify-start p-[var(--gap-2)] text-left ${
                  selected !== 'leadership' && !on ? 'opacity-75' : ''
                }`}
                style={{ transitionProperty: 'transform, border-color, box-shadow, opacity' }}
              >
                <UnitHead unit={unit} />
              </button>
            </Reveal>
          );
        })}
        {ORG_UNITS.map((unit) => {
          const on = selected === unit.id;
          return (
            <ul
              key={`${unit.id}-members`}
              data-interactive
              {...bind(unit.id)}
              onFocus={undefined}
              onBlur={undefined}
              className="flex flex-col items-start gap-[var(--gap-1)]"
              style={{ paddingLeft: SPINE + 14 }}
              aria-label={`Сотрудники направления «${unit.name}»`}
            >
              {unit.members.map((m, j) => (
                <motion.li
                  key={m.id}
                  ref={setMember(`${unit.id}:${m.id}`)}
                  initial={reducedMotion ? false : { opacity: 0, x: -8 }}
                  animate={showMembers ? { opacity: 1, x: 0 } : undefined}
                  transition={{ duration: 0.5, delay: 0.55 + j * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  className={`t-micro inline-flex max-w-full items-center gap-[var(--gap-1)] rounded-[10px] border px-[var(--gap-1)] py-[3px] transition-colors duration-300 ${
                    on
                      ? 'border-secondary/55 bg-primary/20 text-white'
                      : 'border-line bg-[rgba(10,16,32,0.72)] text-soft'
                  }`}
                >
                  <span className="min-w-0 text-pretty">{m.title}</span>
                  {m.count > 1 ? (
                    <span className="shrink-0 rounded-full bg-secondary/25 px-1.5 font-semibold text-ice t-num">
                      ×{m.count}
                    </span>
                  ) : null}
                </motion.li>
              ))}
            </ul>
          );
        })}
      </div>
    </div>
  );
}
