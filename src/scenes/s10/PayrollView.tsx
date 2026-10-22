import { useId, useMemo, useState } from 'react';
import { Reveal, SceneHeader } from '@/components/scene';
import { Glass } from '@/components/ui';
import { fmtNum, useHoverSelect } from '../s08/shared';
import { displayLines, type BudgetMode, type DisplayLine } from './budgetMath';
import {
  BudgetDonut,
  ExtraBreakdown,
  LineValue,
  MODE_UNIT,
  ModeToggle,
  PAYROLL_FOOTNOTE,
  Swatch,
  type LineId,
} from './PayrollParts';

const TITLE = 'Фонд оплаты труда и HR-бюджет';

type Bind = ReturnType<typeof useHoverSelect<LineId>>['bind'];

function LineCard({
  line,
  mode,
  active,
  bind,
  compact = false,
}: {
  line: DisplayLine;
  mode: BudgetMode;
  active: LineId | null;
  bind: Bind;
  compact?: boolean;
}) {
  const on = active === line.id;
  const dim = active !== null && !on;
  return (
    <button
      type="button"
      {...bind(line.id)}
      aria-pressed={on}
      data-active={on ? 'true' : undefined}
      data-line={line.id}
      className={`glass glass-hover flex h-full w-full cursor-pointer flex-col text-left ${
        compact ? 'p-3.5' : 'px-[var(--gap-3)] py-[var(--gap-2)]'
      } ${dim ? 'opacity-60' : ''}`}
      style={{ transitionProperty: 'transform, border-color, box-shadow, opacity' }}
    >
      <span className="flex w-full items-center gap-[var(--gap-1)]">
        <Swatch id={line.id} className="size-3" />
        <span className="t-small min-w-0 flex-1 font-semibold leading-snug text-white">{line.label}</span>
        <span className="chip shrink-0 t-num" data-share>
          {fmtNum(line.share)}%
        </span>
      </span>
      <span className="mt-[var(--gap-1)] flex items-baseline gap-[var(--gap-1)]">
        <LineValue
          line={line}
          mode={mode}
          className={`font-display leading-none text-white ${compact ? 'text-[22px]' : 'text-[length:var(--fs-h2)]'}`}
        />
        <span className="t-micro text-soft">{MODE_UNIT[mode]}</span>
      </span>
      <span className="t-micro mt-[calc(var(--gap-1)*0.8)] text-mute">{line.note}</span>
    </button>
  );
}

function ExtraPanel({
  mode,
  lines,
  active,
  bind,
  className = '',
}: {
  mode: BudgetMode;
  lines: DisplayLine[];
  active: LineId | null;
  bind: Bind;
  className?: string;
}) {
  const extra = lines.find((l) => l.id === 'extra');
  const on = active === 'extra';
  const handlers = bind('extra');
  return (
    <Glass
      strong
      data-interactive
      onPointerEnter={handlers.onPointerEnter}
      onPointerLeave={handlers.onPointerLeave}
      onClick={handlers.onClick}
      selected={on}
      className={`glass-hover cursor-pointer ${className}`}
    >
      <ExtraBreakdown
        mode={mode}
        highlighted={on}
        header={
          <div className="flex flex-wrap items-baseline justify-between gap-x-[var(--gap-2)] gap-y-0.5">
            <p className="t-small flex min-w-0 items-center gap-[var(--gap-1)] font-semibold text-white">
              <Swatch id="extra" className="size-2.5" />
              <span>Дополнительные HR-расходы: состав</span>
            </p>
            {extra ? (
              <p className="t-micro shrink-0 text-soft">
                итого <LineValue line={extra} mode={mode} className="font-semibold text-white" /> {MODE_UNIT[mode]}
              </p>
            ) : null}
          </div>
        }
      />
    </Glass>
  );
}

/** 10 · Payroll & HR Budget: переключатель периода, кольцевая диаграмма, статьи и состав доп. расходов. */
export function PayrollView({ compact }: { compact: boolean }) {
  const [mode, setMode] = useState<BudgetMode>('monthly');
  const { active, bind, setHovered, setPinned, pinned } = useHoverSelect<LineId>(null, { toggle: true });
  const lines = useMemo(() => displayLines(mode), [mode]);
  const idPrefix = useId().replace(/:/g, '');
  const panelId = `${idPrefix}-panel`;

  const toggle = (
    <ModeToggle mode={mode} onChange={setMode} panelId={panelId} idPrefix={idPrefix} />
  );
  const donut = (
    <BudgetDonut
      lines={lines}
      mode={mode}
      active={active}
      onHover={setHovered}
      onSelect={(id) => setPinned(pinned === id ? null : id)}
    />
  );
  const footnote = <p className="t-micro text-mute text-pretty">{PAYROLL_FOOTNOTE}</p>;

  if (compact) {
    return (
      <>
        <SceneHeader title={TITLE} />
        <Reveal delay={0.15} className="mt-4">
          {toggle}
        </Reveal>
        <div id={panelId} role="tabpanel" aria-labelledby={`${idPrefix}-${mode}`} className="mt-4">
          <Reveal delay={0.2}>
            <Glass strong className="flex justify-center p-4">
              <div className="w-full max-w-[300px]">{donut}</div>
            </Glass>
          </Reveal>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {lines.map((l, i) => (
              <Reveal key={l.id} delay={0.25 + i * 0.05}>
                <LineCard line={l} mode={mode} active={active} bind={bind} compact />
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.45}>
            <ExtraPanel mode={mode} lines={lines} active={active} bind={bind} className="mt-2.5 p-3.5" />
          </Reveal>
        </div>
        <Reveal delay={0.5} className="mt-3">
          {footnote}
        </Reveal>
      </>
    );
  }

  return (
    <>
      <div className="flex items-end justify-between gap-x-[var(--gap-4)]">
        <SceneHeader title={TITLE} className="max-w-none! min-w-0" />
        <Reveal delay={0.2} className="shrink-0 pb-1">
          {toggle}
        </Reveal>
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-${mode}`}
        className="mt-[var(--gap-4)] grid items-stretch gap-[var(--gap-3)]"
        style={{ gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)' }}
      >
        <Reveal delay={0.25} className="min-w-0">
          <Glass strong className="flex h-full items-center justify-center p-[var(--gap-3)]">
            <div style={{ width: 'min(100%, calc(var(--u) * 25.5))' }}>{donut}</div>
          </Glass>
        </Reveal>

        <div className="flex min-w-0 flex-col gap-[var(--gap-3)]">
          <div className="grid grid-cols-2 gap-[var(--gap-3)]">
            {lines.map((l, i) => (
              <Reveal key={l.id} delay={0.3 + i * 0.06} className="min-w-0">
                <LineCard line={l} mode={mode} active={active} bind={bind} />
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.55} className="flex-1">
            <ExtraPanel
              mode={mode}
              lines={lines}
              active={active}
              bind={bind}
              className="h-full px-[var(--gap-3)] py-[var(--gap-2)]"
            />
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.6} className="mt-[var(--gap-2)] max-w-[150ch]">
        {footnote}
      </Reveal>
    </>
  );
}
