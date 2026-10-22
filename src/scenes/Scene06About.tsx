import { Fragment, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { SceneFrame, Reveal, useScene } from '@/components/scene';
import { pad2 } from '@/data/scenes';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { MaskLine } from './s01/MaskLine';
import { PILLARS, type Pillar } from './s06/pillars';

/**
 * 06 · What is FootureX — кинематографичная сцена: в центре кадра 3D-голограмма мяча
 * (её рисует 3D-мир), поэтому центр свободен: миссия — сверху слева, карточки — внизу.
 */
export default function Scene06About() {
  const compact = useIsCompact();
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const shownId = hovered ?? selected;
  const shown = PILLARS.find((p) => p.id === shownId) ?? null;

  // Сверху слева: подпись сцены, миссия и строка по-русски. Центр — 3D-мяч. Снизу — три карточки.
  const top = (
    <div className="flex flex-col items-start text-left">
      <TopLabel />
      <p className="t-h1 mt-[var(--gap-3)] font-display tracking-[0.01em]" lang="en">
        <MaskLine delay={0.16} className="text-gradient">
          Creating a Digital
        </MaskLine>
        <MaskLine delay={0.28} className="text-gradient">
          Football Era
        </MaskLine>
      </p>
      <Reveal delay={0.45} y={10}>
        <h1 className="t-body mt-[var(--gap-2)] text-soft">Цифровая футбольная экосистема из Ташкента</h1>
      </Reveal>
    </div>
  );

  const chips = (
    <Reveal delay={0.55} y={14} className="w-full">
      <div
        className={`mx-auto flex w-full max-w-[880px] ${compact ? 'flex-col items-stretch gap-[var(--gap-1)]' : 'items-center justify-center gap-[var(--gap-2)]'}`}
        role="group"
        aria-label="FootureX: игра, технологии, экосистема"
      >
        {PILLARS.map((pillar) => (
          <PillarChip
            key={pillar.id}
            pillar={pillar}
            compact={compact}
            active={shownId === pillar.id}
            selected={selected === pillar.id}
            onSelect={() => setSelected((cur) => (cur === pillar.id ? null : pillar.id))}
            onHover={setHovered}
          />
        ))}
      </div>
    </Reveal>
  );

  // Центр кадра оставлен для 3D-мяча.
  const ballSpace = <div aria-hidden className="min-h-[clamp(160px,30vh,420px)] flex-1" />;

  if (compact) {
    return (
      <SceneFrame justify="between">
        {top}
        {ballSpace}
        {chips}
      </SceneFrame>
    );
  }

  return (
    <SceneFrame justify="between">
      {top}
      {ballSpace}
      <div className="flex flex-col items-center gap-[var(--gap-3)]">
        <Reveal delay={0.5} y={8}>
          <Motif />
        </Reveal>
        {chips}
        <div
          id="s06-detail"
          className="-mt-[var(--gap-1)] flex min-h-[calc(var(--fs-body)*1.55)] w-full max-w-[1440px] items-start justify-center text-center"
          aria-live="polite"
        >
          <AnimatePresence mode="wait" initial={false}>
            {shown ? <DetailLine key={shown.id} pillar={shown} /> : null}
          </AnimatePresence>
        </div>
      </div>
    </SceneFrame>
  );
}

function TopLabel() {
  const { meta } = useScene();
  return (
    <Reveal y={10}>
      <p className="t-eyebrow flex items-center gap-3">
        <span className="inline-block h-px w-8 bg-gradient-to-r from-transparent to-secondary" aria-hidden />
        {pad2(meta.number)} · {meta.eyebrow}
      </p>
    </Reveal>
  );
}

/** Разделитель-мотив «Football × Technology». */
function Motif() {
  return (
    <p className="t-eyebrow flex items-center justify-center gap-[var(--gap-2)] text-white/90" lang="en">
      <span aria-hidden className="h-px w-[clamp(28px,calc(var(--u)*6),120px)] bg-gradient-to-r from-transparent to-highlight/60" />
      <span>Football</span>
      <span
        aria-label="и"
        className="inline-flex size-[2.1em] items-center justify-center rounded-full border border-secondary/50 text-white shadow-[0_0_16px_rgba(37,147,250,0.55)]"
      >
        ×
      </span>
      <span>Technology</span>
      <span aria-hidden className="h-px w-[clamp(28px,calc(var(--u)*6),120px)] bg-gradient-to-l from-transparent to-highlight/60" />
    </p>
  );
}

interface PillarChipProps {
  pillar: Pillar;
  compact: boolean;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
}

function PillarChip({ pillar, compact, active, selected, onSelect, onHover }: PillarChipProps) {
  const { reducedMotion } = useScene();
  const Icon = pillar.icon;
  const detailId = `s06-detail-${pillar.id}`;

  const button = (
    <button
      type="button"
      aria-pressed={selected}
      aria-expanded={compact ? selected : undefined}
      aria-controls={compact ? detailId : 's06-detail'}
      onClick={onSelect}
      onPointerEnter={(e) => !compact && e.pointerType === 'mouse' && onHover(pillar.id)}
      onPointerLeave={(e) => !compact && e.pointerType === 'mouse' && onHover(null)}
      onFocus={() => !compact && onHover(pillar.id)}
      onBlur={() => !compact && onHover(null)}
      data-active={active ? 'true' : undefined}
      className={`group flex cursor-pointer items-center gap-[var(--gap-2)] text-left ${
        compact
          ? 'w-full rounded-[var(--radius-md)] px-[var(--gap-3)] py-[var(--gap-2)]'
          : `glass glass-hover rounded-full py-[var(--gap-1)] pr-[var(--gap-3)] pl-[var(--gap-1)] ${active ? 'bg-[rgba(37,80,250,0.2)]!' : ''}`
      }`}
    >
      <span
        className={`flex size-[clamp(34px,calc(var(--u)*2.5),48px)] shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
          active ? 'bg-[image:var(--grad-brand)] text-white shadow-[0_0_20px_rgba(37,147,250,0.6)]' : 'bg-white/[0.06] text-highlight'
        }`}
        aria-hidden
      >
        <Icon className="size-[48%]" strokeWidth={1.8} />
      </span>
      <span className="t-small font-semibold text-white">{pillar.label}</span>
      {compact ? (
        <span
          aria-hidden
          className={`ml-auto text-highlight transition-transform duration-300 ${selected ? 'rotate-45' : ''}`}
        >
          +
        </span>
      ) : null}
    </button>
  );

  if (!compact) return button;

  return (
    <div
      className={`glass glass-hover flex flex-col rounded-[var(--radius-md)] ${selected ? 'bg-[rgba(14,22,41,0.82)]!' : ''}`}
      data-active={selected ? 'true' : undefined}
    >
      {button}
      <AnimatePresence initial={false}>
        {selected ? (
          <motion.div
            id={detailId}
            key="d"
            className="overflow-hidden"
            initial={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.12 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="border-t border-white/10 px-[var(--gap-3)] pt-[var(--gap-2)] pb-[var(--gap-2)] text-left">
              <PillarText pillar={pillar} small />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PillarText({ pillar, small = false }: { pillar: Pillar; small?: boolean }) {
  const size = small ? 't-small' : 't-body';
  if (pillar.steps) {
    return (
      <span className={`${size} inline-flex flex-wrap items-center gap-x-[var(--gap-2)] gap-y-1 text-ice ${small ? '' : 'justify-center'}`}>
        <span className="sr-only">{pillar.line}</span>
        {pillar.steps.map((step, i) => (
          <Fragment key={step}>
            {i > 0 ? <ArrowRight aria-hidden className="size-[1em] text-secondary" /> : null}
            <span aria-hidden className={i === 0 ? 'font-semibold text-white' : ''}>
              {step}
            </span>
          </Fragment>
        ))}
      </span>
    );
  }
  return <span className={`${size} text-pretty text-ice`}>{pillar.line}</span>;
}

function DetailLine({ pillar }: { pillar: Pillar }) {
  const { reducedMotion } = useScene();
  return (
    <motion.p
      className="flex items-start justify-center"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: 'blur(4px)' }}
      transition={{ duration: reducedMotion ? 0.12 : 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <PillarText pillar={pillar} />
    </motion.p>
  );
}
