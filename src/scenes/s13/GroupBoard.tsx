import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { KPI_GROUPS, type KpiMetric } from '@/data/hr';
import { useScene } from '@/components/scene';
import { parseTarget } from './kpi';
import { TargetRing } from './TargetRing';
import { TargetValue } from './TargetValue';
import { useViewportUnit } from './useViewportUnit';

interface BoardProps {
  selected: number;
  onSelect: (index: number) => void;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const ROW_H = 'clamp(66px, calc(var(--u) * 5.3), 108px)';

function metricAria(groupTitle: string, m: KpiMetric) {
  return `${groupTitle}: ${m.label}. Цель ${m.target}. ${m.hint}`;
}

/** Строка KPI в раскрытой группе: индикатор цели, название, пояснение, целевое значение. */
function ActiveRow({ metric, group, index }: { metric: KpiMetric; group: string; index: number }) {
  const u = useViewportUnit();
  const t = parseTarget(metric);
  const ring = Math.round(Math.min(76, Math.max(46, u * 3.9)));
  const Icon = t.icon;
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={metricAria(group, metric)}
      data-interactive
      className="group flex w-full items-center gap-[var(--gap-2)] rounded-[var(--radius-sm)] px-[var(--gap-2)] text-left transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-[rgba(37,147,250,0.08)] focus-visible:bg-[rgba(37,147,250,0.08)]"
      style={{ height: ROW_H }}
    >
      {t.kind === 'share' ? (
        <TargetRing share={t.share} size={ring} caption delay={0.15 + index * 0.08} />
      ) : (
        <span
          className="grid shrink-0 place-items-center rounded-[var(--radius-sm)] border border-[rgba(142,180,255,0.22)] bg-[rgba(37,80,250,0.12)]"
          style={{ width: ring, height: ring }}
          aria-hidden
        >
          <Icon className="h-[42%] w-[42%] text-highlight" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="t-small font-semibold leading-snug text-white">{metric.label}</span>
        <span className="t-micro mt-0.5 leading-snug text-soft">{metric.hint}</span>
      </span>
      <TargetValue target={t} size="md" className="shrink-0" />
    </div>
  );
}

/** Строка KPI в свёрнутой группе: название (по наведению/фокусу — пояснение) и цель. */
function CompactRow({ metric, group, onSelect }: { metric: KpiMetric; group: string; onSelect: () => void }) {
  const [peek, setPeek] = useState(false);
  const t = parseTarget(metric);
  return (
    <button
      type="button"
      aria-label={metricAria(group, metric)}
      onPointerEnter={() => setPeek(true)}
      onPointerLeave={() => setPeek(false)}
      onFocus={() => setPeek(true)}
      onBlur={() => setPeek(false)}
      onClick={onSelect}
      className="group flex w-full cursor-pointer flex-col justify-center gap-1 rounded-[var(--radius-sm)] px-[var(--gap-2)] text-left transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-[rgba(37,147,250,0.08)] focus-visible:bg-[rgba(37,147,250,0.08)]"
      style={{ height: ROW_H }}
    >
      <span className="relative block min-h-[2.8em] t-small leading-snug" aria-hidden>
        <span className={`absolute inset-0 line-clamp-2 text-soft transition-opacity duration-200 ${peek ? 'opacity-0' : 'opacity-100'}`}>
          {metric.label}
        </span>
        <span className={`absolute inset-0 line-clamp-2 t-micro text-highlight transition-opacity duration-200 ${peek ? 'opacity-100' : 'opacity-0'}`}>
          {metric.hint}
        </span>
      </span>
      <span className="flex items-center gap-2" aria-hidden>
        {t.kind === 'share' ? <TargetRing share={t.share} size={18} /> : null}
        <TargetValue target={t} size="sm" />
      </span>
    </button>
  );
}

/**
 * Панель 4 × 4 на широких экранах: выбранная группа раскрыта (кольца целей, пояснения),
 * остальные — компактными столбцами. Строки выровнены по горизонтали между группами.
 */
export function GroupBoard({ selected, onSelect }: BoardProps) {
  const { reducedMotion } = useScene();
  const columns = KPI_GROUPS.map((_, i) => (i === selected ? '1.95fr' : '1fr')).join(' ');
  // Подробные строки показываем, когда колонка уже расширилась, — иначе текст на полсекунды
  // переносится в узкой колонке и наезжает.
  const [expanded, setExpanded] = useState(selected);
  useEffect(() => {
    if (reducedMotion) {
      setExpanded(selected);
      return;
    }
    // Основной сигнал — transitionend у grid-template-columns; таймер — страховка.
    const t = window.setTimeout(() => setExpanded(selected), 1200);
    return () => window.clearTimeout(t);
  }, [selected, reducedMotion]);

  return (
    <div
      className="grid gap-x-[var(--gap-2)]"
      data-interactive
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === 'grid-template-columns') setExpanded(selected);
      }}
      style={{
        gridTemplateColumns: columns,
        gridTemplateRows: 'auto auto',
        transition: reducedMotion ? undefined : 'grid-template-columns 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* стеклянные подложки групп */}
      {KPI_GROUPS.map((g, i) => (
        <div
          key={`bg-${g.id}`}
          className="glass transition-[border-color,box-shadow] duration-500"
          style={{
            gridColumn: i + 1,
            gridRow: '1 / 3',
            borderColor: i === selected ? 'var(--glass-border-hi)' : undefined,
            boxShadow: i === selected ? 'var(--glow-blue)' : undefined,
          }}
          aria-hidden
        />
      ))}

      {/* вкладки групп */}
      <div
        role="tablist"
        aria-label="Группы KPI"
        className="relative z-10 grid"
        style={{ gridColumn: '1 / -1', gridRow: 1, gridTemplateColumns: 'subgrid' }}
      >
        {KPI_GROUPS.map((g, i) => {
          const isSel = i === selected;
          return (
            <button
              key={g.id}
              id={`s13-tab-${g.id}`}
              type="button"
              role="tab"
              aria-selected={isSel}
              aria-controls={`s13-panel-${g.id}`}
              tabIndex={0}
              onClick={() => onSelect(i)}
              onFocus={(e) => {
              if (e.currentTarget.matches(':focus-visible')) onSelect(i);
            }}
              className="group relative flex cursor-pointer items-center justify-between gap-2 rounded-t-[var(--radius-md)] px-[var(--gap-3)] pt-[var(--gap-2)] pb-[var(--gap-1)] text-left"
            >
              <span
                className="absolute inset-x-[var(--gap-3)] top-0 h-[2px] rounded-full transition-opacity duration-300"
                style={{ background: 'var(--grad-brand)', boxShadow: '0 0 12px #2593FA', opacity: isSel ? 1 : 0 }}
                aria-hidden
              />
              <span className="flex min-w-0 items-baseline gap-2 transition-transform duration-300 group-hover:-translate-y-0.5">
                <span className="font-display t-micro text-highlight">{pad2(i + 1)}</span>
                <span className={`t-h3 truncate ${isSel ? 'text-white' : 'text-soft group-hover:text-ice'}`}>{g.title}</span>
              </span>
              <span className={`t-micro shrink-0 ${isSel ? 'text-highlight' : 'text-mute'}`}>{g.metrics.length} KPI</span>
            </button>
          );
        })}
      </div>

      {/* метрики групп */}
      {KPI_GROUPS.map((g, i) => {
        const isSel = i === selected;
        return (
          <div
            key={g.id}
            id={`s13-panel-${g.id}`}
            role={isSel ? 'tabpanel' : 'group'}
            aria-labelledby={`s13-tab-${g.id}`}
            className="relative z-10 flex min-w-0 flex-col px-[var(--gap-1)] pb-[var(--gap-2)]"
            style={{ gridColumn: i + 1, gridRow: 2 }}
          >
            {g.metrics.map((m, k) => (
              <div key={m.label} className={k > 0 ? 'border-t border-[rgba(142,180,255,0.1)]' : ''}>
                {isSel && expanded === i ? (
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: k * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ActiveRow metric={m} group={g.title} index={k} />
                  </motion.div>
                ) : (
                  <CompactRow metric={m} group={g.title} onSelect={() => onSelect(i)} />
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
