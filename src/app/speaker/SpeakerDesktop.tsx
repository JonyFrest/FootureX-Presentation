import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { SCENES, SCENE_COUNT, TOTAL_DURATION_SEC, pad2 } from '@/data/scenes';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { formatRoom } from '@/app/remote/relay';
import { PLANNED_START, fmt, paceLabel } from './format';
import { ConnectCard, LINK_LABEL, LinkIcon, type SpeakerViewProps } from './parts';

/** Окно докладчика на ноутбуке: текст выступления слева, таймер и список сцен справа. */
export function SpeakerDesktop(props: SpeakerViewProps) {
  const { index, scene, next, notes, elapsed, sceneElapsed, timer, link, room, offerConnect, go, connect, disconnect } = props;
  const plannedNow = PLANNED_START[index];
  const progress = Math.min(1, elapsed / TOTAL_DURATION_SEC);

  return (
    <div className="overflow-auto bg-deep text-white" style={{ height: '100dvh' }}>
      <div className="mx-auto flex min-h-full max-w-[1400px] flex-col gap-5 p-5 md:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo size="20px" />
            <span className="t-eyebrow">Режим докладчика</span>
          </div>
          <div className="flex items-center gap-2">
            {room ? (
              <button type="button" onClick={disconnect} className="t-micro cursor-pointer text-mute underline-offset-4 hover:text-white hover:underline">
                Код {formatRoom(room)} · отключиться
              </button>
            ) : null}
            <span
              className={`chip ${link === 'linked' ? '' : 'chip-plan'}`}
              title={link === 'linked' ? 'Окно синхронизировано с презентацией' : 'Откройте презентацию в этом же браузере или подключитесь по коду'}
            >
              <LinkIcon link={link} />
              {LINK_LABEL[link]}
            </span>
          </div>
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <main className="glass-strong flex flex-col p-6 md:p-8">
            {offerConnect ? <ConnectCard onConnect={connect} className="mb-6 max-w-[560px]" /> : null}
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <span className="font-display t-num text-5xl leading-none">
                {pad2(index + 1)}
                <span className="text-2xl text-mute"> / {pad2(SCENE_COUNT)}</span>
              </span>
              <span className="t-eyebrow">{scene.eyebrow}</span>
            </div>
            <h1 className="mt-4 font-display text-2xl leading-tight md:text-3xl">{scene.title}</h1>
            <div className="hairline my-5" />
            <div className="flex-1 space-y-4 text-[clamp(18px,1.5vw,24px)] leading-relaxed text-ice" aria-live="polite">
              {notes.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="t-small text-mute">
                Далее:{' '}
                {next ? (
                  <span className="text-soft">
                    {pad2(next.number)} · {next.title}
                  </span>
                ) : (
                  'конец презентации'
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="glass flex cursor-pointer items-center gap-2 rounded-full! px-5 py-3 transition hover:border-secondary/60 disabled:opacity-40"
                  onClick={() => go({ type: 'command', action: 'prev' })}
                  disabled={index === 0}
                >
                  <ChevronLeft className="size-5" aria-hidden /> Назад
                </button>
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-br from-secondary to-primary px-6 py-3 font-medium shadow-[0_10px_30px_-10px_rgba(37,80,250,0.9)] transition hover:brightness-110 disabled:opacity-40"
                  onClick={() => go({ type: 'command', action: 'next' })}
                  disabled={index === SCENE_COUNT - 1}
                >
                  Далее <ChevronRight className="size-5" aria-hidden />
                </button>
              </div>
            </div>
          </main>

          <aside className="flex flex-col gap-5">
            <section className="glass-strong p-6" aria-label="Таймер выступления">
              <p className="t-eyebrow">Время выступления</p>
              <p className="font-display t-num mt-3 text-6xl leading-none">{fmt(elapsed)}</p>
              <p className="t-small mt-2 text-mute">
                План: {fmt(TOTAL_DURATION_SEC)} · к этой сцене по плану {fmt(plannedNow)}
              </p>
              <div className="relative mt-4 h-2 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-secondary to-primary" style={{ width: `${progress * 100}%` }} />
                <div
                  className="absolute top-[-3px] h-[14px] w-[2px] bg-ice"
                  style={{ left: `${(plannedNow / TOTAL_DURATION_SEC) * 100}%` }}
                  title="Плановая позиция для текущей сцены"
                />
              </div>
              <p className="t-small mt-3 text-highlight">{paceLabel(elapsed, index, timer.started)}</p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={timer.toggle}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-br from-secondary to-primary px-4 py-2.5 font-medium transition hover:brightness-110"
                >
                  {timer.running ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
                  {timer.running ? 'Пауза' : 'Старт'}
                </button>
                <button
                  type="button"
                  onClick={timer.reset}
                  className="glass flex cursor-pointer items-center justify-center gap-2 rounded-full! px-4 py-2.5 transition hover:border-secondary/60"
                  aria-label="Сбросить таймер"
                  title="Сбросить таймер"
                >
                  <RotateCcw className="size-4" aria-hidden />
                </button>
              </div>
            </section>

            <section className="glass-strong p-6" aria-label="Время на сцене">
              <p className="t-eyebrow">На этой сцене</p>
              <p className="font-display t-num mt-3 text-4xl leading-none">
                {fmt(sceneElapsed)}
                <span className="text-xl text-mute"> / {fmt(scene.durationSec)}</span>
              </p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${sceneElapsed > scene.durationSec ? 'bg-ice' : 'bg-secondary'}`}
                  style={{ width: `${Math.min(100, (sceneElapsed / scene.durationSec) * 100)}%` }}
                />
              </div>
            </section>

            <nav className="glass-strong flex-1 overflow-auto p-4" aria-label="Сцены">
              <ol className="space-y-1">
                {SCENES.map((s, i) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => go({ type: 'goto', index: i })}
                      aria-current={i === index ? 'step' : undefined}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-left text-sm transition ${
                        i === index ? 'bg-primary/25 text-white' : i < index ? 'text-mute hover:bg-white/5' : 'text-soft hover:bg-white/5'
                      }`}
                    >
                      <span className="font-display t-num w-6 text-xs text-highlight">{pad2(i + 1)}</span>
                      <span className="flex-1 truncate">{s.title}</span>
                      <span className="t-num text-xs text-mute">{fmt(s.durationSec)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        </div>
        <p className="t-micro text-mute">
          ← → пробел — листать презентацию · T — старт/пауза таймера · держите это окно на ноутбуке, а презентацию — на проекторе. С
          телефона: кнопка «Пульт» (P) в презентации.
        </p>
      </div>
    </div>
  );
}
