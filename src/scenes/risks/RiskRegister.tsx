import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import type { HoverBind } from '../schedule/shared';
import { BACKLOG_COUNT, REGISTER, STRATEGY_COUNTS, type RankedRisk } from './riskData';

/** Маркер уровня: высокий — заливка бренда, средний — контур, низкий — пунктир (без новых цветов). */
export function LevelTag({ risk }: { risk: RankedRisk }) {
  const style =
    risk.level === 'high'
      ? 'border-transparent bg-[linear-gradient(135deg,#2593FA,#2550FA)] text-white'
      : risk.level === 'medium'
        ? 'border-[rgba(142,180,255,0.45)] bg-[rgba(37,80,250,0.16)] text-ice'
        : 'border-dashed border-[rgba(142,180,255,0.4)] text-soft';
  return (
    <span className={`t-micro inline-flex items-center gap-1 rounded-full border px-2 py-[1px] whitespace-nowrap ${style}`}>
      <span className="font-display t-num">{risk.score}</span>
      <span>· {risk.levelLabel.toLowerCase()}</span>
    </span>
  );
}

export function BacklogBadge() {
  return <span className="chip shrink-0">из бэклога проекта</span>;
}

interface RegisterProps {
  active: string | null;
  pinned: string | null;
  bind: HoverBind<string>;
}

/** Ранжированный реестр рисков (по p × i), связан подсветкой с матрицей. */
export function RiskRegister({ active, pinned, bind }: RegisterProps) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  return (
    <div data-risk-register>
      <div className="flex flex-wrap items-baseline justify-between gap-x-[var(--gap-2)] gap-y-0.5 px-[var(--gap-1)]">
        <p className="t-eyebrow tracking-[0.14em]">Реестр рисков · по баллу p × i</p>
        <p className="t-micro text-mute">
          {STRATEGY_COUNTS.map((s) => `${s.title} ${s.count}`).join(' · ')} · из бэклога {BACKLOG_COUNT} из {REGISTER.length}
        </p>
      </div>
      <ol className="mt-[calc(var(--gap-1)*0.8)] flex flex-col gap-[2px]">
        {REGISTER.map((r, i) => {
          const on = active === r.id;
          return (
            <motion.li
              key={r.id}
              initial={reducedMotion ? false : { opacity: 0, x: 14 }}
              animate={show ? { opacity: 1, x: 0 } : undefined}
              transition={{ duration: 0.45, delay: 0.3 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                type="button"
                {...bind(r.id)}
                aria-pressed={pinned === r.id}
                data-risk-row={r.id}
                className={`grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-[var(--gap-2)] rounded-[10px] border px-[var(--gap-1)] py-[calc(var(--gap-1)*0.4)] text-left transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 ${
                  on ? 'border-[rgba(37,147,250,0.6)] bg-[rgba(37,80,250,0.18)]' : 'border-transparent hover:bg-[rgba(142,180,255,0.06)]'
                }`}
              >
                <span
                  className={`t-micro grid h-[22px] min-w-[34px] place-items-center rounded-full border font-display leading-none ${
                    on ? 'border-white bg-white text-primary' : 'border-[rgba(142,180,255,0.45)] text-ice'
                  }`}
                >
                  {r.id}
                </span>
                <span className={`t-small min-w-0 truncate leading-snug ${on ? 'font-semibold text-white' : 'text-ice'}`}>{r.title}</span>
                <span className="t-micro text-mute t-num whitespace-nowrap">
                  {r.probability} × {r.impact}
                </span>
                <span className="flex w-[clamp(96px,calc(var(--u)*8.2),150px)] justify-end">
                  <LevelTag risk={r} />
                </span>
              </button>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
