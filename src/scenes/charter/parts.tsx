import type { ComponentType, PointerEvent, FocusEvent } from 'react';
import { motion } from 'motion/react';
import { BadgeCheck, CalendarClock, Check, CreditCard, Minus, Users, Wallet, type LucideProps } from 'lucide-react';
import { useScene } from '@/components/scene';
import { MILESTONES, PROJECT, ROLES, SMART } from '@/data/project';
import { EASE, fmtNum, plural, thinSpaces, useHoverSelect } from './kit';
import { BUDGET_MONTHLY, GOAL_SEGMENTS, MANAGER_SHORT, type SmartLetter } from './charterData';

type Handlers = {
  onPointerEnter: (e: PointerEvent) => void;
  onPointerLeave: (e: PointerEvent) => void;
  onFocus: () => void;
  onBlur: (e: FocusEvent) => void;
  onClick: () => void;
};
export type LetterBind = (letter: SmartLetter) => Handlers;

/* ------------------------------------------------------------------
   Цель проекта: фрагменты SMART подсвечиваются при выборе буквы.
   ------------------------------------------------------------------ */

export function GoalSentence({
  active,
  bind,
  className = '',
}: {
  active: SmartLetter | null;
  bind: LetterBind;
  className?: string;
}) {
  return (
    <p className={className}>
      {GOAL_SEGMENTS.map((seg, i) => {
        if (!seg.letter) {
          return (
            <span key={i} className={`transition-colors duration-300 ${active ? 'text-mute' : 'text-ice'}`}>
              {seg.text}
            </span>
          );
        }
        const on = active === seg.letter;
        const h = bind(seg.letter);
        // Буква-метка не должна отрываться от последнего слова фрагмента при переносе.
        const cut = seg.text.lastIndexOf(' ');
        const head = cut > 0 ? seg.text.slice(0, cut + 1) : '';
        const tail = cut > 0 ? seg.text.slice(cut + 1) : seg.text;
        return (
          <span
            key={i}
            data-interactive
            onPointerEnter={h.onPointerEnter}
            onPointerLeave={h.onPointerLeave}
            onClick={h.onClick}
            className={`cursor-pointer rounded-[6px] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] transition-[color,background-color,box-shadow,text-decoration-color] duration-300 ${
              on
                ? 'bg-primary/40 text-white underline decoration-transparent shadow-[0_0_0_3px_rgba(37,80,250,0.4),0_0_0_4px_rgba(37,147,250,0.55)]'
                : active
                  ? 'text-mute underline decoration-transparent'
                  : 'text-white underline decoration-highlight/50 decoration-dotted decoration-[1.5px] underline-offset-[0.28em]'
            }`}
          >
            {head}
            <span className="whitespace-nowrap">
              {tail}
              <span
              aria-hidden
              className={`relative -top-[0.6em] ml-[0.18em] inline-block font-display text-[length:var(--fs-micro)] leading-none no-underline transition-colors duration-300 ${
                on ? 'text-white' : active ? 'text-mute/70' : 'text-secondary'
              }`}
            >
              {seg.letter}
              </span>
            </span>
          </span>
        );
      })}
    </p>
  );
}

/* ------------------------------------------------------------------
   Буква SMART.
   ------------------------------------------------------------------ */

