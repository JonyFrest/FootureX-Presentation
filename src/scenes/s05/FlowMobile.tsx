import { useState, type ReactNode } from 'react';
import { ArrowDown, ChartLine, CornerLeftUp, Users } from 'lucide-react';
import { AMO, AMO_NOTE, EFFECTIVENESS, GROWTH_ITEMS, HR_PROCESSES, LOOP_LABEL, type AmoId } from './model';

type Sel = { kind: 'hr'; id: string } | { kind: 'amo'; id: AmoId } | null;

/** Телефон: вертикальный поток. Тап по процессу подсвечивает факторы AMO, тап по фактору — процессы. */
export function FlowMobile({ reducedMotion }: { reducedMotion: boolean }) {
  const [sel, setSel] = useState<Sel>(null);
  const hrOn = (id: string, feeds: readonly AmoId[]) =>
    sel === null ? null : sel.kind === 'hr' ? sel.id === id : feeds.includes(sel.id);
  const amoOn = (id: AmoId) =>
    sel === null
      ? null
      : sel.kind === 'amo'
        ? sel.id === id
        : (HR_PROCESSES.find((p) => p.id === sel.id)?.feeds.includes(id) ?? false);

  return (
    <div className="flex flex-col">
      <Section n="01" en="HR Processes" ru="HR-процессы">
        <div className="grid grid-cols-2 gap-2">
          {HR_PROCESSES.map((p) => {
            const on = hrOn(p.id, p.feeds);
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={sel?.kind === 'hr' && sel.id === p.id}
                onClick={() => setSel(sel?.kind === 'hr' && sel.id === p.id ? null : { kind: 'hr', id: p.id })}
                className={`flex cursor-pointer items-center gap-2 rounded-[12px] border px-3 py-2 text-left transition-[transform,border-color,background-color,opacity] duration-300 hover:-translate-y-0.5 ${
                  on ? 'border-secondary/80 bg-[rgba(18,34,82,0.88)]' : 'border-white/10 bg-[rgba(10,16,32,0.78)]'
                } ${on === false ? 'opacity-45' : ''}`}
              >
                <Icon className="size-4 shrink-0 text-secondary" aria-hidden strokeWidth={1.8} />
                <span className="t-small font-medium text-white">{p.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Connector reducedMotion={reducedMotion} />

      <Section n="02" en="Employee · AMO" ru="Сотрудник" focal>
        <div className="glass-strong grid grid-cols-3 gap-2 p-2" style={{ borderColor: 'rgba(37,147,250,0.55)' }}>
          {AMO.map((a) => {
            const on = amoOn(a.id);
            return (
              <button
                key={a.id}
                type="button"
                aria-pressed={sel?.kind === 'amo' && sel.id === a.id}
                onClick={() => setSel(sel?.kind === 'amo' && sel.id === a.id ? null : { kind: 'amo', id: a.id })}
                className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-[12px] border px-1 py-2 text-center transition-[transform,border-color,background-color,opacity] duration-300 hover:-translate-y-0.5 ${
                  on ? 'border-secondary/80 bg-[rgba(37,80,250,0.22)]' : 'border-white/8 bg-white/[0.03]'
                } ${on === false ? 'opacity-45' : ''}`}
              >
                <span className="t-h2 text-brand-gradient leading-none">{a.id}</span>
                <span className="t-micro font-semibold text-white">{a.ru}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Connector reducedMotion={reducedMotion} />

      <Section n="03" en="Performance" ru="Эффективность">
        <ul className="glass flex flex-col gap-1.5 p-3">
          {EFFECTIVENESS.map((e) => {
            const Icon = e.icon;
            return (
              <li key={e.id} className="flex items-center gap-2">
                <Icon className="size-4 shrink-0 text-secondary" aria-hidden strokeWidth={1.8} />
                <span className="t-small text-white">{e.label}</span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Connector reducedMotion={reducedMotion} />

      <Section n="04" en="Growth" ru="Рост FootureX">
        <ul className="glass flex flex-col gap-1.5 p-3">
          {GROWTH_ITEMS.map((item, i) => (
            <li key={item} className="flex items-center gap-2">
              <span className="t-micro font-display text-highlight">{String(i + 1).padStart(2, '0')}</span>
              <span className="t-small text-white">{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-dashed border-highlight/35 px-3 py-2.5">
        <CornerLeftUp className="size-5 shrink-0 text-secondary" aria-hidden />
        <p className="t-small text-ice">
          <ChartLine className="mr-1 inline size-4 align-[-2px] text-secondary" aria-hidden />
          <span className="font-semibold text-white">{LOOP_LABEL}</span> — обратная связь к HR-процессам
        </p>
      </div>
      <p className="t-micro mt-2 text-mute">{AMO_NOTE}</p>
    </div>
  );
}

function Section({ n, en, ru, focal = false, children }: { n: string; en: string; ru: string; focal?: boolean; children: ReactNode }) {
  return (
    <section>
      <p className="t-micro font-display uppercase tracking-[0.16em] text-highlight">
        <span className="text-white">{n}</span> · {en}
      </p>
      <h2 className={`t-h3 mb-2 flex items-center gap-2 ${focal ? 'text-gradient' : ''}`}>
        {focal ? <Users className="size-4 text-highlight" aria-hidden /> : null}
        {ru}
      </h2>
      {children}
    </section>
  );
}

function Connector({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="relative flex h-9 items-center justify-center" aria-hidden>
      <span className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-secondary/0 via-secondary/80 to-secondary/0" />
      {!reducedMotion ? (
        <span className="fx-s05-dot absolute left-1/2 top-1 size-1.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_8px_2px_rgba(37,147,250,0.8)]" />
      ) : null}
      <ArrowDown className="relative size-4 text-highlight" />
      <style>{`@keyframes fx-s05-fall{0%{top:4px;opacity:0}20%{opacity:1}80%{opacity:1}100%{top:calc(100% - 8px);opacity:0}}.fx-s05-dot{animation:fx-s05-fall 1.8s ease-in-out infinite}`}</style>
    </div>
  );
}
