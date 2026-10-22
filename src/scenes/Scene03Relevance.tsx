import { SceneFrame, SceneHeader, Reveal } from '@/components/scene';
import { CountUp } from '@/components/ui';
import { pad2 } from '@/data/scenes';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { RELEVANCE, RELEVANCE_TAKEAWAY, type RelevanceItem } from '@/data/relevance';
import { BarsVisual, DotMatrixVisual, GaugeVisual } from './s03/visuals';

/**
 * 03 · Relevance — три проблемы технологического стартапа, которые решает проектное управление:
 * по одной проверенной цифре на каждую (src/data/relevance.ts), и вывод для FootureX.
 */
export default function Scene03Relevance() {
  const compact = useIsCompact();
  return (
    <SceneFrame justify={compact ? 'start' : 'center'}>
      <SceneHeader
        title="Почему проектное управление критично для технологического стартапа"
        className="max-w-[min(100%,1500px)]!"
      />

      <div className={`mt-[var(--gap-3)] grid gap-[var(--gap-3)] ${compact ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {RELEVANCE.map((item, i) => (
          <Reveal key={item.id} delay={0.18 + i * 0.1} y={26} className="flex">
            <RelevanceCard item={item} index={i} compact={compact} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.55} y={14} className="mt-[var(--gap-3)]">
        <Takeaway />
      </Reveal>
    </SceneFrame>
  );
}

function fractionOf(item: RelevanceItem): number {
  // Пропорциональные визуализации — только для процентов; иное значение показывается полной шкалой.
  return item.unit === '%' ? Math.min(Math.max(item.value / 100, 0), 1) : 1;
}

function Visual({ item, delay }: { item: RelevanceItem; delay: number }) {
  if (item.visual === 'bars') {
    const rows = item.bars?.rows ?? [{ label: '', value: fractionOf(item), display: '' }];
    return <BarsVisual rows={rows} title={item.bars?.title} delay={delay} />;
  }
  const fraction = fractionOf(item);
  if (item.visual === 'gauge') return <GaugeVisual fraction={fraction} delay={delay} />;
  return <DotMatrixVisual fraction={fraction} delay={delay} />;
}

function BigNumber({ item, delay }: { item: RelevanceItem; delay: number }) {
  const percent = item.unit === '%';
  return (
    <p className="flex items-baseline gap-2 leading-none">
      {item.lead ? <span className="t-body font-medium text-soft">{item.lead}</span> : null}
      <CountUp
        to={item.value}
        decimals={item.decimals ?? 0}
        suffix={percent ? '%' : ''}
        delay={delay}
        duration={1.6}
        className="t-stat text-gradient"
      />
      {!percent && item.unit ? <span className="t-h2 text-gradient">{item.unit}</span> : null}
    </p>
  );
}

function RelevanceCard({ item, index, compact }: { item: RelevanceItem; index: number; compact: boolean }) {
  const delay = 0.15 + index * 0.2;
  const text = (
    <>
      <p className="t-small mt-[var(--gap-1)] text-pretty text-soft">{item.caption}</p>
      {item.note ? <p className="t-micro mt-[var(--gap-1)] text-pretty text-mute">{item.note}</p> : null}
    </>
  );

  return (
    <article
      className="glass relative flex w-full flex-col overflow-hidden rounded-[var(--radius-lg)] p-[var(--gap-3)]"
      aria-label={`${item.title}: ${item.statement}. Источник: ${item.source}`}
      data-verified={item.verified ? 'true' : 'false'}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 h-2/3 w-3/4 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(37,80,250,0.22),transparent)]"
      />

      <header className="relative flex items-center gap-3">
        <span className="t-micro font-display text-highlight">{pad2(index + 1)}</span>
        <span aria-hidden className="h-px w-6 bg-highlight/40" />
        <h2 className="t-h3 text-white">{item.title}</h2>
      </header>

      {compact ? (
        <>
          <div className="relative mt-[var(--gap-2)] flex items-center gap-[var(--gap-3)]">
            {item.visual === 'bars' ? null : (
              <div className="flex h-[92px] w-[112px] shrink-0 items-center justify-center">
                <Visual item={item} delay={delay} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <BigNumber item={item} delay={delay} />
              {text}
            </div>
          </div>
          {item.visual === 'bars' ? (
            <div className="relative mt-[var(--gap-2)]">
              <Visual item={item} delay={delay} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="relative mt-[var(--gap-3)] flex h-[clamp(96px,calc(var(--u)*9),184px)] items-center justify-center">
            <Visual item={item} delay={delay} />
          </div>
          <div className="relative mt-[var(--gap-3)]">
            <BigNumber item={item} delay={delay} />
            {text}
          </div>
        </>
      )}

      <div className="relative mt-auto flex flex-wrap items-center gap-2 pt-[var(--gap-2)]">
        <p className="t-micro text-mute">Источник: {item.source}</p>
        {item.verified ? null : <span className="chip chip-plan">источник проверяется</span>}
      </div>
    </article>
  );
}

function Takeaway() {
  return (
    <div className="glass-strong relative overflow-hidden rounded-[var(--radius-md)] px-[var(--gap-3)] py-[var(--gap-2)]">
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[image:var(--grad-brand)]" />
      <p className="t-body text-pretty text-ice">
        <span className="font-semibold text-highlight">{RELEVANCE_TAKEAWAY.lead}</span> {RELEVANCE_TAKEAWAY.text}
      </p>
    </div>
  );
}
