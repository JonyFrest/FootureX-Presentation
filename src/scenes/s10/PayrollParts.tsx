import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Pie, PieChart, ResponsiveContainer, Sector, type PieSectorShapeProps } from 'recharts';
import { useScene } from '@/components/scene';
import { BUDGET_ASSUMPTIONS, BUDGET_TOTAL, formatBln, formatMln, type BudgetLine } from '@/data/hr';
import { chartPalette } from '@/styles/tokens';
import { fmtNum, thinSpaces } from '../s08/shared';
import { displayExtras, type BudgetMode, type DisplayLine } from './budgetMath';

export type LineId = BudgetLine['id'];

/** Цвет статьи: шкала бренда от насыщенного синего к светлому. */
export const LINE_COLORS: Record<LineId, string> = {
  salaries: chartPalette[0],
  bonuses: chartPalette[1],
  employerTax: chartPalette[2],
  extra: chartPalette[3],
};

export const MODE_LABEL: Record<BudgetMode, string> = { monthly: 'Месяц', annual: 'Год' };
export const MODE_UNIT: Record<BudgetMode, string> = { monthly: 'млн сум / мес', annual: 'млн сум / год' };

const pct = (rate: number) => fmtNum(rate * 100, 0);

export const PAYROLL_FOOTNOTE =
  `Социальный налог ${pct(BUDGET_ASSUMPTIONS.socialTaxRate)}% — общий режим НК РУз; ` +
  `НДФЛ ${pct(BUDGET_ASSUMPTIONS.personalIncomeTaxRate)}% удерживается из зарплаты сотрудника и не увеличивает ` +
  `расходы работодателя; премии — ${pct(BUDGET_ASSUMPTIONS.bonusRate)}% окладного фонда; план, млн сум`;

/** Делит «322,1 млн сум» на число и единицу. */
function splitAmount(text: string): { value: string; unit: string } {
  const t = thinSpaces(text);
  const i = t.search(/ [^\d ]/);
  return i > 0 ? { value: t.slice(0, i), unit: t.slice(i + 1) } : { value: t, unit: '' };
}

/* ------------------------------------------------------------------
   Переключатель «Месяц / Год» (role=tablist). Стрелки заняты презентацией,
   поэтому обе вкладки достижимы клавишей Tab и нажимаются Enter / пробелом.
   ------------------------------------------------------------------ */

