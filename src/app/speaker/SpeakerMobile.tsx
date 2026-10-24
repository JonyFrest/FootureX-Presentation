import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ListOrdered, Pause, Play, RotateCcw, X } from 'lucide-react';
import { SCENES, SCENE_COUNT, TOTAL_DURATION_SEC, pad2 } from '@/data/scenes';
import { formatRoom } from '@/app/remote/relay';
import { fmt, paceLabel } from './format';
import { ConnectCard, LINK_LABEL, LINK_SHORT, LinkIcon, type SpeakerViewProps } from './parts';
import type { LinkState } from './useSpeakerSync';

/** Размеры текста выступления, px; переключаются кнопкой «Aa» и запоминаются. */
const FONT_STEPS = [16, 18, 20, 23, 26];
const FONT_KEY = 'footurex-speaker-font';

function useFontStep() {
  const [step, setStep] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(FONT_KEY));
      return Number.isInteger(saved) && saved >= 0 && saved < FONT_STEPS.length && localStorage.getItem(FONT_KEY) !== null ? saved : 2;
    } catch {
      return 2;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(FONT_KEY, String(step));
    } catch {
      /* не критично */
    }
  }, [step]);
  return [step, () => setStep((s) => (s + 1) % FONT_STEPS.length)] as const;
}

const PILL_TONE: Record<LinkState, string> = {
  linked: 'border-[#6ee7a8]/40 text-[#6ee7a8]',
  waiting: 'border-[#ffc46b]/40 text-[#ffc46b]',
  connecting: 'border-secondary/40 text-highlight',
  offline: 'border-[#ff8a80]/40 text-[#ff8a80]',
  standalone: 'border-white/15 text-mute',
};

/**
 * Окно докладчика на телефоне: крупные «Назад / Далее» под большим пальцем, таймер,
 * текст выступления с регулируемым размером и список сцен в нижней шторке.
 * В альбомной ориентации текст слева, таймер и кнопки справа.
 */
