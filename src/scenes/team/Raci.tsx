import { motion } from 'motion/react';
import { CircleCheck } from 'lucide-react';
import { useScene } from '@/components/scene';
import { Glass } from '@/components/ui';
import { formatUsd, PROJECT, RACI, RACI_COLUMNS, RACI_LEGEND, ROLES, type Raci, type RoleId } from '@/data/project';
import { EASE, fmtNum, plural, useHoverSelect } from '../charter/kit';
import {
  columnDescription,
  columnKicker,
  columnSummary,
  fteLabel,
  ONE_A_PER_COLUMN,
  RACI_ORDER,
  roleShort,
  roleSummary,
  ROLES_OUTSIDE_BUDGET,
  TEAM_FTE,
  TEAM_IN_BUDGET,
} from './teamData';

type Bind = ReturnType<typeof useHoverSelect<string>>['bind'];

/** Ключ выбора: «r:роль», «c:столбец», «x:роль:столбец». */
export function parseRaciKey(key: string | null): { role: RoleId | null; col: string | null } {
  if (!key) return { role: null, col: null };
  const [kind, a, b] = key.split(':');
  if (kind === 'r') return { role: a as RoleId, col: null };
  if (kind === 'c') return { role: null, col: a };
  return { role: a as RoleId, col: b ?? null };
}

const CHIP_STYLE: Record<Raci, string> = {
  A: 'border-transparent bg-[image:var(--grad-brand)] text-white shadow-[0_8px_20px_-8px_rgba(37,80,250,0.95)]',
  R: 'border-secondary/55 bg-primary/30 text-white',
  C: 'border-highlight/35 bg-transparent text-highlight',
  I: 'border-white/10 bg-white/[0.03] text-mute',
};