export function ModeToggle({
  mode,
  onChange,
  panelId,
  idPrefix,
}: {
  mode: BudgetMode;
  onChange: (m: BudgetMode) => void;
  panelId: string;
  idPrefix: string;
}) {
  const modes: BudgetMode[] = ['monthly', 'annual'];
  const { reducedMotion } = useScene();
  return (
    <div
      role="tablist"
      aria-label="Период расчёта бюджета"
      className="glass-strong relative inline-flex rounded-full p-1"
      style={{ borderRadius: 999 }}
    >
      {modes.map((m) => {
        const on = m === mode;
        return (
          <button
            key={m}
            id={`${idPrefix}-${m}`}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={panelId}
            onClick={() => onChange(m)}
            className={`relative z-10 min-w-[clamp(84px,calc(var(--u)*7),130px)] cursor-pointer rounded-full px-[var(--gap-3)] py-[calc(var(--gap-1)*0.9)] t-small font-semibold transition-colors duration-300 ${
              on ? 'text-white' : 'text-soft hover:text-white'
            }`}
          >
            {on ? (
              <motion.span
                layoutId={`${idPrefix}-pill`}
                className="absolute inset-0 -z-10 rounded-full"
                style={{ background: 'var(--grad-brand)', boxShadow: '0 8px 24px -10px rgba(37,80,250,0.8)' }}
                transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
              />
            ) : null}
            {MODE_LABEL[m]}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------
   Кольцевая диаграмма (Recharts). Монтируется по ready — анимация стартует
   после остановки камеры; при reduced motion — сразу финальное состояние.
   ------------------------------------------------------------------ */

export function BudgetDonut({
  lines,
  mode,
  active,
  onHover,
  onSelect,
}: {
  lines: DisplayLine[];
  mode: BudgetMode;
  active: LineId | null;
  onHover: (id: LineId | null) => void;
  onSelect: (id: LineId) => void;
}) {
  const { ready, reducedMotion } = useScene();
  const mounted = ready || reducedMotion;
  const data = lines.map((l) => ({ id: l.id, name: l.label, value: l.exactMonthly, fill: LINE_COLORS[l.id] }));

  const renderSector = (props: PieSectorShapeProps) => {
    const id = lines[props.index]?.id;
    const on = active !== null && id === active;
    const dim = active !== null && !on;
    const outer = Number(props.outerRadius);
    return (
      <Sector
        {...props}
        outerRadius={on ? outer + Math.max(6, outer * 0.06) : outer}
        fill={props.fill}
        fillOpacity={dim ? 0.35 : 1}
        stroke="none"
        style={{ transition: 'fill-opacity 0.3s ease', cursor: 'pointer', outline: 'none' }}
      />
    );
  };

  return (
    <div className="relative aspect-square w-full" data-interactive>
      {/* Подложка кольца — видна до монтирования диаграммы, не даёт раскладке прыгать. */}
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{
          inset: '7%',
          border: '1px solid rgba(142,180,255,0.14)',
          boxShadow: 'inset 0 0 60px rgba(37,80,250,0.12)',
        }}
      />
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{ inset: '22%', background: 'radial-gradient(circle, rgba(37,80,250,0.18), transparent 70%)' }}
      />
      {mounted ? (
        <div className="absolute inset-0" role="img" aria-label="Структура HR-бюджета по статьям">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }} accessibilityLayer={false}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="62%"
                outerRadius="86%"
                startAngle={90}
                endAngle={-270}
                paddingAngle={1.4}
                cornerRadius={5}
                stroke="none"
                rootTabIndex={-1}
                isAnimationActive={!reducedMotion}
                animationBegin={0}
                animationDuration={1100}
                animationEasing="ease-out"
                shape={renderSector}
                onMouseEnter={(_, i) => onHover(lines[i]?.id ?? null)}
                onMouseLeave={() => onHover(null)}
                onClick={(_, i) => {
                  const id = lines[i]?.id;
                  if (id) onSelect(id);
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* Итог в центре — настоящий HTML-текст. */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        {/* aria-live: при смене периода экранный диктор зачитывает новый итог. */}
        <div className="grid text-center" aria-live="polite">
          {(['monthly', 'annual'] as const).map((m) => {
            const on = m === mode;
            const t = m === 'monthly' ? splitAmount(formatMln(BUDGET_TOTAL.monthly)) : splitAmount(formatBln(BUDGET_TOTAL.annual));
            return (
              <div
                key={m}
                aria-hidden={!on}
                className="transition-[opacity,transform] duration-300 ease-out [grid-area:1/1]"
                style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)' }}
              >
                <p className="t-eyebrow">{m === 'monthly' ? 'Итого · месяц' : 'Итого · год'}</p>
                <p className="t-stat mt-[var(--gap-1)] t-num">
                  <span className="text-gradient">{t.value}</span>
                </p>
                <p className="t-small mt-[calc(var(--gap-1)*0.6)] font-semibold text-ice">{t.unit}</p>
                {m === 'annual' ? (
                  <p className="t-micro mt-0.5 text-soft t-num">= {thinSpaces(formatMln(BUDGET_TOTAL.annual))}</p>
                ) : (
                  <p className="t-micro mt-0.5 text-soft">в месяц</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Карточка статьи бюджета.
   ------------------------------------------------------------------ */

export function LineValue({ line, mode, className = '' }: { line: DisplayLine; mode: BudgetMode; className?: string }) {
  const { reducedMotion } = useScene();
  return (
    <motion.span
      key={`${line.id}-${mode}`}
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`inline-block t-num ${className}`}
    >
      {fmtNum(line.value)}
    </motion.span>
  );
}

export function Swatch({ id, className = '' }: { id: LineId; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-[4px] ${className}`}
      style={{ background: LINE_COLORS[id], boxShadow: `0 0 12px ${LINE_COLORS[id]}66` }}
    />
  );
}

/* ------------------------------------------------------------------
   Состав «Дополнительных HR-расходов» — мини-список с полосками.
   ------------------------------------------------------------------ */

export function ExtraBreakdown({
  mode,
  highlighted,
  header,
}: {
  mode: BudgetMode;
  highlighted: boolean;
  header?: ReactNode;
}) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  const items = displayExtras(mode);
  const max = Math.max(...items.map((i) => i.exact));
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId}>
      <div id={labelId}>{header}</div>
      {/* Одна сетка на весь список: подписи одной ширины, полоски выровнены. */}
      <ul
        className="mt-[var(--gap-1)] grid items-center gap-x-[var(--gap-2)] gap-y-[calc(var(--gap-1)*0.7)]"
        style={{ gridTemplateColumns: 'minmax(0, max-content) minmax(0, 1fr) auto' }}
      >
        {items.map((item, i) => (
          <li key={item.id} className="contents">
            <span className="t-micro min-w-0 text-soft">{item.label}</span>
            <span className="relative h-[6px] overflow-hidden rounded-full bg-white/[0.07]" aria-hidden>
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${(item.exact / max) * 100}%`,
                  originX: 0,
                  background: LINE_COLORS.extra,
                  opacity: highlighted ? 1 : 0.78,
                  transition: 'opacity 0.3s ease',
                }}
                initial={reducedMotion ? false : { scaleX: 0 }}
                animate={show ? { scaleX: 1 } : undefined}
                transition={{ duration: 0.9, delay: 0.35 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
            <span className="t-micro min-w-[5ch] text-right font-semibold text-white t-num">{fmtNum(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
