import { Reveal } from '@/components/scene';
import { MILESTONES } from '@/data/project';
import {
  ALL_ROWS,
  MONTHS,
  mauText,
  milestoneWhen,
  monthSprints,
  msKey,
  sprintsText,
  type GanttRow,
} from './gantt';
import { Diamond, barStyle } from './parts';

interface MobileProps {
  activeKey: string | null;
  onSelect: (key: string) => void;
  criticalMode: boolean;
}

/** Телефон: план по месяцам — карточка на месяц, в ней работы с мини-шкалой двух спринтов и вехи. */
export function ScheduleMobile({ activeKey, onSelect, criticalMode }: MobileProps) {
  return (
    <div className="grid gap-[var(--gap-2)] sm:grid-cols-2">
      {Array.from({ length: MONTHS }, (_, i) => {
        const month = i + 1;
        const sprints = monthSprints(month);
        const rows = ALL_ROWS.filter((r) => r.sprints.some((s) => sprints.includes(s)));
        const milestones = MILESTONES.filter((m) => sprints.includes(m.sprint));
        return (
          <Reveal key={month} delay={0.2 + i * 0.05} className="min-w-0">
            <section className="glass p-3" aria-label={`Месяц ${month}`} data-interactive>
              <header className="mb-1.5 flex items-baseline justify-between gap-2">
                <h2 className="t-small font-semibold text-white">Месяц {month}</h2>
                <span className="t-micro font-display text-mute">
                  S{sprints[0]}–S{sprints[sprints.length - 1]}
                </span>
              </header>
              <ul className="flex flex-col gap-1">
                {rows.map((row) => (
                  <li key={row.key}>
                    <MobileRow
                      row={row}
                      sprints={sprints}
                      open={activeKey === row.key}
                      dimmed={criticalMode && !row.critical}
                      onSelect={onSelect}
                    />
                  </li>
                ))}
                {milestones.map((m) => {
                  const open = activeKey === msKey(m);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => onSelect(msKey(m))}
                        className={`w-full cursor-pointer rounded-[10px] border px-2.5 py-2 text-left transition-colors duration-300 ${
                          open ? 'border-[rgba(37,147,250,0.6)] bg-[rgba(37,80,250,0.16)]' : 'border-[rgba(142,180,255,0.18)] bg-[rgba(37,80,250,0.07)]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Diamond active={open} className="size-[11px] shrink-0" />
                          <span className="t-micro font-display text-highlight">{m.id}</span>
                          <span className="t-small min-w-0 flex-1 font-semibold text-white">{m.title}</span>
                          <span className="t-micro shrink-0 font-display text-mute">S{m.sprint}</span>
                        </span>
                        {open ? (
                          <span className="mt-1 block pl-[19px]">
                            <span className="t-micro block text-soft">{m.result}</span>
                            <span className="t-micro mt-0.5 block text-highlight t-num">
                              {milestoneWhen(m)}
                              {m.mau ? ` · цель ${mauText(m.mau)}` : ''}
                            </span>
                          </span>
                        ) : m.mau ? (
                          <span className="t-micro mt-0.5 block pl-[19px] text-highlight t-num">цель {mauText(m.mau)}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </Reveal>
        );
      })}
    </div>
  );
}

function MobileRow({
  row,
  sprints,
  open,
  dimmed,
  onSelect,
}: {
  row: GanttRow;
  sprints: number[];
  open: boolean;
  dimmed: boolean;
  onSelect: (key: string) => void;
}) {
  const kind = row.optional ? 'optional' : row.critical ? 'critical' : 'regular';
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => onSelect(row.key)}
      className={`w-full cursor-pointer rounded-[10px] px-2 py-1.5 text-left transition-[background-color,opacity] duration-300 ${
        open ? 'bg-[rgba(37,147,250,0.14)]' : ''
      }`}
      style={{ opacity: dimmed && !open ? 0.45 : 1 }}
    >
      <span className="flex items-center gap-2">
        <span className="t-micro w-[30px] shrink-0 font-display text-highlight">{row.code || '—'}</span>
        <span className={`t-small min-w-0 flex-1 leading-snug text-ice ${row.optional ? 'italic' : ''}`}>{row.title}</span>
        {/* Мини-шкала месяца: два спринта, закрашены спринты работы. */}
        <span className="grid w-[54px] shrink-0 grid-cols-2 gap-[3px]" aria-hidden>
          {sprints.map((s) => (
            <span
              key={s}
              className="h-[9px] rounded-[3px]"
              style={row.sprints.includes(s) ? barStyle(kind) : { background: 'rgba(142,180,255,0.08)' }}
            />
          ))}
        </span>
      </span>
      {open ? (
        <span className="mt-1 block pl-[38px]">
          <span className="t-micro block text-soft">{row.detail}</span>
          <span className="t-micro mt-0.5 block text-highlight t-num">
            {sprintsText(row)} · {row.estimate} ид
            {row.critical ? ' · критический путь' : row.optional ? ' · задел из буфера' : ''}
          </span>
        </span>
      ) : null}
    </button>
  );
}
