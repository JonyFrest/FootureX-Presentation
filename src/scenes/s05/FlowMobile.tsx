import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChartLine, CornerLeftUp } from 'lucide-react';
import { OUTPUT_ICONS } from './FlowDiagram';
import {
  CASCADE,
  COLUMNS,
  INPUTS,
  LOOP_LABEL,
  METHOD_NOTE,
  OUTPUTS,
  SCRUM,
  SPRINTS,
  SPRINTS_BADGE,
  highlightedEdges,
  highlightedNodes,
  type NodeKey,
} from './model';

/** Телефон: вертикальный поток. Тап по узлу подсвечивает его связи в соседних блоках (тот же граф, что на десктопе). */
export function FlowMobile({ reducedMotion }: { reducedMotion: boolean }) {
  const [sel, setSel] = useState<NodeKey | null>(null);
  const lit = useMemo(() => highlightedNodes(highlightedEdges(sel), sel), [sel]);
  const state = (key: NodeKey) => (lit ? (lit.has(key) ? 'on' : 'off') : 'idle');
  const toggle = (key: NodeKey) => setSel((cur) => (cur === key ? null : key));
  const [cIn, cSt, cSc, cOut] = COLUMNS;

  const btn = (key: NodeKey) => {
    const st = state(key);
    return {
      type: 'button' as const,
      'aria-pressed': sel === key,
      onClick: () => toggle(key),
      className: `cursor-pointer rounded-[12px] border text-left transition-[transform,border-color,background-color,opacity] duration-300 hover:-translate-y-0.5 ${
        st === 'on' ? 'border-secondary/80 bg-[rgba(18,34,82,0.88)]' : 'border-white/10 bg-[rgba(10,16,32,0.78)]'
      } ${st === 'off' ? 'opacity-45' : ''}`,
    };
  };

  return (
    <div className="flex flex-col">
      <Section n={cIn.n} en={cIn.en} ru={cIn.ru}>
        <div className="grid grid-cols-2 gap-2">
          {INPUTS.map((n) => {
            const Icon = n.icon;
            const b = btn(`in:${n.id}`);
            return (
              <button key={n.id} {...b} className={`${b.className} flex items-center gap-2 px-3 py-2`}>
                {Icon ? <Icon className="size-4 shrink-0 text-secondary" aria-hidden strokeWidth={1.8} /> : null}
                <span className="t-small font-medium leading-tight text-white">{n.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Connector reducedMotion={reducedMotion} />

      <Section n={cSt.n} en={cSt.en} ru={cSt.ru}>
        <ol className="flex flex-col">
          {CASCADE.map((n, i) => {
            const b = btn(`st:${n.id}`);
            return (
              <li key={n.id} className="flex flex-col" style={{ paddingLeft: `${i * 7}%` }}>
                {i > 0 ? (
                  <span aria-hidden className="relative ml-5 flex h-5 w-px items-center bg-highlight/50">
                    <span className="absolute left-1/2 size-2 -translate-x-1/2 rotate-45 border border-highlight bg-deep" />
                  </span>
                ) : null}
                <button {...b} className={`${b.className} relative flex flex-col py-2 pl-4 pr-3`}>
                  <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[image:var(--grad-brand)]" />
                  <span className="t-small font-semibold leading-tight text-white">{n.label}</span>
                  {n.sub ? <span className="t-micro text-highlight/85">{n.sub}</span> : null}
                </button>
              </li>
            );
          })}
        </ol>
      </Section>

      <Connector reducedMotion={reducedMotion} />

      <Section n={cSc.n} en={cSc.en} ru={cSc.ru} focal>
        <div className="glass-strong p-2" style={{ borderColor: 'rgba(37,147,250,0.55)' }}>
          {/* 2×2 по часовой стрелке со стрелками в зазорах и числом повторов в центре */}
          <div className="relative grid auto-rows-fr grid-cols-2 gap-7 [--g:28px]">
            {SCRUM.map((n, i) => {
              const b = btn(`sc:${n.id}`);
              const area = ['1 / 1', '1 / 2', '2 / 2', '2 / 1'][i];
              return (
                <button key={n.id} {...b} style={{ gridArea: area }} className={`${b.className} flex flex-col justify-center px-3 py-2`}>
                  <span className="t-micro font-display text-highlight">{String(i + 1).padStart(2, '0')}</span>
                  <span className="t-small font-semibold leading-tight text-white">{n.label}</span>
                </button>
              );
            })}
            <CycleArrow pos="top">
              <ArrowRight />
            </CycleArrow>
            <CycleArrow pos="right">
              <ArrowDown />
            </CycleArrow>
            <CycleArrow pos="bottom">
              <ArrowLeft />
            </CycleArrow>
            <CycleArrow pos="left">
              <ArrowUp />
            </CycleArrow>
            <span
              role="img"
              aria-label={SPRINTS_BADGE}
              className="pointer-events-none absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-secondary/60 bg-[rgba(14,22,41,0.95)] shadow-[0_0_20px_-4px_rgba(37,147,250,0.75)]"
            >
              <span className="t-small font-display leading-none text-white" aria-hidden>
                ×{SPRINTS}
              </span>
            </span>
          </div>
        </div>
      </Section>

      <Connector reducedMotion={reducedMotion} />

      <Section n={cOut.n} en={cOut.en} ru={cOut.ru}>
        <ol className="flex flex-col">
          {OUTPUTS.map((n, i) => {
            const Icon = OUTPUT_ICONS[n.id];
            const b = btn(`out:${n.id}`);
            return (
              <li key={n.id} className="flex flex-col">
                {i > 0 ? <ArrowDown className="mx-auto my-1 size-4 text-highlight/70" aria-hidden /> : null}
                <button {...b} className={`${b.className} flex items-center gap-2 px-3 py-2`}>
                  {Icon ? <Icon className="size-4 shrink-0 text-secondary" aria-hidden strokeWidth={1.8} /> : null}
                  <span className="t-small font-medium leading-tight text-white">{n.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </Section>

      <button
        type="button"
        aria-pressed={sel === 'loop'}
        onClick={() => toggle('loop')}
        className={`mt-3 flex cursor-pointer items-center gap-3 rounded-[14px] border border-dashed px-3 py-2.5 text-left transition-[border-color,background-color] duration-300 ${
          state('loop') === 'on' ? 'border-secondary/80 bg-[rgba(37,80,250,0.2)]' : 'border-highlight/35'
        }`}
      >
        <CornerLeftUp className="size-5 shrink-0 text-secondary" aria-hidden />
        <span className="t-small text-ice">
          <ChartLine className="mr-1 inline size-4 align-[-2px] text-secondary" aria-hidden />
          <span className="font-semibold text-white">Обратная связь:</span> {LOOP_LABEL}
        </span>
      </button>
      <p className="t-micro mt-2 text-mute">{METHOD_NOTE}</p>
    </div>
  );
}

function Section({ n, en, ru, focal = false, children }: { n: string; en: string; ru: string; focal?: boolean; children: ReactNode }) {
  return (
    <section>
      <p className="t-micro font-display uppercase tracking-[0.16em] text-highlight">
        <span className="text-white">{n}</span> · {en}
      </p>
      <h2 className={`t-h3 mb-2 ${focal ? 'text-gradient' : ''}`}>{ru}</h2>
      {children}
    </section>
  );
}

/** Стрелка Scrum-цикла в зазоре сетки 2×2 (--g — ширина зазора). */
function CycleArrow({ pos, children }: { pos: 'top' | 'right' | 'bottom' | 'left'; children: ReactNode }) {
  const style =
    pos === 'top'
      ? { left: '50%', top: 'calc((100% - var(--g)) / 4)' }
      : pos === 'bottom'
        ? { left: '50%', top: 'calc(100% - (100% - var(--g)) / 4)' }
        : pos === 'right'
          ? { left: 'calc(100% - (100% - var(--g)) / 4)', top: '50%' }
          : { left: 'calc((100% - var(--g)) / 4)', top: '50%' };
  return (
    <span aria-hidden className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-highlight [&>svg]:size-4" style={style}>
      {children}
    </span>
  );
}

function Connector({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="relative flex h-9 items-center justify-center" aria-hidden>
      <span className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-secondary/0 via-secondary/80 to-secondary/0" />
      {!reducedMotion ? (
        <span className="fx-s05-dot absolute left-1/2 top-1 size-1.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_8px_2px_rgba(37,147,250,0.8)]" />
      ) : null}
      <ArrowDown className="relative size-4 text-highlight" />
      <style>{`@keyframes fx-s05-fall{0%{top:4px;opacity:0}20%{opacity:1}80%{opacity:1}100%{top:calc(100% - 8px);opacity:0}}.fx-s05-dot{animation:fx-s05-fall 1.8s ease-in-out infinite}`}</style>
    </div>
  );
}
