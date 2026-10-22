import { useState } from 'react';
import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { riskLevel } from '@/data/project';
import type { HoverBind } from '../schedule/shared';
import { CELL_STYLE, LEVEL_RANGES, SCALE, cellRisks, rangeText, type RankedRisk } from './riskData';

interface MatrixProps {
  active: string | null;
  pinned: string | null;
  bind: HoverBind<string>;
  /** Компактный вариант для телефона. */
  small?: boolean;
}

const IMPACT_DESC = [...SCALE].reverse();

/** Тепловая карта 5×5 «вероятность × влияние» с номерами рисков. */
export function RiskMatrix({ active, pinned, bind, small = false }: MatrixProps) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  const activeRisk = active;

  return (
    <div className="flex flex-col" data-risk-matrix>
      <div className="grid" style={{ gridTemplateColumns: 'auto auto minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr) auto auto' }}>
        {/* Подпись оси Y. */}
        <div className="flex items-center justify-center" style={{ gridColumn: 1, gridRow: 1 }}>
          <span className="t-micro font-semibold tracking-[0.08em] text-soft uppercase [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
            Влияние →
          </span>
        </div>
        {/* Деления оси Y. */}
        <div className="grid pr-[6px]" style={{ gridColumn: 2, gridRow: 1, gridTemplateRows: `repeat(${SCALE.length}, minmax(0, 1fr))` }}>
          {IMPACT_DESC.map((i) => (
            <span key={i} className="t-micro flex items-center justify-end font-display text-mute">
              {i}
            </span>
          ))}
        </div>

        {/* Ячейки. */}
        <div
          className="grid aspect-square w-full gap-[3px]"
          style={{
            gridColumn: 3,
            gridRow: 1,
            gridTemplateColumns: `repeat(${SCALE.length}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${SCALE.length}, minmax(0, 1fr))`,
          }}
        >
          {IMPACT_DESC.flatMap((impact, row) =>
            SCALE.map((p, col) => {
              const score = p * impact;
              const level = riskLevel(score);
              const risks = cellRisks(p, impact);
              const style = CELL_STYLE[level];
              const lit = risks.some((r) => r.id === activeRisk);
              return (
                <motion.div
                  key={`${p}-${impact}`}
                  className="relative flex items-center justify-center rounded-[8px] border"
                  style={{
                    background: style.background,
                    borderColor: lit ? 'rgba(220,231,255,0.85)' : style.border,
                    boxShadow: lit ? '0 0 22px -4px rgba(142,180,255,0.75)' : level === 'high' ? '0 0 18px -8px rgba(37,147,250,0.8)' : 'none',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  }}
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={show ? { opacity: 1, scale: 1 } : undefined}
                  transition={{ duration: 0.45, delay: 0.05 + (row + (SCALE.length - 1 - col)) * 0.035, ease: 'easeOut' }}
                  data-cell={`${p}x${impact}`}
                >
                  <span
                    className={`t-micro pointer-events-none absolute top-[3px] left-[6px] leading-none t-num ${
                      level === 'high' ? 'text-ice/80' : 'text-mute/70'
                    }`}
                    aria-hidden
                  >
                    {score}
                  </span>
                  {risks.length > 0 ? (
                    <span className={`flex flex-wrap items-center justify-center ${small ? 'gap-[3px]' : 'gap-[4px]'} pt-[8px]`}>
                      {risks.map((r) => (
                        <RiskChip
                          key={r.id}
                          risk={r}
                          active={activeRisk === r.id}
                          pinned={pinned === r.id}
                          bind={bind}
                          show={show}
                          reducedMotion={reducedMotion}
                          small={small}
                        />
                      ))}
                    </span>
                  ) : null}
                </motion.div>
              );
            }),
          )}
        </div>

        {/* Деления и подпись оси X. */}
        <div className="grid pt-[5px]" style={{ gridColumn: 3, gridRow: 2, gridTemplateColumns: `repeat(${SCALE.length}, minmax(0, 1fr))` }}>
          {SCALE.map((p) => (
            <span key={p} className="t-micro text-center font-display text-mute">
              {p}
            </span>
          ))}
        </div>
        <span className="t-micro pt-[2px] text-center font-semibold tracking-[0.08em] text-soft uppercase" style={{ gridColumn: 3, gridRow: 3 }}>
          Вероятность →
        </span>
      </div>

      {/* Легенда уровней. */}
      <ul className={`flex flex-wrap items-center justify-center gap-x-[var(--gap-2)] gap-y-1 ${small ? 'mt-2' : 'mt-[var(--gap-1)]'}`}>
        {LEVEL_RANGES.map((r) => (
          <li key={r.level} className="t-micro flex items-center gap-[6px] whitespace-nowrap text-soft">
            <span
              aria-hidden
              className="inline-block size-[12px] rounded-[3px] border"
              style={{ background: CELL_STYLE[r.level].background, borderColor: CELL_STYLE[r.level].border }}
            />
            {r.label} <span className="text-mute t-num">{rangeText(r)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RiskChip({
  risk,
  active,
  pinned,
  bind,
  show,
  reducedMotion,
  small,
}: {
  risk: RankedRisk;
  active: boolean;
  pinned: boolean;
  bind: HoverBind<string>;
  show: boolean;
  reducedMotion: boolean;
  small: boolean;
}) {
  const high = risk.level === 'high';
  const [entered, setEntered] = useState(reducedMotion);
  return (
    <motion.button
      type="button"
      {...bind(risk.id)}
      aria-pressed={pinned}
      aria-label={`${risk.id}: ${risk.title}. Вероятность ${risk.probability}, влияние ${risk.impact}, балл ${risk.score} — ${risk.levelLabel.toLowerCase()}`}
      data-risk-chip={risk.id}
      className={`relative z-[1] grid cursor-pointer place-items-center rounded-full border font-display leading-none transition-[background-color,color,box-shadow,border-color] duration-300 ${
        small ? 'h-[26px] min-w-[30px] px-[5px] text-[11.5px]' : 'h-[clamp(24px,calc(var(--u)*2),38px)] min-w-[clamp(32px,calc(var(--u)*2.6),48px)] px-[6px] text-[length:var(--fs-micro)]'
      } ${
        active
          ? 'border-white bg-white text-primary shadow-[0_0_20px_rgba(142,180,255,0.95)]'
          : high
            ? 'border-[rgba(220,231,255,0.7)] bg-[linear-gradient(135deg,#2593FA,#2550FA)] text-white shadow-[0_6px_18px_-6px_rgba(37,80,250,0.9)]'
            : 'border-[rgba(142,180,255,0.55)] bg-[rgba(10,16,32,0.85)] text-ice hover:border-[rgba(220,231,255,0.9)]'
      }`}
      initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
      animate={show ? { scale: active ? 1.12 : 1, opacity: 1 } : undefined}
      whileHover={reducedMotion ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24, delay: entered ? 0 : 0.45 + risk.rank * 0.08 }}
      onAnimationComplete={() => setEntered(true)}
    >
      {risk.id}
    </motion.button>
  );
}
