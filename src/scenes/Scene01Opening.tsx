import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { SceneFrame, Reveal, useScene } from '@/components/scene';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useFinePointer, useIsCompact } from '@/hooks/useMediaQuery';
import { MaskLine } from './s01/MaskLine';

/**
 * 01 · Opening — кинематографичная обложка. За контентом — 3D-стадион в фирменном свете
 * (нижняя средняя часть кадра), поэтому титр стоит сверху, а сведения о работе — внизу.
 */
export default function Scene01Opening() {
  const compact = useIsCompact();
  return (
    <SceneFrame justify="between" maxWidth={1440}>
      <div className="flex flex-col items-center text-center">
        <Reveal delay={0} y={-12} className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[260%] w-[180%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(37,80,250,0.38),transparent)] blur-xl"
          />
          <BrandLogo size="clamp(24px, calc(var(--u) * 2.05), 40px)" tagline="Uzbekistan" />
        </Reveal>

        <h1 className="t-display mt-[var(--gap-4)] max-w-[22ch] text-balance [filter:drop-shadow(0_4px_24px_rgba(7,10,18,0.7))] sm:max-w-none">
          <MaskLine delay={0.18}>Управление персоналом</MaskLine>
          <MaskLine delay={0.32} className="text-gradient">
            FootureX Uzbekistan
          </MaskLine>
        </h1>

        <SweepLine delay={0.6} />

        <Reveal delay={0.62} y={12}>
          <p className="t-h3 font-medium text-pretty text-ice/90 [text-shadow:0_2px_16px_rgba(7,10,18,0.95)]">
            От IT-стартапа к футбольной и городской экосистеме
          </p>
        </Reveal>
      </div>

      {/* Свободная середина кадра — стадион остаётся главным фоном обложки. */}
      <div
        aria-hidden
        className={`flex-1 ${compact ? 'min-h-[clamp(32px,8vh,96px)]' : 'min-h-[clamp(120px,22vh,320px)]'}`}
      />

      <div className="flex flex-col items-center gap-[var(--gap-3)]">
        <Reveal delay={1.0} y={8}>
          <StartHint />
        </Reveal>
        <Reveal delay={0.82} y={18} className="w-full">
          <MetaStrip />
        </Reveal>
      </div>
    </SceneFrame>
  );
}

/** Тонкая световая линия под титром, раскрывающаяся от центра. */
function SweepLine({ delay }: { delay: number }) {
  const { active, enterDelay, reducedMotion } = useScene();
  return (
    <motion.span
      aria-hidden
      className="my-[var(--gap-3)] block h-px w-[min(520px,70%)] bg-gradient-to-r from-transparent via-secondary to-transparent shadow-[0_0_12px_rgba(37,147,250,0.8)]"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleX: 0 }}
      animate={active ? { opacity: 1, scaleX: 1 } : undefined}
      transition={reducedMotion ? { duration: 0.2 } : { duration: 1.2, delay: enterDelay + delay, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}

function StartHint() {
  const finePointer = useFinePointer();
  return (
    <p className="t-micro flex items-center gap-2 text-mute">
      {finePointer ? (
        <>
          Нажмите <Key>→</Key> или <Key>Пробел</Key>, чтобы начать
        </>
      ) : (
        <>Проведите влево, чтобы начать</>
      )}
    </p>
  );
}

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.9em] items-center justify-center rounded-md border border-highlight/25 bg-white/[0.04] px-1.5 py-0.5 font-sans text-[1em] leading-none text-soft">
      {children}
    </kbd>
  );
}

interface MetaItem {
  label: string;
  value: string;
  sub: string;
}

const META: readonly MetaItem[] = [
  { label: 'Студент', value: 'Зафарбек Якубов', sub: 'Группа RB 25-01' },
  { label: 'Преподаватель', value: 'Парвиз Мамедов', sub: 'Дисциплина «Управление персоналом»' },
  {
    label: 'Университет · TIUE',
    value: 'Tashkent International University of Education',
    sub: 'Ташкент, 2026',
  },
];

/** Сведения о работе: стеклянная полоса из трёх колонок (на телефоне — компактная сетка). */
const CELL_CLASSES = [
  'border-r border-white/[0.07] md:border-r-0',
  'md:border-l md:border-white/[0.07]',
  'col-span-2 border-t border-white/[0.07] md:col-span-1 md:border-t-0 md:border-l',
] as const;

function MetaStrip() {
  return (
    <dl className="glass relative mx-auto grid w-full max-w-[1180px] grid-cols-2 overflow-hidden rounded-[var(--radius-lg)] md:flex">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[12%] top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent"
      />
      {META.map((item, i) => (
        <div
          key={item.label}
          className={`flex min-w-0 flex-col gap-0.5 px-[var(--gap-3)] py-[var(--gap-2)] text-center md:flex-auto md:px-[var(--gap-4)] md:py-[var(--gap-3)] ${CELL_CLASSES[i]}`}
        >
          <dt className="t-eyebrow tracking-[0.12em] text-highlight/80 md:tracking-[0.22em]">{item.label}</dt>
          <dd className="t-small mt-1 font-semibold text-white">{item.value}</dd>
          <dd className="t-micro text-soft">{item.sub}</dd>
        </div>
      ))}
    </dl>
  );
}
