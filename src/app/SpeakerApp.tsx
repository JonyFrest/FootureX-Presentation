import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { SCENES, SCENE_COUNT, TOTAL_DURATION_SEC, pad2 } from '@/data/scenes';
import { SPEAKER_NOTES } from '@/data/speakerNotes';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { openChannel, type SpeakerMessage } from './speakerChannel';

const sign = (sec: number) => (sec < 0 ? '−' : '');
const fmt = (sec: number) => {
  const s = Math.max(0, Math.floor(Math.abs(sec)));
  return `${sign(sec)}${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
};

/** Плановое время начала каждой сцены от начала выступления, с. */
const PLANNED_START = SCENES.reduce<number[]>((acc, _s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].durationSec);
  return acc;
}, []);

function useNow(intervalMs = 250) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Окно докладчика: номер и название сцены, текст выступления, таймер.
 * Синхронизируется с основной презентацией через BroadcastChannel; без неё работает автономно.
 */
export default function SpeakerApp() {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [hasChannel] = useState(() => typeof BroadcastChannel !== 'undefined');
  const [index, setIndex] = useState(0);
  const [lastSeen, setLastSeen] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsedBase, setElapsedBase] = useState(0); // накоплено до последнего старта, мс
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [sceneEnteredAt, setSceneEnteredAt] = useState(() => Date.now());
  const now = useNow();
  const prevIndex = useRef(index);
  const synced = useRef(false);

  const connected = hasChannel && now - lastSeen < 6000;
  const elapsed = (elapsedBase + (running && startedAt ? now - startedAt : 0)) / 1000;

  const start = useCallback(() => {
    setStartedAt(Date.now());
    setRunning(true);
  }, []);
  const pause = useCallback(() => {
    setElapsedBase((b) => b + (startedAt ? Date.now() - startedAt : 0));
    setStartedAt(null);
    setRunning(false);
  }, [startedAt]);
  const reset = useCallback(() => {
    setElapsedBase(0);
    setStartedAt(running ? Date.now() : null);
    setSceneEnteredAt(Date.now());
  }, [running]);

  // Синхронизация с основным окном.
  useEffect(() => {
    const channel = openChannel();
    if (!channel) return;
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<SpeakerMessage>) => {
      const msg = event.data;
      if (msg.type === 'state') {
        // Первичная синхронизация — не переход: таймер от неё не стартует.
        if (!synced.current) {
          synced.current = true;
          prevIndex.current = msg.index;
        }
        setLastSeen(Date.now());
        setIndex(msg.index);
      }
    };
    const hello: SpeakerMessage = { type: 'hello' };
    channel.postMessage(hello);
    const ping = window.setInterval(() => channel.postMessage(hello), 2500);
    return () => {
      window.clearInterval(ping);
      channelRef.current = null;
      channel.close();
    };
  }, []);

  // Смена сцены: сбрасываем таймер сцены; первый переход запускает общий таймер.
  useEffect(() => {
    if (prevIndex.current === index) return;
    prevIndex.current = index;
    setSceneEnteredAt(Date.now());
    if (!running && elapsedBase === 0) start();
  }, [index, running, elapsedBase, start]);

  const send = useCallback(
    (msg: SpeakerMessage) => {
      if (connected && channelRef.current) {
        channelRef.current.postMessage(msg);
        return;
      }
      if (msg.type === 'command') {
        setIndex((i) => {
          if (msg.action === 'next') return Math.min(i + 1, SCENE_COUNT - 1);
          if (msg.action === 'prev') return Math.max(i - 1, 0);
          return msg.action === 'first' ? 0 : SCENE_COUNT - 1;
        });
      } else if (msg.type === 'goto') setIndex(msg.index);
    },
    [connected],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      const target = e.target as HTMLElement;
      if (target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        send({ type: 'command', action: 'next' });
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        send({ type: 'command', action: 'prev' });
      } else if (e.key === 'Home') send({ type: 'command', action: 'first' });
      else if (e.key === 'End') send({ type: 'command', action: 'last' });
      else if (['t', 'T', 'е', 'Е'].includes(e.key)) (running ? pause : start)();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [send, running, pause, start]);

  useEffect(() => {
    document.title = `Докладчик · ${pad2(index + 1)} / ${SCENE_COUNT} — FootureX`;
  }, [index]);

  const scene = SCENES[index];
  const next = SCENES[index + 1];
  const notes = SPEAKER_NOTES[scene.id] ?? [];
  const sceneElapsed = (now - sceneEnteredAt) / 1000;
  const plannedNow = PLANNED_START[index];
  const delta = elapsed - plannedNow; // > 0 — отстаём от плана
  const progress = Math.min(1, elapsed / TOTAL_DURATION_SEC);
  const paceLabel =
    !running && elapsed === 0
      ? 'Таймер не запущен — T или «Старт»'
      : delta > 20
        ? `Отставание от плана: ${fmt(delta)}`
        : delta < -20
          ? `Запас по времени: ${fmt(-delta)}`
          : 'Идёте по графику';

  return (
    <div className="overflow-auto bg-deep text-white" style={{ height: '100dvh' }}>
      <div className="mx-auto flex min-h-full max-w-[1400px] flex-col gap-5 p-5 md:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo size="20px" />
            <span className="t-eyebrow">Режим докладчика</span>
          </div>
          <span
            className={`chip ${connected ? '' : 'chip-plan'}`}
            title={connected ? 'Окно синхронизировано с презентацией' : 'Откройте презентацию в этом же браузере'}
          >
            {connected ? <Wifi className="size-3.5" aria-hidden /> : <WifiOff className="size-3.5" aria-hidden />}
            {connected ? 'Синхронизировано с презентацией' : 'Автономный режим'}
          </span>
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <main className="glass-strong flex flex-col p-6 md:p-8">
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
                  onClick={() => send({ type: 'command', action: 'prev' })}
                  disabled={index === 0}
                >
                  <ChevronLeft className="size-5" aria-hidden /> Назад
                </button>
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-br from-secondary to-primary px-6 py-3 font-medium shadow-[0_10px_30px_-10px_rgba(37,80,250,0.9)] transition hover:brightness-110 disabled:opacity-40"
                  onClick={() => send({ type: 'command', action: 'next' })}
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
              <p className="t-small mt-3 text-highlight">{paceLabel}</p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={running ? pause : start}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-br from-secondary to-primary px-4 py-2.5 font-medium transition hover:brightness-110"
                >
                  {running ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
                  {running ? 'Пауза' : 'Старт'}
                </button>
                <button
                  type="button"
                  onClick={reset}
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
                      onClick={() => send({ type: 'goto', index: i })}
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
          ← → пробел — листать презентацию · T — старт/пауза таймера · держите это окно на ноутбуке, а презентацию — на проекторе.
        </p>
      </div>
    </div>
  );
}