export function SmartTile({
  item,
  on,
  dim,
  handlers,
  layout = 'tile',
}: {
  item: (typeof SMART)[number];
  on: boolean;
  dim: boolean;
  handlers: Handlers;
  layout?: 'tile' | 'row';
}) {
  const row = layout === 'row';
  return (
    <button
      type="button"
      {...handlers}
      aria-pressed={on}
      aria-label={`${item.letter} — ${item.label}: ${item.text}. Подсветить в формулировке цели`}
      data-active={on ? 'true' : undefined}
      className={`glass-hover group flex h-full w-full cursor-pointer rounded-[14px] border text-left transition-[transform,border-color,box-shadow,background-color,opacity] duration-300 ${
        row ? 'items-start gap-3 p-[var(--gap-2)]' : 'flex-col p-[var(--gap-2)]'
      } ${
        on
          ? 'border-secondary/60 bg-[linear-gradient(160deg,rgba(37,80,250,0.32),rgba(10,16,32,0.6)_75%)]'
          : row
            ? 'border-white/10 bg-[rgba(10,16,32,0.8)] hover:bg-[rgba(14,22,41,0.9)]'
            : 'border-white/10 bg-white/[0.025] hover:bg-white/[0.05]'
      } ${dim ? 'opacity-60' : ''}`}
    >
      <span
        aria-hidden
        className={`t-h2 shrink-0 leading-none transition-colors duration-300 ${
          on ? 'text-white' : 'text-brand-gradient'
        } ${row ? 'w-[1.1em] pt-0.5 text-center' : ''}`}
      >
        {item.letter}
      </span>
      <span className={`block min-w-0 ${row ? '' : 'mt-[var(--gap-1)]'}`}>
        <span className="t-small block font-semibold leading-snug text-white">{item.label}</span>
        <span className={`t-small mt-0.5 block leading-snug ${on ? 'text-ice' : 'text-soft'}`}>{thinSpaces(item.text)}</span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------
   Содержимое вкладок: содержание, ограничения, приёмка.
   ------------------------------------------------------------------ */

export function ScopeContent({ dense = false }: { dense?: boolean }) {
  return (
    <div className="flex h-full flex-col gap-[var(--gap-2)]">
      <section>
        <h3 className="t-small flex items-center gap-2 font-semibold text-white">
          Входит в проект
          <span className="chip t-num">{PROJECT.inScope.length}</span>
        </h3>
        <ul className={`mt-[var(--gap-1)] ${dense ? 'space-y-1' : 'space-y-[calc(var(--gap-1)*0.75)]'}`}>
          {PROJECT.inScope.map((item) => (
            <li key={item} className="t-small flex items-start gap-[var(--gap-1)] leading-snug text-ice">
              <span
                aria-hidden
                className="mt-[0.08em] grid size-[1.25em] shrink-0 place-items-center rounded-full bg-primary/30 text-highlight"
              >
                <Check className="size-[0.85em]" strokeWidth={2.6} />
              </span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      </section>
      <section
        aria-label="Не входит в проект"
        className="rounded-[12px] border border-dashed border-highlight/30 bg-white/[0.015] px-[var(--gap-2)] py-[calc(var(--gap-2)*0.8)]"
      >
        <h3 className="t-small flex items-center gap-2 font-semibold text-soft">
          Не входит в проект
          <span className="chip chip-plan t-num">{PROJECT.outOfScope.length}</span>
        </h3>
        <ul className="mt-[var(--gap-1)] space-y-1">
          {PROJECT.outOfScope.map((item) => (
            <li key={item} className="t-small flex items-start gap-[var(--gap-1)] leading-snug text-mute">
              <span
                aria-hidden
                className="mt-[0.08em] grid size-[1.25em] shrink-0 place-items-center rounded-full border border-dashed border-mute/60"
              >
                <Minus className="size-[0.8em]" strokeWidth={2.4} />
              </span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const LIMIT_ICONS: ComponentType<LucideProps>[] = [Wallet, Users, CalendarClock, CreditCard];

export function LimitsContent() {
  return (
    <section className="flex h-full flex-col">
      <h3 className="t-small font-semibold text-white">Ограничения проекта</h3>
      <ul className="mt-[var(--gap-2)] grid gap-[var(--gap-1)]">
        {PROJECT.constraints.map((item, i) => {
          const Icon = LIMIT_ICONS[i] ?? Minus;
          return (
            <li
              key={item}
              className="t-small flex items-center gap-[var(--gap-2)] rounded-[12px] border border-white/10 bg-white/[0.025] px-[var(--gap-2)] py-[calc(var(--gap-1)*1.2)] leading-snug text-ice"
            >
              <span
                aria-hidden
                className="grid size-[2.1em] shrink-0 place-items-center rounded-[10px] border border-highlight/25 bg-primary/15 text-highlight"
              >
                <Icon className="size-[55%]" strokeWidth={1.8} />
              </span>
              <span className="min-w-0">{item}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function AcceptContent() {
  return (
    <section className="flex h-full flex-col">
      <h3 className="t-small font-semibold text-white">Критерии приёмки MVP</h3>
      <ol className="mt-[var(--gap-2)] grid gap-[calc(var(--gap-1)*0.9)]">
        {PROJECT.acceptance.map((item, i) => (
          <li key={item} className="t-small flex items-start gap-[var(--gap-2)] leading-snug text-ice">
            <span
              aria-hidden
              className="grid size-[1.9em] shrink-0 place-items-center rounded-full border border-secondary/45 bg-primary/20 font-display text-[length:var(--fs-micro)] text-white t-num"
            >
              {i + 1}
            </span>
            <span className="min-w-0 pt-[0.2em]">{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------
   Паспорт проекта: ключевые факты и вехи.
   ------------------------------------------------------------------ */

const MONTH_FORMS = ['месяц', 'месяца', 'месяцев'] as const;
const WEEK_FORMS = ['неделя', 'недели', 'недель'] as const;
const MILESTONE_FORMS = ['веха', 'вехи', 'вех'] as const;

export interface FactItem {
  id: string;
  label: string;
  value: string;
  unit?: string;
  numeric?: boolean;
}

export const FACTS: readonly FactItem[] = [
  { id: 'sponsor', label: 'Спонсор', value: PROJECT.sponsor },
  { id: 'manager', label: 'Руководитель проекта', value: MANAGER_SHORT },
  {
    id: 'term',
    label: 'Срок',
    value: fmtNum(PROJECT.durationMonths),
    unit: plural(PROJECT.durationMonths, MONTH_FORMS),
    numeric: true,
  },
  {
    id: 'sprints',
    label: 'Спринты',
    value: fmtNum(PROJECT.sprints),
    unit: `по ${PROJECT.sprintWeeks} ${plural(PROJECT.sprintWeeks, WEEK_FORMS)}`,
    numeric: true,
  },
  { id: 'budget', label: 'Бюджет команды', value: BUDGET_MONTHLY, unit: '/ мес', numeric: true },
];

export function FactValue({ fact }: { fact: FactItem }) {
  if (!fact.numeric) return <p className="t-h3 leading-tight text-white">{fact.value}</p>;
  return (
    <p className="flex items-baseline gap-x-[0.4em] leading-none whitespace-nowrap">
      <span className="t-h2 leading-none text-white t-num">{fact.value}</span>
      {fact.unit ? <span className="t-small text-soft">{fact.unit}</span> : null}
    </p>
  );
}

/** Вехи M1–M5 на шкале из 12 спринтов; наведение показывает название вехи. */
export function MilestoneTrack({ className = '' }: { className?: string }) {
  const { ready, reducedMotion } = useScene();
  const { active, bind } = useHoverSelect<string>(null, { toggle: true });
  const show = ready || reducedMotion;
  const current = MILESTONES.find((m) => m.id === active) ?? null;
  const sprints = Array.from({ length: PROJECT.sprints }, (_, i) => i + 1);
  const first = MILESTONES[0];
  const last = MILESTONES[MILESTONES.length - 1];

  return (
    <div className={className}>
      <p className="t-small flex min-w-0 items-center gap-2 text-mute" aria-live="polite">
        {current ? (
          <span className="min-w-0 truncate text-ice">
            <span className="font-semibold text-white">{current.id}</span> · {current.title}
            <span className="text-mute"> · спринт {current.sprint}</span>
          </span>
        ) : (
          <>
            <span className="truncate">
              {MILESTONES.length} {plural(MILESTONES.length, MILESTONE_FORMS)} · спринты {first.sprint}–{last.sprint}
            </span>
            <span className="chip chip-plan shrink-0">план</span>
          </>
        )}
      </p>
      <div className="relative mt-[calc(var(--gap-1)*1.1)] px-[6px]">
        <div className="flex gap-[2px]" aria-hidden>
          {sprints.map((s) => {
            const reached = current ? s <= current.sprint : true;
            return (
              <motion.span
                key={s}
                className="h-[5px] flex-1 origin-left rounded-full"
                style={{
                  background: reached ? 'linear-gradient(90deg,#2593FA,#2550FA)' : 'rgba(142,180,255,0.16)',
                  transition: 'background 0.3s ease',
                }}
                initial={reducedMotion ? false : { scaleX: 0, opacity: 0 }}
                animate={show ? { scaleX: 1, opacity: 1 } : undefined}
                transition={{ duration: 0.4, delay: 0.2 + s * 0.04, ease: EASE }}
              />
            );
          })}
        </div>
        <div className="relative h-[calc(var(--fs-small)*1.9)]">
          {MILESTONES.map((m) => {
            const on = current?.id === m.id;
            return (
              <button
                key={m.id}
                type="button"
                {...bind(m.id)}
                aria-pressed={on}
                aria-label={`${m.id}: ${m.title}, конец спринта ${m.sprint}`}
                className="absolute top-[-9px] flex -translate-x-1/2 cursor-pointer flex-col items-center gap-[3px] rounded-md px-1 outline-offset-1"
                style={{ left: `${(m.sprint / PROJECT.sprints) * 100}%` }}
              >
                <span
                  aria-hidden
                  className={`block size-[9px] rotate-45 rounded-[2px] border transition-[background-color,box-shadow] duration-300 ${
                    on
                      ? 'border-white bg-white shadow-[0_0_12px_2px_rgba(37,147,250,0.8)]'
                      : 'border-highlight bg-deep'
                  }`}
                />
                <span
                  className={`font-display text-[length:var(--fs-small)] leading-none transition-colors duration-300 ${
                    on ? 'text-white' : 'text-highlight'
                  }`}
                >
                  {m.id}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const EMPTY_BIND: LetterBind = () => ({
  onPointerEnter: () => {},
  onPointerLeave: () => {},
  onFocus: () => {},
  onBlur: () => {},
  onClick: () => {},
});

/** Кто утверждает устав: роль спонсора из src/data/project.ts. */
const SPONSOR_ROLE = ROLES.find((r) => r.id === 'sponsor');

export function Approval({ className = '' }: { className?: string }) {
  if (!SPONSOR_ROLE) return null;
  const who = SPONSOR_ROLE.title.charAt(0).toLowerCase() + SPONSOR_ROLE.title.slice(1);
  return (
    <p className={`t-small flex items-start gap-[var(--gap-1)] leading-snug text-soft ${className}`}>
      <BadgeCheck aria-hidden className="mt-[0.1em] size-[1.25em] shrink-0 text-secondary" strokeWidth={1.8} />
      <span className="min-w-0">
        Устав утверждает <span className="font-semibold text-white">{who}</span>
      </span>
    </p>
  );
}