export function RaciChip({
  letter,
  size = 'md',
  dim = false,
  className = '',
}: {
  letter: Raci;
  size?: 'sm' | 'md';
  dim?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center border font-display leading-none transition-opacity duration-300 ${CHIP_STYLE[letter]} ${
        size === 'md'
          ? 'size-[clamp(28px,calc(var(--u)*2.35),44px)] rounded-[10px] text-[length:var(--fs-small)]'
          : 'size-[1.9em] rounded-[8px] text-[length:var(--fs-micro)]'
      } ${dim ? 'opacity-30' : ''} ${className}`}
    >
      {letter}
    </span>
  );
}

/* ------------------------------------------------------------------
   Матрица: роли × результаты WBS и управление проектом.
   ------------------------------------------------------------------ */

export function RaciMatrix({ activeKey, bind, visible }: { activeKey: string | null; bind: Bind; visible: boolean }) {
  const { ready, reducedMotion } = useScene();
  const show = (ready || reducedMotion) && visible;
  const { role: aRole, col: aCol } = parseRaciKey(activeKey);
  const anyActive = aRole !== null || aCol !== null;
  const lastRow = ROLES.length - 1;
  const lastCol = RACI_COLUMNS.length - 1;

  return (
    <table
      data-interactive
      className="w-full table-fixed border-separate border-spacing-0"
      aria-label="Матрица ответственности RACI: роли проекта и результаты WBS"
    >
      <colgroup>
        <col style={{ width: '30%' }} />
        {RACI_COLUMNS.map((c) => (
          <col key={c.id} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th scope="col" className="pr-[var(--gap-2)] pb-[var(--gap-1)] text-left align-bottom">
            <span className="t-small font-medium text-mute">Роль · занятость</span>
          </th>
          {RACI_COLUMNS.map((c) => {
            const on = aCol === c.id;
            return (
              <th
                key={c.id}
                scope="col"
                className={`rounded-t-[12px] px-[3px] pb-[var(--gap-1)] align-bottom transition-colors duration-300 ${
                  on ? 'bg-primary/[0.16]' : ''
                }`}
              >
                <button
                  type="button"
                  {...bind(`c:${c.id}`)}
                  aria-pressed={on}
                  className="w-full cursor-pointer rounded-[10px] px-1 pt-[var(--gap-1)] text-center"
                >
                  <span className={`t-micro block transition-colors ${on ? 'text-white' : 'text-highlight'}`}>
                    {columnKicker(c.id)}
                  </span>
                  <span
                    className={`t-small mt-0.5 block font-semibold leading-tight text-balance transition-colors ${
                      anyActive && !on && aRole === null ? 'text-soft' : 'text-white'
                    }`}
                  >
                    {c.title}
                  </span>
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {ROLES.map((r, ri) => {
          const rowOn = aRole === r.id;
          return (
            <tr key={r.id}>
              <th
                scope="row"
                className={`rounded-l-[12px] border-t border-white/[0.06] p-0 text-left font-normal transition-colors duration-300 ${
                  rowOn ? 'bg-primary/[0.16]' : ''
                }`}
              >
                <button
                  type="button"
                  {...bind(`r:${r.id}`)}
                  aria-pressed={rowOn}
                  className="flex w-full cursor-pointer flex-col items-start gap-1 rounded-[12px] px-[var(--gap-2)] py-[calc(var(--gap-1)*1.05)] text-left"
                >
                  <span
                    className={`t-small font-semibold leading-snug transition-colors ${
                      anyActive && !rowOn && aCol === null ? 'text-soft' : 'text-white'
                    }`}
                  >
                    {r.title}
                  </span>
                  <span
                    className={`chip ${r.fte === null ? 'border-white/15! bg-transparent! text-mute!' : ''}`}
                  >
                    {fteLabel(r.fte)}
                  </span>
                </button>
              </th>
              {RACI_COLUMNS.map((c, ci) => {
                const letter = RACI[r.id][c.id];
                const colOn = aCol === c.id;
                const cross = rowOn && colOn;
                const lit = rowOn || colOn;
                const radius = `${ci === lastCol && rowOn && !colOn ? 'rounded-r-[12px]' : ''} ${
                  ri === lastRow && colOn && !rowOn ? 'rounded-b-[12px]' : ''
                } ${cross ? 'rounded-[10px]' : ''}`;
                return (
                  <td
                    key={c.id}
                    className={`border-t border-white/[0.06] p-0 text-center align-middle transition-colors duration-300 ${radius} ${
                      cross ? 'bg-primary/35' : lit ? 'bg-primary/[0.16]' : ''
                    }`}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      {...bind(`x:${r.id}:${c.id}`)}
                      aria-label={`${r.title} — ${c.title}: ${letter}, ${RACI_LEGEND[letter].toLowerCase()}`}
                      className="grid h-full w-full cursor-pointer place-items-center py-[calc(var(--gap-1)*0.8)]"
                    >
                      <motion.span
                        className="inline-grid"
                        initial={reducedMotion ? false : { opacity: 0, scale: 0.55 }}
                        animate={show ? { opacity: 1, scale: 1 } : undefined}
                        transition={{ duration: 0.45, delay: 0.08 + ri * 0.05 + ci * 0.035, ease: EASE }}
                      >
                        <RaciChip letter={letter} dim={anyActive && !lit} />
                      </motion.span>
                    </button>
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------
   Панель деталей: обзор команды / роль / столбец / ячейка.
   ------------------------------------------------------------------ */

function LetterLines<T>({
  groups,
  name,
  highlight,
}: {
  groups: Record<Raci, T[]>;
  name: (item: T) => string;
  highlight?: Raci;
}) {
  return (
    <ul className="mt-[var(--gap-2)] grid gap-[calc(var(--gap-1)*0.9)]">
      {RACI_ORDER.filter((l) => groups[l].length > 0).map((l) => (
        <li key={l} className="t-small flex items-start gap-[var(--gap-1)] leading-snug">
          <RaciChip letter={l} size="sm" dim={highlight !== undefined && highlight !== l} />
          <span className={`min-w-0 pt-[0.15em] ${highlight !== undefined && highlight !== l ? 'text-mute' : 'text-ice'}`}>
            {groups[l].map(name).join(', ')}
          </span>
        </li>
      ))}
    </ul>
  );
}

const SPECIALIST_FORMS = ['специалист', 'специалиста', 'специалистов'] as const;

function TeamOverview() {
  return (
    <div>
      <p className="t-small flex items-center gap-2 font-semibold text-highlight">
        Команда проекта <span className="chip chip-plan">план</span>
      </p>
      <div className="mt-[var(--gap-2)] flex flex-wrap items-end gap-x-[var(--gap-3)] gap-y-[var(--gap-1)]">
        <p className="flex items-baseline gap-2">
          <span className="t-stat text-gradient">{TEAM_IN_BUDGET.length}</span>
          <span className="t-small text-soft">{plural(TEAM_IN_BUDGET.length, SPECIALIST_FORMS)}</span>
        </p>
        <p className="flex items-baseline gap-2">
          <span className="t-stat text-gradient">{fmtNum(TEAM_FTE, 1)}</span>
          <span className="t-small text-soft">ставки</span>
        </p>
      </div>
      <p className="t-small mt-[var(--gap-2)] leading-snug text-ice">
        Бюджет команды — {formatUsd(PROJECT.teamBudgetMonthlyUsd)} в месяц.{' '}
        <span className="text-soft">
          {ROLES_OUTSIDE_BUDGET.map((r) => roleShort(r).toLowerCase()).join(' и ').replace(/^./, (ch) => ch.toUpperCase())} —
          вне бюджета команды.
        </span>
      </p>
      <p className="t-small mt-[var(--gap-2)] text-mute">Наведите на роль, результат или ячейку матрицы.</p>
    </div>
  );
}

export function RaciDetail({ activeKey }: { activeKey: string | null }) {
  const { reducedMotion } = useScene();
  const { role: roleId, col: colId } = parseRaciKey(activeKey);
  const role = ROLES.find((r) => r.id === roleId) ?? null;
  const col = RACI_COLUMNS.find((c) => c.id === colId) ?? null;

  let body;
  if (role && col) {
    const letter = RACI[role.id][col.id];
    body = (
      <div>
        <p className="t-small font-semibold text-highlight">{col.title}</p>
        <p className="t-h3 mt-1 text-white">{role.title}</p>
        <div className="mt-[var(--gap-2)] flex items-center gap-[var(--gap-2)]">
          <RaciChip letter={letter} />
          <span className="t-body font-semibold text-white">{RACI_LEGEND[letter]}</span>
        </div>
        <p className="t-small mt-[var(--gap-2)] leading-snug text-soft">
          <span className="text-mute">Фокус роли: </span>
          {role.focus}
        </p>
      </div>
    );
  } else if (role) {
    body = (
      <div>
        <p className="t-small font-semibold text-highlight">Роль · {fteLabel(role.fte)}</p>
        <p className="t-h3 mt-1 text-white">{role.title}</p>
        <p className="t-small mt-1 leading-snug text-ice">{role.focus}</p>
        <LetterLines groups={roleSummary(role.id)} name={(c) => c.title} />
      </div>
    );
  } else if (col) {
    const description = columnDescription(col.id);
    body = (
      <div>
        <p className="t-small font-semibold text-highlight">{columnKicker(col.id)}</p>
        <p className="t-h3 mt-1 text-white">{col.title}</p>
        {description ? <p className="t-small mt-1 leading-snug text-soft">{description}</p> : null}
        <LetterLines groups={columnSummary(col.id)} name={(r) => roleShort(r)} />
      </div>
    );
  } else {
    body = <TeamOverview />;
  }

  return (
    <motion.div
      key={activeKey ?? 'overview'}
      aria-live="polite"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0.12 : 0.3, ease: EASE }}
    >
      {body}
    </motion.div>
  );
}

export function RaciLegend({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <ul className="grid grid-cols-2 gap-x-[var(--gap-2)] gap-y-[var(--gap-1)]">
        {RACI_ORDER.map((l) => (
          <li key={l} className="t-small flex items-center gap-[var(--gap-1)] leading-tight text-soft">
            <RaciChip letter={l} size="sm" />
            <span className="min-w-0">{RACI_LEGEND[l]}</span>
          </li>
        ))}
      </ul>
      {ONE_A_PER_COLUMN ? (
        <p className="t-small mt-[var(--gap-2)] flex items-start gap-[var(--gap-1)] leading-snug text-ice">
          <CircleCheck aria-hidden className="mt-[0.1em] size-[1.2em] shrink-0 text-secondary" strokeWidth={2} />
          <span>В каждом столбце — ровно один ответственный&nbsp;(A)</span>
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------
   Телефон: карточка на каждую роль — буквы по столбцам.
   ------------------------------------------------------------------ */

export function RaciCards() {
  return (
    <div className="grid gap-[var(--gap-2)] min-[640px]:grid-cols-2">
      <Glass strong className="p-[var(--gap-3)] min-[640px]:col-span-2">
        <p className="t-small font-semibold text-white">Матрица RACI</p>
        <RaciLegend className="mt-[var(--gap-2)]" />
      </Glass>
      {ROLES.map((r) => (
        <Glass key={r.id} className="p-[var(--gap-3)]">
          <p className="t-small font-semibold leading-snug text-white">{r.title}</p>
          <span className={`chip mt-1 ${r.fte === null ? 'border-white/15! bg-transparent! text-mute!' : ''}`}>
            {fteLabel(r.fte)}
          </span>
          <p className="t-small mt-[var(--gap-1)] leading-snug text-soft">{r.focus}</p>
          <LetterLines groups={roleSummary(r.id)} name={(c) => c.title} />
        </Glass>
      ))}
    </div>
  );
}
