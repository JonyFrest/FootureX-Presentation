import { Reveal } from '@/components/scene';
import { CountUp, Glass } from '@/components/ui';
import { PROJECT, WORK_PACKAGES } from '@/data/project';
import { fmtNum, plural, useHoverSelect } from '../charter/kit';
import { CapacityBar, CriticalLegend, CriticalMark, OptionalPackageCard, SegmentBar } from './WbsParts';
import { DELIVERABLE_VIEWS, FOOTNOTE, MAX_DELIVERABLE, PACKAGE_FORMS, RESULT_FORMS, WBS_TOTAL, fmtSprints } from './wbsData';

/** Телефон: итог и ёмкость, затем карточка на каждый результат со списком пакетов работ. */
export function WbsMobile() {
  const { active, bind } = useHoverSelect<string>(null, { toggle: true });
  return (
    <div className="mt-[var(--gap-3)] grid gap-[var(--gap-2)] min-[640px]:grid-cols-2 min-[640px]:items-start">
      <Reveal delay={0.12} className="min-[640px]:col-span-2">
        <Glass strong className="p-[var(--gap-3)]">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-block rounded-full border border-secondary/50 bg-primary/25 px-2.5 py-1 font-display text-[length:var(--fs-micro)] leading-none text-white">
                {PROJECT.code}
              </span>
              <p className="t-small mt-1.5 text-soft">
                {DELIVERABLE_VIEWS.length} {plural(DELIVERABLE_VIEWS.length, RESULT_FORMS)} · {WORK_PACKAGES.length}{' '}
                {plural(WORK_PACKAGES.length, PACKAGE_FORMS)}
              </p>
            </div>
            <p className="flex shrink-0 items-baseline gap-1.5">
              <CountUp to={WBS_TOTAL} className="t-stat text-gradient" />
              <span className="t-small text-highlight">ид</span>
            </p>
          </div>
          <CapacityBar className="mt-[var(--gap-3)]" activeDeliverable={null} />
        </Glass>
      </Reveal>

      {DELIVERABLE_VIEWS.map((d, i) => {
        const on = active === d.id;
        return (
          <Reveal key={d.id} delay={0.18 + i * 0.05}>
            <Glass className={`overflow-hidden transition-[border-color] duration-300 ${on ? 'border-secondary/55!' : ''}`}>
              <button
                type="button"
                {...bind(d.id)}
                aria-pressed={on}
                className="block w-full cursor-pointer p-[var(--gap-3)] pb-[var(--gap-2)] text-left"
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-display text-[length:var(--fs-small)]" style={{ color: d.color }}>
                    {d.code}
                  </span>
                  <span className="t-small min-w-0 flex-1 font-semibold text-white">{d.title}</span>
                  <span className="t-small shrink-0 font-semibold text-white t-num">{fmtNum(d.estimate)} ид</span>
                  <span className="t-small shrink-0 text-highlight t-num">{d.sharePct}%</span>
                </span>
                <SegmentBar
                  className="mt-2"
                  deliverable={d}
                  widthPct={(d.estimate / MAX_DELIVERABLE) * 100}
                  activePackage={null}
                  dim={false}
                  delay={0.2 + i * 0.08}
                />
              </button>
              <ul className="border-t border-white/[0.08] px-[var(--gap-3)] py-[var(--gap-1)]">
                {d.packages.map((p) => (
                  <li
                    key={p.id}
                    className="grid grid-cols-[3em_minmax(0,1fr)_auto] items-baseline gap-x-2 border-t border-white/[0.05] py-1.5 first:border-t-0"
                  >
                    <span className="font-display text-[length:var(--fs-micro)] text-highlight t-num">{p.code}</span>
                    <span className="t-small min-w-0 leading-snug text-ice">
                      {p.title}
                      {p.critical ? <CriticalMark className="ml-1.5 align-middle" /> : null}
                      <span className="t-micro block text-mute t-num">
                        {p.sprints.length > 1 ? 'спринты' : 'спринт'} {fmtSprints(p.sprints)}
                      </span>
                    </span>
                    <span className="t-small font-semibold text-white t-num">{fmtNum(p.estimate)}</span>
                  </li>
                ))}
              </ul>
            </Glass>
          </Reveal>
        );
      })}

      <Reveal delay={0.42} className="min-[640px]:col-span-2">
        <OptionalPackageCard className="bg-[rgba(10,16,32,0.7)]" />
        <p className="t-micro mt-[var(--gap-2)] text-mute">
          <CriticalLegend className="mr-2" />
        </p>
        <p className="t-micro mt-1 text-mute">{FOOTNOTE}.</p>
      </Reveal>
    </div>
  );
}
