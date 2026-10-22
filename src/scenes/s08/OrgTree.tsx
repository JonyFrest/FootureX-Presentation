import { memo, useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Reveal, useScene } from '@/components/scene';
import { CountUp } from '@/components/ui';
import type { DepartmentId } from '@/data/hr';
import { DIRECTION_FORMS, EMPLOYEE_FORMS, plural } from './shared';
import { ORG_ROOT, ORG_TOTAL, ORG_UNITS, UNIT_ICONS, type OrgUnit } from './orgData';

/** Одна ветка дерева на телефоне: заголовок-кнопка и раскрывающиеся детали. */
function TreeItem({
  unit,
  open,
  onToggle,
  root = false,
}: {
  unit: OrgUnit;
  open: boolean;
  onToggle: () => void;
  root?: boolean;
}) {
  const { reducedMotion } = useScene();
  const regionId = useId();
  const Icon = UNIT_ICONS[unit.id];
  return (
    <div
      className={`${root ? 'glass-strong' : 'glass'} overflow-hidden transition-[border-color,box-shadow] duration-300`}
      style={
        open
          ? { borderColor: 'var(--glass-border-hi)', boxShadow: 'var(--glow-blue)' }
          : root
            ? { background: 'linear-gradient(160deg, rgba(37,80,250,0.3), rgba(10,16,32,0.82) 70%)' }
            : undefined
      }
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={regionId}
        className="flex w-full cursor-pointer items-center gap-3 p-3 text-left"
      >
        <span
          className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-highlight/25 bg-primary/15 text-highlight"
          aria-hidden
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="t-small block font-semibold leading-snug text-white">{root ? unit.head : unit.name}</span>
          <span className="t-micro block text-soft">{root ? unit.name : unit.head}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-display text-[18px] leading-none text-white t-num">{unit.headcount}</span>
          <span className="t-micro text-mute">чел.</span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-highlight transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={regionId}
            key="details"
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reducedMotion ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-3 pt-2.5 pb-3">
              <p className="t-eyebrow">Зоны ответственности</p>
              <ul className="mt-1.5 space-y-1">
                {unit.responsibilities.map((r) => (
                  <li key={r} className="t-small flex items-start gap-2 text-ice">
                    <span className="mt-[0.6em] size-1.5 shrink-0 rotate-45 bg-secondary" aria-hidden />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              {unit.members.length > 0 ? (
                <>
                  <p className="t-eyebrow mt-3">Сотрудники</p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {unit.members.map((m) => (
                      <li
                        key={m.id}
                        className="t-micro inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-[rgba(10,16,32,0.72)] px-2 py-1 text-soft"
                      >
                        {m.title}
                        {m.count > 1 ? (
                          <span className="rounded-full bg-secondary/25 px-1.5 font-semibold text-ice t-num">×{m.count}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const TotalCount = memo(function TotalCount() {
  return <CountUp to={ORG_TOTAL} className="t-stat text-gradient" />;
});

/** Оргструктура на телефоне: вертикальное дерево-аккордеон. */
export function OrgTree() {
  const [open, setOpen] = useState<DepartmentId | null>('tech');
  const toggle = (id: DepartmentId) => setOpen((o) => (o === id ? null : id));

  return (
    <div>
      <Reveal delay={0.15}>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <TotalCount />
          <span className="t-h3 text-white">
            {plural(ORG_TOTAL, EMPLOYEE_FORMS)} · этап 1 <span className="text-highlight">(план)</span>
          </span>
        </div>
        <p className="t-small mt-1 text-soft">CEO и {ORG_UNITS.length} {plural(ORG_UNITS.length, DIRECTION_FORMS)}</p>
      </Reveal>

      <Reveal delay={0.22} className="mt-4">
        <TreeItem unit={ORG_ROOT} root open={open === ORG_ROOT.id} onToggle={() => toggle(ORG_ROOT.id)} />
      </Reveal>

      {/* Вертикальная ось дерева и отводы к направлениям (ось заканчивается на последнем отводе). */}
      <ul className="relative ml-5 pt-3 pl-4">
        <span aria-hidden className="absolute top-0 left-0 h-3 w-px bg-highlight/35" />
        {ORG_UNITS.map((unit, i) => {
          const last = i === ORG_UNITS.length - 1;
          return (
            <Reveal as="li" key={unit.id} delay={0.28 + i * 0.05} className={`relative ${last ? '' : 'mb-2.5'}`}>
              <span
                aria-hidden
                className="absolute top-0 -left-4 w-px bg-highlight/35"
                style={{ height: last ? 31 : 'calc(100% + 10px)' }}
              />
              <span aria-hidden className="absolute top-[30px] -left-4 h-px w-4 bg-highlight/35" />
              <TreeItem unit={unit} open={open === unit.id} onToggle={() => toggle(unit.id)} />
            </Reveal>
          );
        })}
      </ul>
    </div>
  );
}
