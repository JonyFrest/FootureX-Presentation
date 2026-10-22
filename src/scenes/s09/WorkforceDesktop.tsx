import { Fragment } from 'react';
import { motion } from 'motion/react';
import { Reveal, useScene } from '@/components/scene';
import { Glass } from '@/components/ui';
import { positionMonthly, type DepartmentId } from '@/data/hr';
import { EMPLOYEE_FORMS, fmtNum, plural, POSITION_FORMS, UNIT_FORMS, useHoverSelect } from '../s08/shared';
import { FOOTNOTE, HeadcountCount, Person } from './parts';
import { groupFigures, STAFF_FUND, STAFF_GROUPS, STAFF_HEADCOUNT, STAFF_POSITIONS } from './workforceData';

type Bind = ReturnType<typeof useHoverSelect<DepartmentId>>['bind'];

/* ------------------------------------------------------------------
   Слева: численность по подразделениям — «люди», сгруппированные по отделам.
   ------------------------------------------------------------------ */

function HeadcountPanel({ active, bind }: { active: DepartmentId | null; bind: Bind }) {
  let figureIndex = 0;
  return (
    <Glass strong className="flex h-full flex-col p-[var(--gap-3)]">
      <div className="flex flex-wrap items-end justify-between gap-x-[var(--gap-3)] gap-y-[var(--gap-1)]">
        <div className="flex items-baseline gap-[var(--gap-2)]">
          <HeadcountCount />
          <span className="t-h3 text-white">{plural(STAFF_HEADCOUNT, EMPLOYEE_FORMS)}</span>
        </div>
        <span className="chip chip-plan mb-1">проект штатного расписания</span>
      </div>
      <p className="t-small mt-[var(--gap-1)] text-soft">
        {STAFF_GROUPS.length} {plural(STAFF_GROUPS.length, UNIT_FORMS)} · {STAFF_POSITIONS}{' '}
          {plural(STAFF_POSITIONS, POSITION_FORMS)}
      </p>

      <div className="hairline my-[var(--gap-2)]" aria-hidden />

      <ul className="flex flex-1 flex-col justify-between gap-[calc(var(--gap-1)*0.5)]" aria-label="Численность по подразделениям">
        {STAFF_GROUPS.map((g) => {
          const on = active === g.id;
          const dim = active !== null && !on;
          const figures = groupFigures(g);
          return (
            <li key={g.id}>
              <button
                type="button"
                {...bind(g.id)}
                aria-pressed={on}
                aria-label={`${g.name}: ${g.headcount} ${plural(g.headcount, EMPLOYEE_FORMS)}, окладный фонд ${fmtNum(g.monthly)} млн сум в месяц`}
                className={`grid w-full cursor-pointer items-center gap-x-[var(--gap-2)] rounded-[12px] border px-[var(--gap-2)] py-[calc(var(--gap-1)*0.8)] text-left transition-[transform,background-color,border-color] duration-300 hover:-translate-y-0.5 ${
                  on ? 'border-secondary/50 bg-primary/20' : 'border-transparent hover:bg-white/[0.03]'
                }`}
                style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr) auto' }}
              >
                <span className="min-w-0">
                  <span className={`t-small block truncate font-semibold transition-colors ${dim ? 'text-mute' : 'text-white'}`}>
                    {g.name}
                  </span>
                  <span className="t-micro block text-mute t-num">фонд {fmtNum(g.monthly)} млн</span>
                </span>
                <span className="flex flex-wrap items-end gap-[calc(var(--gap-1)*0.55)]">
                  {figures.map((f) => (
                    <Person
                      key={f.key}
                      head={f.head}
                      on={on}
                      dim={dim}
                      index={figureIndex++}
                      className="h-[clamp(18px,calc(var(--u)*1.75),32px)] w-auto"
                    />
                  ))}
                </span>
                <span className="text-right whitespace-nowrap">
                  <span className={`font-display text-[length:var(--fs-h3)] leading-none t-num ${dim ? 'text-mute' : 'text-white'}`}>
                    {g.headcount}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="t-micro mt-[var(--gap-2)] flex flex-wrap items-center gap-x-[var(--gap-3)] gap-y-1 text-mute">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-secondary" aria-hidden /> руководитель направления
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-highlight" aria-hidden /> сотрудник
        </span>
      </div>
    </Glass>
  );
}

/* ------------------------------------------------------------------
   Справа: компактная таблица штатного расписания.
   ------------------------------------------------------------------ */

function StaffTable({ active, bind }: { active: DepartmentId | null; bind: Bind }) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  let rowIndex = 0;
  const cell = 'px-[var(--gap-1)] py-[calc(var(--u)*0.32)]';
  const num = `${cell} text-right t-num whitespace-nowrap`;

  return (
    <Glass strong className="h-full p-[var(--gap-3)] pt-[var(--gap-2)]">
      <table
        className="w-full table-fixed border-collapse t-small"
        data-interactive
        aria-label="Штатное расписание этапа 1: подразделение, должность, количество, оклад и фонд, млн сум в месяц"
      >
        <colgroup>
          <col style={{ width: '26%' }} />
          <col style={{ width: '39%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '12.5%' }} />
          <col style={{ width: '13.5%' }} />
        </colgroup>
        <thead>
          <tr className="t-micro text-mute">
            <th scope="col" className={`${cell} text-left align-bottom font-medium`}>Подразделение</th>
            <th scope="col" className={`${cell} text-left align-bottom font-medium`}>Должность</th>
            <th scope="col" className={`${cell} text-right align-bottom font-medium`}>Кол-во</th>
            <th scope="col" className={`${cell} text-right align-bottom font-medium leading-tight`}>
              Оклад,
              <br />
              млн сум
            </th>
            <th scope="col" className={`${cell} text-right align-bottom font-medium leading-tight`}>
              Фонд,
              <br />
              млн сум
            </th>
          </tr>
        </thead>
        <tbody>
          {STAFF_GROUPS.map((g) => {
            const on = active === g.id;
            const dim = active !== null && !on;
            const handlers = bind(g.id);
            return (
              <Fragment key={g.id}>
                {g.positions.map((p, j) => {
                  const i = rowIndex++;
                  return (
                    <motion.tr
                      key={p.id}
                      onPointerEnter={handlers.onPointerEnter}
                      onPointerLeave={handlers.onPointerLeave}
                      onClick={handlers.onClick}
                      initial={reducedMotion ? false : { opacity: 0, x: -10 }}
                      animate={show ? { opacity: 1, x: 0 } : undefined}
                      transition={{ duration: 0.45, delay: 0.1 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                      className={`cursor-pointer transition-colors duration-300 ${j === 0 ? 'border-t border-white/10' : ''} ${
                        on ? 'bg-primary/20 text-white' : dim ? 'text-mute' : 'text-ice'
                      }`}
                    >
                      {j === 0 ? (
                        <th scope="rowgroup" rowSpan={g.positions.length} className={`${cell} text-left align-top font-normal`}>
                          <button
                            type="button"
                            onFocus={handlers.onFocus}
                            onBlur={handlers.onBlur}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlers.onClick();
                            }}
                            aria-pressed={on}
                            className={`t-micro -mx-1 cursor-pointer rounded-md px-1 text-left font-semibold leading-snug transition-colors ${
                              on ? 'text-highlight' : dim ? 'text-mute' : 'text-soft'
                            }`}
                          >
                            {g.name}
                          </button>
                        </th>
                      ) : null}
                      <td className={`${cell} leading-snug`}>{p.title}</td>
                      <td className={num}>{p.count}</td>
                      <td className={num}>{fmtNum(p.salary)}</td>
                      <td className={`${num} font-medium ${on ? 'text-white' : ''}`}>{fmtNum(positionMonthly(p))}</td>
                    </motion.tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-secondary/50 text-white">
            <th scope="row" colSpan={2} className={`${cell} pt-[var(--gap-1)] text-left font-semibold`}>
              Итого: {STAFF_HEADCOUNT} {plural(STAFF_HEADCOUNT, EMPLOYEE_FORMS)}
              <span className="t-micro ml-[var(--gap-1)] font-normal text-soft">окладный фонд, млн сум/мес</span>
            </th>
            <td className={`${num} pt-[var(--gap-1)] font-semibold`}>{STAFF_HEADCOUNT}</td>
            <td className={`${num} pt-[var(--gap-1)] text-mute`} aria-label="не суммируется">—</td>
            <td className={`${num} pt-[var(--gap-1)] font-display text-[length:var(--fs-h3)] leading-none`}>
              <span className="text-brand-gradient">{fmtNum(STAFF_FUND)}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </Glass>
  );
}

export function WorkforceDesktop() {
  const { active, bind } = useHoverSelect<DepartmentId>(null, { toggle: true });
  return (
    <>
      <div
        className="mt-[var(--gap-4)] grid items-stretch gap-[var(--gap-3)]"
        style={{ gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)' }}
      >
        <Reveal delay={0.2} className="min-w-0">
          <HeadcountPanel active={active} bind={bind} />
        </Reveal>
        <Reveal delay={0.3} className="min-w-0">
          <StaffTable active={active} bind={bind} />
        </Reveal>
      </div>
      <Reveal delay={0.45}>
        <p className="t-micro mt-[var(--gap-2)] text-mute">{FOOTNOTE}</p>
      </Reveal>
    </>
  );
}
