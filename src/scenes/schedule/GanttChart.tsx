import type { CSSProperties } from 'react';
import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { MILESTONES } from '@/data/project';
import {
  GROUPS,
  MONTHS,
  SPRINTS,
  msKey,
  ROW_BY_KEY,
  MS_BY_KEY,
  sprintsText,
  type GanttRow,
} from './gantt';
import { CriticalToggle, Diamond, LegendSwatch, barStyle, type BarKind } from './parts';
import type { HoverBind } from './shared';

interface GanttChartProps {
  activeKey: string | null;
  pinnedKey: string | null;
  bind: HoverBind<string>;
  criticalMode: boolean;
  onToggleCritical: () => void;
}

const pct = (sprintOffset: number) => (sprintOffset / SPRINTS) * 100;

const VARS = {
  '--hdr': 'clamp(19px, calc(var(--u) * 1.5), 30px)',
  '--row': 'clamp(22px, calc(var(--u) * 1.66), 34px)',
  '--bar': 'calc(var(--row) * 0.56)',
  '--ggap': 'clamp(5px, calc(var(--u) * 0.5), 10px)',
  '--ms-h': 'clamp(56px, calc(var(--u) * 3.6), 72px)',
  '--dia': 'clamp(11px, calc(var(--u) * 0.85), 17px)',
} as CSSProperties;

const COLUMNS = 'clamp(110px, calc(var(--u) * 7.6), 152px) clamp(304px, calc(var(--u) * 21), 420px) minmax(0, 1fr)';

/** Раскладка строк сетки: шапка (месяцы, спринты), группы результатов с отступами, ось вех. */
function buildLayout() {
  const template: string[] = ['var(--hdr)', 'var(--hdr)', 'calc(var(--ggap) * 0.8)'];
  const groups = GROUPS.map((g, gi) => {
    if (gi > 0) template.push('var(--ggap)');
    const start = template.length + 1;
    g.rows.forEach(() => template.push('var(--row)'));
    return { group: g, start, rows: g.rows.map((r, i) => ({ row: r, line: start + i })) };
  });
  template.push('calc(var(--ggap) * 0.8)', 'var(--ms-h)');
  return { template: template.join(' '), groups, msLine: template.length, lastBodyLine: template.length - 1 };
}

const LAYOUT = buildLayout();

function kindOf(row: GanttRow): BarKind {
  return row.optional ? 'optional' : row.critical ? 'critical' : 'regular';
}

