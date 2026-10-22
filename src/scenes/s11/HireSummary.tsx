import { FUNNEL_STAGES, HIRING_WAVE_POSITIONS, TIME_TO_HIRE_DAYS, funnelConversion } from '@/data/hr';
import { CountUp, Glass } from '@/components/ui';
import { DAY_FORMS, POSITION_FORMS, plural } from './format';

const OFFER_ACCEPTANCE = Math.round(funnelConversion(FUNNEL_STAGES.length - 1) ?? 0);

/** Итоги воронки (план): волна найма, срок закрытия вакансии, принятие офферов. */
export function HireSummary({ compact }: { compact: boolean }) {
  const items = [
    {
      key: 'wave',
      prefix: '',
      value: HIRING_WAVE_POSITIONS,
      suffix: '',
      unit: plural(HIRING_WAVE_POSITIONS, POSITION_FORMS),
      label: 'волна найма этапа 1',
    },
    {
      key: 'tth',
      prefix: '≤ ',
      value: TIME_TO_HIRE_DAYS,
      suffix: '',
      unit: plural(TIME_TO_HIRE_DAYS, DAY_FORMS),
      label: 'Time to hire',
    },
    {
      key: 'offer',
      prefix: '≈ ',
      value: OFFER_ACCEPTANCE,
      suffix: '%',
      unit: '',
      label: 'принятие офферов',
    },
  ];

  return (
    <Glass className={`relative ${compact ? 'w-full' : ''}`}>
      <span className="chip chip-plan absolute -top-2.5 left-[var(--gap-3)] uppercase tracking-[0.14em]" style={{ background: '#0b1224' }}>
        План
      </span>
      <dl className="grid grid-cols-3">
        {items.map((it, i) => (
          <div
            key={it.key}
            className={`flex min-w-0 flex-col ${compact ? 'px-[var(--gap-2)]' : 'px-[var(--gap-3)]'} pt-[var(--gap-3)] pb-[var(--gap-2)] ${i > 0 ? 'border-l border-[rgba(142,180,255,0.14)]' : ''}`}
          >
            <dt className={`t-micro order-2 text-soft ${compact ? 'leading-tight' : 'whitespace-nowrap'}`}>{it.label}</dt>
            <dd className={`order-1 flex items-baseline whitespace-nowrap ${compact ? 'flex-wrap gap-x-1' : 'gap-1.5'}`}>
              <span className={`${compact ? 't-h2' : 't-h1'} font-display text-gradient`}>
                <CountUp to={it.value} prefix={it.prefix} suffix={it.suffix} />
              </span>
              {it.unit ? <span className="t-small font-medium text-highlight">{it.unit}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </Glass>
  );
}
