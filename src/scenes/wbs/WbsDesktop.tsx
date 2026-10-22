import { Fragment, memo } from 'react';
import { motion } from 'motion/react';
import { Reveal, useScene } from '@/components/scene';
import { CountUp, Glass } from '@/components/ui';
import { PROJECT, WORK_PACKAGES, type DeliverableId } from '@/data/project';
import { EASE, fmtNum, plural, useHoverSelect } from '../charter/kit';
import { CapacityBar, CriticalLegend, CriticalMark, OptionalPackageCard, SegmentBar } from './WbsParts';
import {
  DELIVERABLE_VIEWS,
  FOOTNOTE,
  MAX_DELIVERABLE,
  MAX_PACKAGE,
  PACKAGE_FORMS,
  RESULT_FORMS,
  WBS_TOTAL,
  fmtSprints,
} from './wbsData';

type Bind = ReturnType<typeof useHoverSelect<string>>['bind'];

/** Ключ выбора: «d:результат» или «p:пакет». */
function parseKey(key: string | null): { deliverable: DeliverableId | null; pkg: string | null } {
  if (!key) return { deliverable: null, pkg: null };
  const [kind, id] = key.split(':');
  if (kind === 'd') return { deliverable: id as DeliverableId, pkg: null };
  const p = WORK_PACKAGES.find((x) => x.id === id);
  return { deliverable: p?.deliverable ?? null, pkg: id };
}

const TotalCount = memo(function TotalCount() {
  return <CountUp to={WBS_TOTAL} className="t-stat text-gradient" />;
});

/* ------------------------------------------------------------------
   Слева: дерево «проект → результаты» с полосами пакетов и ёмкостью.
   ------------------------------------------------------------------ */

function WbsTree({ activeKey, bind }: { activeKey: string | null; bind: Bind }) {
  const { deliverable: aDel, pkg: aPkg } = parseKey(activeKey);
  return (
    <Glass strong className="flex h-full flex-col p-[var(--gap-3)]">
      {/* Корень WBS. */}
      <div className="flex items-end justify-between gap-[var(--gap-2)]">
        <div className="min-w-0">
          <span className="inline-block rounded-full border border-secondary/50 bg-primary/25 px-3 py-1 font-display text-[length:var(--fs-small)] leading-none text-white">
            {PROJECT.code}
          </span>
          <p className="t-small mt-[var(--gap-1)] leading-snug text-soft">
            {DELIVERABLE_VIEWS.length} {plural(DELIVERABLE_VIEWS.length, RESULT_FORMS)} · {WORK_PACKAGES.length}{' '}
            {plural(WORK_PACKAGES.length, PACKAGE_FORMS)}
          </p>
        </div>
        <p className="flex shrink-0 items-baseline gap-2">
          <TotalCount />
          <span className="t-small text-highlight">ид</span>
        </p>
      </div>

      {/* Результаты: ветви дерева. */}
      <ul className="relative mt-[var(--gap-2)] flex flex-col gap-[calc(var(--gap-1)*0.9)] pl-[22px]" aria-label="Результаты WBS">
        <span
          aria-hidden
          className="absolute top-0 bottom-[calc(var(--gap-3)*1.1)] left-[7px] w-px bg-gradient-to-b from-secondary/80 to-secondary/25"
        />
        {DELIVERABLE_VIEWS.map((d, i) => {
          const on = aDel === d.id;
          const dim = aDel !== null && !on;
          return (
            <li key={d.id} className="relative">
              <span aria-hidden className="absolute top-[1.05em] -left-[15px] h-px w-[13px] bg-secondary/55" />
              <button
                type="button"
                {...bind(`d:${d.id}`)}
                aria-pressed={on && aPkg === null}
                aria-label={`${d.code}. ${d.title}: ${fmtNum(d.estimate)} ид, ${d.sharePct}% работ`}
                className={`w-full cursor-pointer rounded-[12px] border px-[var(--gap-2)] py-[calc(var(--gap-1)*0.9)] text-left transition-[transform,background-color,border-color,opacity] duration-300 hover:-translate-y-0.5 ${
                  on ? 'border-secondary/50 bg-primary/20' : 'border-transparent hover:bg-white/[0.035]'
                } ${dim ? 'opacity-55' : ''}`}
              >
                <span className="flex items-baseline gap-[var(--gap-1)]">
                  <span className="font-display text-[length:var(--fs-small)] leading-none" style={{ color: d.color }}>
                    {d.code}
                  </span>
                  <span className="t-small min-w-0 flex-1 truncate font-semibold text-white">{d.title}</span>
                  <span className="t-small shrink-0 font-semibold text-white t-num">{fmtNum(d.estimate)} ид</span>
                  <span className="t-small w-[2.6em] shrink-0 text-right text-highlight t-num">{d.sharePct}%</span>
                </span>
                <SegmentBar
                  className="mt-[calc(var(--gap-1)*0.8)]"
                  deliverable={d}
                  widthPct={(d.estimate / MAX_DELIVERABLE) * 100}
                  activePackage={aPkg}
                  dim={false}
                  delay={0.25 + i * 0.1}
                />
              </button>
            </li>
          );
        })}
        <li className="relative">
          <span aria-hidden className="absolute top-[1.05em] -left-[15px] w-[13px] border-t border-dashed border-highlight/50" />
          <OptionalPackageCard />
        </li>
      </ul>

      <CapacityBar className="mt-auto pt-[var(--gap-3)]" activeDeliverable={aDel} />
    </Glass>
  );
}

