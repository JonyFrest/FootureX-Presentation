import { Reveal, SceneFrame, SceneHeader } from '@/components/scene';
import { Glass } from '@/components/ui';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { RiskDetail, RiskDetailBody } from './risks/RiskDetail';
import { RiskMatrix } from './risks/RiskMatrix';
import { LevelTag, RiskRegister } from './risks/RiskRegister';
import { REGISTER } from './risks/riskData';
import { useHoverSelect } from './schedule/shared';

const TITLE = 'Управление рисками';
const LEAD = 'Экспертная оценка проекта (план): вероятность × влияние по шкале 1–5';

/** 13 · Risk Management: тепловая карта 5×5, ранжированный реестр и карточка меры реагирования. */
export default function Scene13Risks() {
  const compact = useIsCompact();
  const sel = useHoverSelect<string>(REGISTER[0].id, { toggle: false });

  if (compact) {
    return (
      <SceneFrame justify="start">
        <SceneHeader title={TITLE} lead={LEAD} />
        <div className="mt-3 grid gap-3 landscape:grid-cols-[minmax(0,300px)_minmax(0,1fr)] landscape:items-start">
          <Reveal delay={0.15}>
            <Glass strong className="p-3">
              <RiskMatrix active={sel.active} pinned={sel.pinned} bind={sel.bind} small />
            </Glass>
          </Reveal>
          <ol className="flex flex-col gap-2 pb-2">
            {REGISTER.map((r, i) => {
              const open = sel.pinned === r.id;
              return (
                <Reveal as="li" key={r.id} delay={0.2 + i * 0.04}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => sel.select(r.id)}
                    data-risk-card={r.id}
                    className={`glass w-full cursor-pointer p-3 text-left transition-[border-color,box-shadow] duration-300 ${
                      open ? 'border-[rgba(37,147,250,0.6)]! shadow-[var(--glow-blue)]' : ''
                    }`}
                  >
                    <span className="flex items-start gap-2">
                      <span
                        className={`t-micro mt-[1px] grid h-[22px] min-w-[34px] place-items-center rounded-full border font-display leading-none ${
                          open ? 'border-white bg-white text-primary' : 'border-[rgba(142,180,255,0.45)] text-ice'
                        }`}
                      >
                        {r.id}
                      </span>
                      <span className="t-small min-w-0 flex-1 font-semibold leading-snug text-white">{r.title}</span>
                      <LevelTag risk={r} />
                    </span>
                    {open ? (
                      <span className="mt-2 block border-t border-[rgba(142,180,255,0.15)] pt-2">
                        <RiskDetailBody risk={r} compact />
                      </span>
                    ) : null}
                  </button>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </SceneFrame>
    );
  }

  return (
    <SceneFrame justify="center">
      <SceneHeader title={TITLE} lead={LEAD} />
      <div className="mt-[var(--gap-3)] grid items-stretch gap-[var(--gap-3)]" style={{ gridTemplateColumns: 'auto minmax(0, 1fr)' }}>
        <Reveal delay={0.2}>
          <Glass strong className="h-full p-[var(--gap-3)]">
            <div style={{ width: 'clamp(300px, calc(var(--u) * 27), 520px)' }}>
              <RiskMatrix active={sel.active} pinned={sel.pinned} bind={sel.bind} />
            </div>
          </Glass>
        </Reveal>
        <div className="flex min-w-0 flex-col gap-[var(--gap-3)]">
          <Reveal delay={0.25}>
            <Glass strong className="px-[var(--gap-2)] py-[var(--gap-2)]">
              <RiskRegister active={sel.active} pinned={sel.pinned} bind={sel.bind} />
            </Glass>
          </Reveal>
          <Reveal delay={0.35} className="flex-1">
            <RiskDetail riskId={sel.active} className="h-full" />
          </Reveal>
        </div>
      </div>
    </SceneFrame>
  );
}
