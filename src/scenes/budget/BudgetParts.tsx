import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { BUDGET, PROJECT } from '@/data/project';
import { fmtNum, type HoverBind } from '../schedule/shared';
import {
  BASELINE_SHARE,
  BASELINE_SLICES,
  RESERVE_SLICE,
  TEAM_MONTHLY,
  TEAM_ROLES,
  formatUsd,
  type Slice,
  type SliceId,
} from './budgetMath';

export function Swatch({ slice, className = '' }: { slice: Slice; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-[4px] ${className}`}
      style={
        slice.inBaseline
          ? { background: slice.color, boxShadow: `0 0 10px ${slice.color}66` }
          : {
              background: 'repeating-linear-gradient(45deg, #DCE7FF 0 2px, rgba(220,231,255,0.12) 2px 5px)',
              outline: '1px dashed rgba(220,231,255,0.8)',
              outlineOffset: 1,
            }
      }
    />
  );
}

const VALUE_COL = 'min-w-[6.4ch] text-right';
const SHARE_COL = 'min-w-[5.6ch] text-right';

function SliceRow({ slice, active, bind }: { slice: Slice; active: SliceId | null; bind: HoverBind<SliceId> }) {
  const on = active === slice.id;
  const dim = active !== null && !on;
  return (
    <button
      type="button"
      {...bind(slice.id)}
      aria-pressed={on}
      data-slice-card={slice.id}
      className={`group grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto_auto] items-start gap-x-[var(--gap-1)] rounded-[10px] border px-[var(--gap-1)] py-[calc(var(--gap-1)*0.75)] text-left transition-[background-color,border-color,opacity,transform] duration-300 hover:-translate-y-0.5 ${
        on ? 'border-[rgba(37,147,250,0.55)] bg-[rgba(37,80,250,0.16)]' : 'border-transparent hover:bg-[rgba(142,180,255,0.06)]'
      }`}
      style={{ opacity: dim ? 0.55 : 1 }}
    >
      <Swatch slice={slice} className="mt-[0.35em] size-[11px]" />
      <span className="t-small min-w-0 font-semibold leading-snug text-white">{slice.label}</span>
      <span className={`t-small font-semibold leading-snug text-white t-num ${VALUE_COL}`}>{formatUsd(slice.value)}</span>
      <span className={`t-micro mt-[0.15em] font-semibold text-highlight t-num ${SHARE_COL}`}>{fmtNum(slice.share, 1)}%</span>
      <span className="t-micro col-[2/-1] leading-snug text-mute text-pretty">{slice.note}</span>
    </button>
  );
}

/** Статьи бюджета как равенство: базовый план (3 статьи) + управленческий резерв = итог. */
export function SliceList({ active, bind }: { active: SliceId | null; bind: HoverBind<SliceId> }) {
  const baselineOn = active !== null && active !== 'reserve';
  return (
    <div role="group" aria-label="Статьи бюджета проекта" className="flex flex-col gap-[calc(var(--gap-1)*0.6)]" data-interactive>
      <div className="flex items-baseline gap-[var(--gap-1)] px-[var(--gap-1)]">
        <span className={`t-eyebrow min-w-0 flex-1 tracking-[0.12em] transition-colors ${baselineOn ? 'text-white' : ''}`}>
          Базовый план затрат
        </span>
        <span className={`t-small font-semibold text-white t-num ${VALUE_COL}`}>{formatUsd(BUDGET.baseline)}</span>
        <span className={`t-micro font-semibold text-highlight t-num ${SHARE_COL}`}>{fmtNum(BASELINE_SHARE, 1)}%</span>
      </div>
      <div className="relative flex flex-col gap-[2px] pl-[10px]">
        <span aria-hidden className="absolute top-1 bottom-1 left-[2px] w-px rounded bg-[rgba(142,180,255,0.45)]" />
        {BASELINE_SLICES.map((s) => (
          <SliceRow key={s.id} slice={s} active={active} bind={bind} />
        ))}
      </div>
      <div className="flex items-center gap-[6px] pl-[10px]">
        <span className="t-small w-[1ch] text-center font-semibold text-highlight" aria-hidden>
          +
        </span>
        <div className="min-w-0 flex-1">
          <SliceRow slice={RESERVE_SLICE} active={active} bind={bind} />
        </div>
      </div>
      <div className="mt-[2px] flex items-baseline gap-[var(--gap-1)] border-t border-[rgba(142,180,255,0.25)] px-[var(--gap-1)] pt-[calc(var(--gap-1)*0.9)]">
        <span className="t-small min-w-0 flex-1 font-semibold text-ice">= Итого бюджет проекта</span>
        <span className={`t-small font-semibold t-num ${VALUE_COL}`}>
          <span className="text-gradient">{formatUsd(BUDGET.total)}</span>
        </span>
        <span className={`t-micro font-semibold text-highlight t-num ${SHARE_COL}`}>{fmtNum(100, 1)}%</span>
      </div>
    </div>
  );
}

/** Статья «Команда» по ролям, $ в месяц: сумма ролей = бюджет команды из бэклога. */
export function TeamBreakdown({ active, bind, compact = false }: { active: SliceId | null; bind: HoverBind<SliceId>; compact?: boolean }) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  const on = active === 'team';
  const max = Math.max(...TEAM_ROLES.map((r) => r.monthly));
  const handlers = bind('team');
  return (
    <div
      data-interactive
      data-team
      onPointerEnter={handlers.onPointerEnter}
      onPointerLeave={handlers.onPointerLeave}
      onClick={handlers.onClick}
      className={`cursor-pointer rounded-[12px] border px-[var(--gap-2)] py-[calc(var(--gap-1)*1.2)] transition-[border-color,background-color,box-shadow] duration-300 ${
        on ? 'border-[rgba(37,147,250,0.55)] bg-[rgba(37,80,250,0.12)] shadow-[var(--glow-blue)]' : 'border-[rgba(142,180,255,0.14)] bg-[rgba(142,180,255,0.03)]'
      }`}
    >
      <p className="flex flex-wrap items-baseline justify-between gap-x-[var(--gap-2)]">
        <span className="t-micro font-semibold tracking-[0.04em] text-soft">Команда по ролям · план на месяц</span>
        <span className="t-micro text-soft t-num">
          итого <span className="font-semibold text-white">{formatUsd(TEAM_MONTHLY)}</span> × {PROJECT.durationMonths} мес ={' '}
          <span className="font-semibold text-white">{formatUsd(TEAM_MONTHLY * PROJECT.durationMonths)}</span>
        </span>
      </p>
      <ul className={`mt-[calc(var(--gap-1)*0.8)] grid gap-x-[var(--gap-2)] gap-y-2 ${compact ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {TEAM_ROLES.map((r, i) => (
          <li key={r.id} className="min-w-0">
            <span className="t-small block font-semibold leading-tight text-white t-num">{formatUsd(r.monthly)}</span>
            <span className="mt-[5px] block h-[5px] overflow-hidden rounded-full bg-[rgba(142,180,255,0.1)]" aria-hidden>
              <motion.span
                className="block h-full rounded-full"
                style={{
                  width: `${(r.monthly / max) * 100}%`,
                  originX: 0,
                  background: 'linear-gradient(90deg, #2593FA, #2550FA)',
                  boxShadow: on ? '0 0 10px rgba(37,147,250,0.8)' : 'none',
                }}
                initial={reducedMotion ? false : { scaleX: 0 }}
                animate={show ? { scaleX: 1 } : undefined}
                transition={{ duration: 0.8, delay: 0.5 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
            <span className="t-micro mt-[4px] block leading-tight text-mute">{r.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