/* ------------------------------------------------------------------
   Справа: пакеты работ, сгруппированные по результатам.
   ------------------------------------------------------------------ */

function WbsTable({ activeKey, bind }: { activeKey: string | null; bind: Bind }) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  const { deliverable: aDel, pkg: aPkg } = parseKey(activeKey);
  const cell = 'px-[var(--gap-1)] py-[calc(var(--u)*0.3)]';
  let rowIndex = 0;

  return (
    <Glass strong className="h-full p-[var(--gap-3)] pt-[var(--gap-2)]">
      <table
        data-interactive
        className="w-full table-fixed border-collapse"
        aria-label="Пакеты работ WBS: код, название, оценка в идеальных человеко-днях и спринты"
      >
        <colgroup>
          <col style={{ width: '22%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '42%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '14%' }} />
        </colgroup>
        <thead>
          <tr className="t-small text-mute">
            <th scope="col" className={`${cell} text-left align-bottom font-medium`}>
              Результат
            </th>
            <th scope="col" className={`${cell} text-left align-bottom font-medium`}>
              Код
            </th>
            <th scope="col" className={`${cell} text-left align-bottom font-medium`}>
              Пакет работ
            </th>
            <th scope="col" className={`${cell} text-right align-bottom font-medium whitespace-nowrap`}>
              Оценка, ид
            </th>
            <th scope="col" className={`${cell} text-right align-bottom font-medium`}>
              Спринты
            </th>
          </tr>
        </thead>
        <tbody>
          {DELIVERABLE_VIEWS.map((d) => {
            const delOn = aDel === d.id;
            const dHandlers = bind(`d:${d.id}`);
            return (
              <Fragment key={d.id}>
                {d.packages.map((p, j) => {
                  const i = rowIndex++;
                  const pOn = aPkg === p.id;
                  const dim = aDel !== null && !delOn;
                  const h = bind(`p:${p.id}`);
                  return (
                    <motion.tr
                      key={p.id}
                      onPointerEnter={h.onPointerEnter}
                      onPointerLeave={h.onPointerLeave}
                      onClick={h.onClick}
                      initial={reducedMotion ? false : { opacity: 0, x: -10 }}
                      animate={show ? { opacity: 1, x: 0 } : undefined}
                      transition={{ duration: 0.45, delay: 0.1 + i * 0.035, ease: EASE }}
                      className={`t-small cursor-pointer transition-colors duration-300 ${j === 0 ? 'border-t border-white/10' : ''} ${
                        pOn ? 'bg-primary/30 text-white' : delOn ? 'bg-primary/[0.13] text-white' : dim ? 'text-mute' : 'text-ice'
                      }`}
                    >
                      {j === 0 ? (
                        <th
                          scope="rowgroup"
                          rowSpan={d.packages.length}
                          className={`${cell} relative bg-[rgba(7,10,18,0.25)] pl-[calc(var(--gap-1)+6px)] text-left align-top font-normal`}
                        >
                          <span
                            aria-hidden
                            className="absolute top-[5px] bottom-[5px] left-0 w-[3px] rounded-full transition-opacity duration-300"
                            style={{ background: d.color, opacity: dim ? 0.35 : 1 }}
                          />
                          <button
                            type="button"
                            onPointerEnter={dHandlers.onPointerEnter}
                            onPointerLeave={dHandlers.onPointerLeave}
                            onFocus={dHandlers.onFocus}
                            onBlur={dHandlers.onBlur}
                            onClick={(e) => {
                              e.stopPropagation();
                              dHandlers.onClick();
                            }}
                            aria-pressed={delOn && aPkg === null}
                            className={`t-micro -mx-1 cursor-pointer rounded-md px-1 text-left font-semibold leading-snug transition-colors ${
                              delOn ? 'text-white' : dim ? 'text-mute' : 'text-soft'
                            }`}
                          >
                            <span className="font-display" style={{ color: dim ? undefined : d.color }}>
                              {d.code}
                            </span>{' '}
                            {d.title}
                          </button>
                        </th>
                      ) : null}
                      <td className={`${cell} font-display text-[length:var(--fs-micro)] t-num ${pOn || delOn ? 'text-white' : 'text-highlight'}`}>
                        {p.code}
                      </td>
                      <td className={`${cell} leading-snug`}>
                        <button
                          type="button"
                          onFocus={h.onFocus}
                          onBlur={h.onBlur}
                          onClick={(e) => {
                            e.stopPropagation();
                            h.onClick();
                          }}
                          aria-pressed={pOn}
                          aria-label={`${p.code} ${p.title}: ${p.detail}. ${fmtNum(p.estimate)} ид, спринты ${fmtSprints(p.sprints)}${
                            p.critical ? ', критический путь' : ''
                          }`}
                          className="flex w-full cursor-pointer items-center gap-[0.55em] rounded-md text-left"
                        >
                          <span className="min-w-0 truncate">{p.title}</span>
                          {p.critical ? <CriticalMark /> : null}
                        </button>
                      </td>
                      <td className={`${cell} text-right whitespace-nowrap`}>
                        <span className="inline-flex items-center justify-end gap-[0.5em]">
                          <span aria-hidden className="inline-block h-[5px] w-[2.6em] overflow-hidden rounded-full bg-white/[0.06]">
                            <span
                              className="block h-full rounded-full transition-opacity duration-300"
                              style={{ width: `${(p.estimate / MAX_PACKAGE) * 100}%`, background: d.color, opacity: dim ? 0.4 : 1 }}
                            />
                          </span>
                          <span className={`font-semibold t-num ${pOn ? 'text-white' : ''}`}>{fmtNum(p.estimate)}</span>
                        </span>
                      </td>
                      <td className={`${cell} text-right whitespace-nowrap t-num ${pOn ? 'text-white' : dim ? '' : 'text-soft'}`}>
                        {fmtSprints(p.sprints)}
                      </td>
                    </motion.tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="t-small border-t border-secondary/50 text-white">
            <th scope="row" colSpan={3} className={`${cell} pt-[var(--gap-1)] text-left font-semibold`}>
              Итого · {WORK_PACKAGES.length} {plural(WORK_PACKAGES.length, PACKAGE_FORMS)}
              <span className="t-micro ml-[var(--gap-2)] font-normal text-mute">
                <CriticalLegend />
              </span>
            </th>
            <td className={`${cell} pt-[var(--gap-1)] text-right`}>
              <span className="font-display text-[length:var(--fs-h3)] leading-none t-num">
                <span className="text-brand-gradient">{fmtNum(WBS_TOTAL)}</span>
              </span>
            </td>
            <td className={`${cell} pt-[var(--gap-1)] text-right text-soft t-num`}>1–{PROJECT.sprints}</td>
          </tr>
        </tfoot>
      </table>
    </Glass>
  );
}

export function WbsDesktop() {
  const { active, bind } = useHoverSelect<string>(null, { toggle: true });
  return (
    <>
      <div className="mt-[var(--gap-3)] grid items-stretch gap-[var(--gap-3)]" style={{ gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)' }}>
        <Reveal delay={0.18} className="min-w-0">
          <WbsTree activeKey={active} bind={bind} />
        </Reveal>
        <Reveal delay={0.28} className="min-w-0">
          <WbsTable activeKey={active} bind={bind} />
        </Reveal>
      </div>
      <Reveal delay={0.42}>
        <p className="t-micro mt-[var(--gap-2)] text-mute">{FOOTNOTE}.</p>
      </Reveal>
    </>
  );
}