export function SpeakerMobile(props: SpeakerViewProps & { landscape: boolean }) {
  const { index, scene, next, notes, elapsed, sceneElapsed, timer, link, room, offerConnect, go, connect, disconnect, landscape } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const [fontStep, nextFontStep] = useFontStep();
  const notesRef = useRef<HTMLElement>(null);

  // Новая сцена — текст с начала.
  useEffect(() => {
    notesRef.current?.scrollTo({ top: 0 });
  }, [index]);

  const overScene = sceneElapsed > scene.durationSec;

  const header = (
    <header className="flex shrink-0 items-center gap-2 px-3 pt-[calc(var(--safe-top)+8px)] pb-2">
      <RoundButton label="Сцены и подключение" onClick={() => setMenuOpen(true)}>
        <ListOrdered className="size-5" aria-hidden />
      </RoundButton>
      <p className="font-display t-num text-[22px] leading-none" aria-label={`Сцена ${index + 1} из ${SCENE_COUNT}`}>
        {pad2(index + 1)}
        <span className="text-sm text-mute"> / {pad2(SCENE_COUNT)}</span>
      </p>
      <span className="flex-1" />
      <span
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${PILL_TONE[link]}`}
        title={LINK_LABEL[link]}
        data-link={link}
      >
        <LinkIcon link={link} />
        {LINK_SHORT[link]}
      </span>
      <RoundButton label={`Размер текста: ${FONT_STEPS[fontStep]} px`} onClick={nextFontStep}>
        <span className="text-[15px] font-semibold" aria-hidden>
          Aa
        </span>
      </RoundButton>
    </header>
  );

  const progressBar = (
    <div className="mx-3 h-1 shrink-0 overflow-hidden rounded-full bg-white/10" aria-hidden>
      <div
        className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-[width] duration-500"
        style={{ width: `${((index + 1) / SCENE_COUNT) * 100}%` }}
      />
    </div>
  );

  const playButton = (
    <button
      type="button"
      onClick={timer.toggle}
      aria-label={timer.running ? 'Пауза таймера' : 'Старт таймера'}
      className="flex size-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary active:scale-95"
    >
      {timer.running ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
    </button>
  );
  const elapsedLabel = (
    <p className="font-display t-num text-[22px] leading-none" data-speaker-elapsed>
      {fmt(elapsed)}
      <span className="ml-1.5 font-sans text-xs text-mute">из {fmt(TOTAL_DURATION_SEC)}</span>
    </p>
  );
  const pace = paceLabel(elapsed, index, timer.started, true);
  const sceneTime = (
    <span className={`t-num ${overScene ? 'text-[#ffc46b]' : 'text-ice'}`}>
      {fmt(sceneElapsed)} / {fmt(scene.durationSec)}
    </span>
  );

  // Портрет — одна строка; альбомная колонка узкая — строки друг под другом.
  const timerCard = landscape ? (
    <section aria-label="Таймер выступления" className="glass shrink-0 space-y-2 px-3 py-3">
      <div className="flex items-center gap-3">
        {playButton}
        {elapsedLabel}
      </div>
      <p className="text-xs text-highlight">{pace}</p>
      <p className="flex justify-between text-sm">
        <span className="text-mute">На сцене</span>
        {sceneTime}
      </p>
    </section>
  ) : (
    <section aria-label="Таймер выступления" className="glass flex shrink-0 items-center gap-3 px-3 py-2.5">
      {playButton}
      <div className="min-w-0 flex-1">
        {elapsedLabel}
        <p className="mt-1 truncate text-xs text-highlight">{pace}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] tracking-wider text-mute uppercase">Сцена</p>
        <p className="text-sm">{sceneTime}</p>
      </div>
    </section>
  );

  const notesBlock = (
    <main ref={notesRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-6">
      {link === 'waiting' ? (
        <Notice>
          Презентация не на связи. На ноутбуке откройте «Пульт» (значок телефона или клавиша P){room ? <> — там должен быть код {formatRoom(room)}</> : null}.
        </Notice>
      ) : link === 'offline' ? (
        <Notice>Нет связи с сервером — проверяем снова. Пока можно листать текст здесь.</Notice>
      ) : null}
      {offerConnect ? <ConnectCard onConnect={connect} className="mb-5" /> : null}
      <p className="t-eyebrow">{scene.eyebrow}</p>
      <h1 className="mt-2 font-display text-[21px] leading-tight">{scene.title}</h1>
      <div className="mt-4 space-y-4 leading-relaxed text-ice" style={{ fontSize: FONT_STEPS[fontStep] }} aria-live="polite">
        {notes.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {landscape ? null : (
        <p className="mt-6 text-sm text-mute">
          Далее:{' '}
          {next ? (
            <span className="text-soft">
              {pad2(next.number)} · {next.title}
            </span>
          ) : (
            'конец презентации'
          )}
        </p>
      )}
    </main>
  );

  const controls = (
    <div className="grid shrink-0 grid-cols-[1fr_1.6fr] gap-3">
      <button
        type="button"
        onClick={() => go({ type: 'command', action: 'prev' })}
        disabled={index === 0}
        className="glass flex h-16 cursor-pointer touch-manipulation items-center justify-center gap-1.5 text-lg transition active:scale-[0.97] disabled:opacity-35"
      >
        <ChevronLeft className="size-6" aria-hidden /> Назад
      </button>
      <button
        type="button"
        onClick={() => go({ type: 'command', action: 'next' })}
        disabled={index === SCENE_COUNT - 1}
        className="flex h-16 cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-gradient-to-br from-secondary to-primary text-lg font-medium shadow-[0_12px_30px_-12px_rgba(37,80,250,0.9)] transition active:scale-[0.97] disabled:opacity-35"
      >
        Далее <ChevronRight className="size-6" aria-hidden />
      </button>
    </div>
  );

  const sheet = (
    <MenuSheet
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      index={index}
      link={link}
      room={room}
      go={(i) => {
        go({ type: 'goto', index: i });
        setMenuOpen(false);
      }}
      connect={(code) => {
        connect(code);
        setMenuOpen(false);
      }}
      disconnect={disconnect}
      resetTimer={timer.reset}
    />
  );

  if (landscape) {
    return (
      <div
        className="grid bg-deep text-white"
        style={{
          height: '100dvh',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(250px, 36%)',
          paddingLeft: 'var(--safe-left)',
          paddingRight: 'var(--safe-right)',
        }}
        data-speaker-layout="phone-landscape"
      >
        <div className="flex min-h-0 flex-col">
          {header}
          {progressBar}
          {notesBlock}
        </div>
        <div className="flex min-h-0 flex-col gap-3 border-l border-white/10 p-3 pb-[calc(var(--safe-bottom)+12px)]">
          {timerCard}
          <p className="min-h-0 flex-1 overflow-hidden text-sm leading-snug text-mute">
            Далее: <span className="text-soft">{next ? `${pad2(next.number)} · ${next.title}` : 'конец презентации'}</span>
          </p>
          {controls}
        </div>
        {sheet}
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-deep text-white" style={{ height: '100dvh' }} data-speaker-layout="phone">
      {header}
      {progressBar}
      <div className="shrink-0 px-3 pt-3">{timerCard}</div>
      {notesBlock}
      <footer className="shrink-0 border-t border-white/10 bg-deep px-3 pt-3 pb-[calc(var(--safe-bottom)+12px)]">{controls}</footer>
      {sheet}
    </div>
  );
}

function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-ice active:scale-95"
    >
      {children}
    </button>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 rounded-[var(--radius-sm)] border border-[#ffc46b]/30 bg-[#ffc46b]/10 px-3 py-2 text-sm leading-snug text-[#ffd99a]" role="status">
      {children}
    </p>
  );
}

interface MenuSheetProps {
  open: boolean;
  onClose: () => void;
  index: number;
  link: LinkState;
  room: string | null;
  go: (index: number) => void;
  connect: (room: string) => void;
  disconnect: () => void;
  resetTimer: () => void;
}

/** Нижняя шторка: подключение, сброс таймера и переход к любой сцене. */
function MenuSheet({ open, onClose, index, link, room, go, connect, disconnect, resetTimer }: MenuSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  // Фокус ставим только при открытии: окно перерисовывается каждые 250 мс из-за таймера.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      inert={!open}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-deep/75" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Сцены и подключение"
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] max-w-[640px] flex-col rounded-t-[var(--radius-lg)] border-t border-white/10 bg-surface transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20" aria-hidden />
        <div className="flex shrink-0 items-center justify-between px-4 pt-2 pb-1">
          <p className="t-eyebrow">Сцены</p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex size-10 cursor-pointer items-center justify-center rounded-full text-soft hover:bg-white/10"
            aria-label="Закрыть"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-3">
          {room ? (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-white/10 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-ice">Код {formatRoom(room)}</p>
                <p className="text-xs text-mute">{LINK_LABEL[link]}</p>
              </div>
              <button type="button" onClick={disconnect} className="shrink-0 cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-sm text-soft">
                Отключиться
              </button>
            </div>
          ) : link !== 'linked' ? (
            <ConnectCard onConnect={connect} className="mb-3" />
          ) : null}
          <button
            type="button"
            onClick={() => {
              resetTimer();
              onClose();
            }}
            className="mb-3 flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-white/10 px-3 py-2.5 text-left text-sm text-soft"
          >
            <RotateCcw className="size-4" aria-hidden /> Сбросить таймер
          </button>
          <ol className="space-y-1 pb-2">
            {SCENES.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === index ? 'step' : undefined}
                  className={`flex min-h-12 w-full cursor-pointer touch-manipulation items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left ${
                    i === index ? 'bg-primary/25 text-white' : i < index ? 'text-mute' : 'text-soft'
                  }`}
                >
                  <span className="font-display t-num w-7 text-sm text-highlight">{pad2(i + 1)}</span>
                  <span className="flex-1 leading-snug">{s.title}</span>
                  <span className="t-num text-xs text-mute">{fmt(s.durationSec)}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
