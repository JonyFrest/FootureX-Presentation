import { ArrowUpRight } from 'lucide-react';
import { SceneFrame, Reveal } from '@/components/scene';
import { Glass } from '@/components/ui';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { SOURCES } from '@/data/sources';
import { pad2 } from '@/data/scenes';

const KIND_LABEL = { law: 'Право', book: 'Учебник', report: 'Отчёт', stat: 'Статистика' } as const;

/** Сцена 15 — финал: логотип, благодарность и проверяемые источники 2021–2026. */
export default function Scene15Final() {
  return (
    <SceneFrame justify="center">
      <div className="grid items-center gap-[var(--gap-4)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col items-start">
          <Reveal y={12}>
            <BrandLogo size="clamp(26px, calc(var(--u) * 2.5), 48px)" tagline="Uzbekistan" />
          </Reveal>
          <Reveal delay={0.08} y={20}>
            <h1
              className="mt-[var(--gap-4)] font-display leading-[1.08]"
              style={{ fontSize: 'clamp(32px, calc(var(--u) * 3.7), 76px)' }}
            >
              <span className="text-gradient">Спасибо</span>
              <br />
              <span className="whitespace-nowrap">за внимание!</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="t-body mt-[var(--gap-3)] max-w-[34ch] text-soft">Готов ответить на ваши вопросы.</p>
          </Reveal>
          <Reveal delay={0.22}>
            <p className="mt-[var(--gap-3)] font-display text-highlight" style={{ fontSize: 'var(--fs-h3)' }}>
              Creating a Digital Football Era
            </p>
          </Reveal>
          <Reveal delay={0.3} className="mt-[var(--gap-4)] w-full">
            <dl className="t-small grid max-w-[520px] grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 border-l border-secondary/40 pl-4">
              <dt className="text-mute">Студент</dt>
              <dd className="text-ice">Зафарбек Якубов · RB 25-01</dd>
              <dt className="text-mute">Преподаватель</dt>
              <dd className="text-ice">Парвиз Мамедов</dd>
              <dt className="text-mute">Университет</dt>
              <dd className="text-ice">TIUE · Ташкент, 2026</dd>
            </dl>
          </Reveal>
        </div>

        <Reveal delay={0.2} x={24} y={0}>
          <Glass strong className="p-[var(--gap-3)]" data-interactive>
            <div className="mb-[var(--gap-2)] flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="t-eyebrow">Источники · 2021–2026</h2>
              <span className="t-micro text-mute">{SOURCES.length} позиций · проверено 22.10.2026</span>
            </div>
            <ol className="grid gap-x-[var(--gap-3)] gap-y-[clamp(4px,calc(var(--u)*0.45),9px)] xl:grid-cols-2">
              {SOURCES.map((source, i) => (
                <li key={source.id} className="min-w-0">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex gap-2.5 rounded-[var(--radius-sm)] px-2 py-1 transition-colors duration-300 hover:bg-white/[0.05] focus-visible:bg-white/[0.05]"
                  >
                    <span className="font-display t-micro t-num w-[2.4ch] shrink-0 pt-[0.15em] text-highlight">{pad2(i + 1)}</span>
                    <span className="min-w-0">
                      <span className="t-micro block leading-snug text-ice group-hover:text-white">{source.short}</span>
                      <span className="t-micro mt-0.5 flex items-center gap-1 text-mute group-hover:text-secondary">
                        {KIND_LABEL[source.kind]} · {source.site}
                        <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </Glass>
        </Reveal>
      </div>
    </SceneFrame>
  );
}
