import { Reveal } from '@/components/scene';
import { Glass } from '@/components/ui';
import { positionMonthly } from '@/data/hr';
import { EMPLOYEE_FORMS, fmtNum, plural, POSITION_FORMS, UNIT_FORMS } from '../s08/shared';
import { FOOTNOTE, HeadcountCount, Person } from './parts';
import { groupFigures, STAFF_FUND, STAFF_GROUPS, STAFF_HEADCOUNT, STAFF_POSITIONS } from './workforceData';

/** Телефон: карточки подразделений вместо широкой таблицы. */
export function WorkforceCards() {
  let figureIndex = 0;
  return (
    <div className="mt-4">
      <Reveal delay={0.15}>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <HeadcountCount />
          <span className="t-h3 text-white">{plural(STAFF_HEADCOUNT, EMPLOYEE_FORMS)}</span>
          <span className="chip chip-plan">проект штатного расписания</span>
        </div>
        <p className="t-small mt-1 text-soft">
          {STAFF_GROUPS.length} {plural(STAFF_GROUPS.length, UNIT_FORMS)} · {STAFF_POSITIONS}{' '}
          {plural(STAFF_POSITIONS, POSITION_FORMS)} · окладный фонд{' '}
          <span className="whitespace-nowrap text-white t-num">{fmtNum(STAFF_FUND)} млн сум/мес</span>
        </p>
      </Reveal>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {STAFF_GROUPS.map((g, gi) => (
          <Reveal key={g.id} delay={0.2 + gi * 0.05}>
            <Glass className="p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="t-small font-semibold text-white">{g.name}</p>
                  <p className="t-micro text-mute t-num">фонд {fmtNum(g.monthly)} млн сум/мес</p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="font-display text-[20px] leading-none text-white t-num">{g.headcount}</span>
                  <span className="t-micro ml-1 text-mute">чел.</span>
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5" aria-hidden>
                {groupFigures(g).map((f) => (
                  <Person key={f.key} head={f.head} on={false} dim={false} index={figureIndex++} className="h-6 w-auto" />
                ))}
              </div>
              <ul className="mt-2.5 divide-y divide-white/10 border-t border-white/10">
                {g.positions.map((p) => (
                  <li key={p.id} className="flex items-baseline justify-between gap-3 py-1.5">
                    <span className="t-small min-w-0 text-ice">
                      {p.title}
                      {p.count > 1 ? <span className="ml-1.5 font-semibold text-highlight">×{p.count}</span> : null}
                    </span>
                    <span className="t-micro shrink-0 text-right text-soft t-num">
                      {p.count > 1 ? `${p.count} × ${fmtNum(p.salary)} = ` : ''}
                      <span className="font-semibold text-white">{fmtNum(positionMonthly(p))}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Glass>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.5}>
        <Glass strong className="mt-2.5 flex items-center justify-between gap-3 p-3.5">
          <div>
            <p className="t-small font-semibold text-white">
              Итого: {STAFF_HEADCOUNT} {plural(STAFF_HEADCOUNT, EMPLOYEE_FORMS)}
            </p>
            <p className="t-micro text-soft">окладный фонд, млн сум/мес</p>
          </div>
          <span className="font-display text-[22px] leading-none t-num">
            <span className="text-brand-gradient">{fmtNum(STAFF_FUND)}</span>
          </span>
        </Glass>
        <p className="t-micro mt-2.5 text-mute">{FOOTNOTE} · оклад и фонд — млн сум в месяц.</p>
      </Reveal>
    </div>
  );
}