/** Диаграмма Ганта для широких экранов: 12 спринтов × 6 месяцев, пакеты WBS по результатам, вехи на оси. */
export function GanttChart({ activeKey, pinnedKey, bind, criticalMode, onToggleCritical }: GanttChartProps) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  const activeRow = activeKey ? ROW_BY_KEY.get(activeKey) : undefined;
  const activeMs = activeKey ? MS_BY_KEY.get(activeKey) : undefined;
  const litSprints = new Set<number>(activeRow ? activeRow.sprints : activeMs ? [activeMs.sprint] : []);

  let rowIndex = 0;

  return (
    <div
      className="relative grid gap-x-[var(--gap-2)]"
      style={{ ...VARS, gridTemplateColumns: COLUMNS, gridTemplateRows: LAYOUT.template }}
      data-gantt
      data-interactive
    >
      {/* Фон шкалы: полосы месяцев и линии спринтов. */}
      <div aria-hidden className="pointer-events-none relative" style={{ gridColumn: 3, gridRow: `1 / ${LAYOUT.lastBodyLine}` }}>
        {Array.from({ length: MONTHS }, (_, m) => (
          <span
            key={m}
            className="absolute inset-y-0 rounded-[6px]"
            style={{
              left: `${(m / MONTHS) * 100}%`,
              width: `${100 / MONTHS}%`,
              background: m % 2 === 0 ? 'rgba(142,180,255,0.045)' : 'transparent',
            }}
          />
        ))}
        {Array.from({ length: SPRINTS - 1 }, (_, i) => {
          const s = i + 1;
          const monthEdge = s % (SPRINTS / MONTHS) === 0;
          return (
            <span
              key={s}
              className="absolute top-[calc(var(--hdr)*0.15)] bottom-0 w-px"
              style={{
                left: `${pct(s)}%`,
                background: monthEdge ? 'rgba(142,180,255,0.16)' : 'rgba(142,180,255,0.07)',
              }}
            />
          );
        })}
      </div>

      {/* Вертикальные направляющие вех. */}
      <div aria-hidden className="pointer-events-none relative z-[1]" style={{ gridColumn: 3, gridRow: `3 / ${LAYOUT.msLine}` }}>
        {MILESTONES.map((m) => {
          const on = activeMs?.id === m.id;
          return (
            <span
              key={m.id}
              className="absolute inset-y-0 w-0 transition-[border-color,box-shadow] duration-300"
              style={{
                left: `${pct(m.sprint)}%`,
                borderLeft: on ? '1.5px solid #8EB4FF' : '1px dashed rgba(142,180,255,0.42)',
                boxShadow: on ? '0 0 12px rgba(142,180,255,0.8)' : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Угол: переключатель критического пути. */}
      <div className="flex items-center" style={{ gridColumn: '1 / 3', gridRow: '1 / 3' }}>
        <CriticalToggle on={criticalMode} onToggle={onToggleCritical} />
      </div>

      {/* Шапка: месяцы. */}
      <div className="grid items-center" style={{ gridColumn: 3, gridRow: 1, gridTemplateColumns: `repeat(${MONTHS}, minmax(0, 1fr))` }}>
        {Array.from({ length: MONTHS }, (_, m) => (
          <span key={m} className="t-micro text-center font-semibold tracking-[0.06em] text-soft uppercase">
            Месяц {m + 1}
          </span>
        ))}
      </div>

      {/* Шапка: спринты. */}
      <div className="grid items-center" style={{ gridColumn: 3, gridRow: 2, gridTemplateColumns: `repeat(${SPRINTS}, minmax(0, 1fr))` }}>
        {Array.from({ length: SPRINTS }, (_, i) => {
          const lit = litSprints.has(i + 1);
          return (
            <span
              key={i}
              className={`t-micro text-center font-display leading-none transition-colors duration-300 ${lit ? 'text-white' : 'text-mute'}`}
              style={{ textShadow: lit ? '0 0 10px rgba(37,147,250,0.9)' : undefined }}
            >
              S{i + 1}
            </span>
          );
        })}
      </div>

      {/* Группы результатов WBS. */}
      {LAYOUT.groups.map(({ group, start, rows }) => (
        <div
          key={group.id}
          className="flex items-center gap-[var(--gap-1)] border-l-2 pl-[var(--gap-1)]"
          style={{
            gridColumn: 1,
            gridRow: `${start} / span ${rows.length}`,
            borderColor: group.code ? 'rgba(37,147,250,0.75)' : 'rgba(142,180,255,0.35)',
            borderLeftStyle: group.code ? 'solid' : 'dashed',
          }}
        >
          <span className="flex min-w-0 items-baseline gap-[5px]">
            {group.code ? <span className="t-micro shrink-0 font-display text-highlight">{group.code}</span> : null}
            <span className="t-micro min-w-0 leading-tight text-soft">{group.title}</span>
          </span>
        </div>
      ))}

      {/* Строки пакетов работ. */}
      {LAYOUT.groups.flatMap(({ rows }) =>
        rows.map(({ row, line }) => {
          const i = rowIndex++;
          return (
            <GanttRowButton
              key={row.key}
              row={row}
              line={line}
              index={i}
              show={show}
              reducedMotion={reducedMotion}
              active={activeKey === row.key}
              pinned={pinnedKey === row.key}
              dimmed={(criticalMode && !row.critical) || (activeRow !== undefined && activeRow.key !== row.key)}
              criticalMode={criticalMode}
              bind={bind}
            />
          );
        }),
      )}

      {/* Ось вех. */}
      <div className="flex flex-col justify-start gap-[3px] pt-[calc(var(--dia)*0.9)]" style={{ gridColumn: '1 / 3', gridRow: LAYOUT.msLine }}>
        <span className="t-micro flex items-center gap-[var(--gap-1)] whitespace-nowrap text-soft">
          <LegendSwatch kind="critical" /> критический путь
          <LegendSwatch kind="regular" className="ml-[var(--gap-1)]" /> другие работы
          <Diamond className="mr-[3px] ml-[calc(var(--gap-1)+3px)] size-[9px]" /> веха
        </span>
        <span className="t-micro flex items-center gap-[var(--gap-1)] whitespace-nowrap text-soft">
          <LegendSwatch kind="optional" /> задел из буфера · ид — идеальные человеко-дни
        </span>
      </div>
      <div className="relative border-t border-[rgba(142,180,255,0.35)]" style={{ gridColumn: 3, gridRow: LAYOUT.msLine }}>
        {MILESTONES.map((m, i) => {
          const prev = i > 0 ? MILESTONES[i - 1].sprint : 0;
          const on = activeKey === msKey(m);
          return (
            <button
              key={m.id}
              type="button"
              {...bind(msKey(m))}
              aria-pressed={pinnedKey === msKey(m)}
              data-milestone={m.id}
              className="group absolute top-0 h-full cursor-pointer rounded-[6px] text-right"
              style={{ right: `${100 - pct(m.sprint)}%`, width: `${pct(m.sprint - prev)}%` }}
            >
              <Diamond
                active={on}
                className={`absolute top-0 right-0 size-[var(--dia)] translate-x-1/2 -translate-y-1/2 group-hover:scale-110 ${on ? 'scale-125' : ''}`}
              />
              <span className="block pt-[calc(var(--dia)*0.75)] pr-[3px] text-balance">
                <span className={`t-micro block leading-tight transition-colors duration-300 ${on ? 'text-white' : 'text-ice'}`}>
                  <span className="font-display text-highlight">{m.id}</span> {m.title}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface RowProps {
  row: GanttRow;
  line: number;
  index: number;
  show: boolean;
  reducedMotion: boolean;
  active: boolean;
  pinned: boolean;
  dimmed: boolean;
  criticalMode: boolean;
  bind: HoverBind<string>;
}

function GanttRowButton({ row, line, index, show, reducedMotion, active, pinned, dimmed, criticalMode, bind }: RowProps) {
  const kind = kindOf(row);
  const last = row.segments[row.segments.length - 1];
  return (
    <button
      type="button"
      {...bind(row.key)}
      aria-pressed={pinned}
      aria-label={`${row.code ? row.code + ' ' : ''}${row.title}. ${sprintsText(row)}, ${row.estimate} ид${
        row.critical ? ', критический путь' : row.optional ? ', задел из буфера' : ''
      }`}
      data-row={row.id}
      className={`relative z-[2] grid cursor-pointer items-center rounded-[8px] text-left transition-[background-color,opacity] duration-300 ${
        active ? 'bg-[rgba(37,147,250,0.13)] shadow-[inset_0_0_0_1px_rgba(37,147,250,0.35)]' : 'hover:bg-[rgba(142,180,255,0.06)]'
      }`}
      style={{ gridColumn: '2 / 4', gridRow: line, gridTemplateColumns: 'subgrid' }}
    >
      <span
        className="flex min-w-0 items-center gap-[var(--gap-1)] pl-[6px] transition-opacity duration-300"
        style={{ opacity: dimmed && !active ? 0.42 : 1 }}
      >
        <span className="t-micro w-[clamp(28px,calc(var(--u)*2.3),44px)] shrink-0 font-display text-highlight">
          {row.code}
        </span>
        <span className={`t-small min-w-0 flex-1 truncate leading-tight ${active ? 'text-white' : 'text-ice'} ${row.optional ? 'italic' : ''}`}>
          {row.title}
        </span>
        <span className="t-micro shrink-0 pr-[2px] text-mute t-num">{row.estimate} ид</span>
      </span>

      <span className="relative block h-full">
        {row.segments.map((seg, si) => (
          <span
            key={si}
            className="absolute inset-y-0 flex items-center"
            style={{ left: `calc(${pct(seg.start - 1)}% + 3px)`, width: `calc(${pct(seg.end - seg.start + 1)}% - 6px)` }}
          >
            <motion.span
              className="block h-[var(--bar)] w-full rounded-[5px] transition-opacity duration-300"
              style={{
                ...barStyle(kind, criticalMode && row.critical ? 'strong' : 'normal'),
                originX: 0,
                opacity: dimmed && !active ? (criticalMode ? 0.22 : 0.5) : 1,
                outline: active ? '1.5px solid rgba(220,231,255,0.9)' : undefined,
                outlineOffset: 2,
              }}
              initial={reducedMotion ? false : { scaleX: 0 }}
              animate={show ? { scaleX: 1 } : undefined}
              transition={{ duration: 0.75, delay: 0.1 + (seg.start - 1) * 0.07 + index * 0.02, ease: [0.16, 1, 0.3, 1] }}
            />
          </span>
        ))}
        {row.optional && last ? (
          <span
            className="t-micro absolute inset-y-0 flex items-center whitespace-nowrap text-highlight"
            style={{ left: `calc(${pct(last.end)}% + 6px)` }}
          >
            задел, из буфера
          </span>
        ) : null}
      </span>
    </button>
  );
}
