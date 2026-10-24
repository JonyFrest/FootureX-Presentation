import { useCallback, useEffect, useRef, useState } from 'react';
import { SCENES, SCENE_COUNT, clampIndex, pad2 } from '@/data/scenes';
import { SPEAKER_NOTES } from '@/data/speakerNotes';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ROOM_PATTERN, type RemoteCommandInput } from './remote/relay';
import { SpeakerDesktop } from './speaker/SpeakerDesktop';
import { SpeakerMobile } from './speaker/SpeakerMobile';
import { useGrace } from './speaker/parts';
import { useSpeakerSync } from './speaker/useSpeakerSync';
import { useSpeakerTimer } from './speaker/useSpeakerTimer';
import { useWakeLock } from './speaker/useWakeLock';

/** Раскладка ноутбука: две колонки. Телефоны и планшеты в портрете — мобильная раскладка. */
const DESKTOP_QUERY = '(min-width: 1024px) and (min-height: 620px)';
/** Телефон в альбомной ориентации: текст слева, кнопки справа. */
const LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 540px)';

function useNow(intervalMs = 250) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function readRoom(): string | null {
  const room = new URLSearchParams(window.location.search).get('room');
  return room && ROOM_PATTERN.test(room) ? room : null;
}

/** Код комнаты в адресе: перезагрузка телефона не теряет подключение. */
function writeRoom(room: string | null) {
  const url = new URL(window.location.href);
  if (room) url.searchParams.set('room', room);
  else url.searchParams.delete('room');
  window.history.replaceState(null, '', url);
}

/**
 * Окно докладчика: номер и название сцены, текст выступления, таймер.
 * На ноутбуке синхронизируется с презентацией в том же браузере (BroadcastChannel),
 * на телефоне — через ретранслятор по коду комнаты (?room=123456, QR-код в окне «Пульт»).
 * Без презентации работает автономно — для репетиции.
 */
export default function SpeakerApp() {
  const [room, setRoom] = useState(readRoom);
  const [index, setIndex] = useState(0);
  const [sceneEnteredAt, setSceneEnteredAt] = useState(() => Date.now());
  const timer = useSpeakerTimer();
  const now = useNow();
  const prevIndex = useRef(index);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const landscape = useMediaQuery(LANDSCAPE_QUERY);
  const graceOver = useGrace(1500);

  const onIndex = useCallback((next: number, initial: boolean) => {
    // Первичная синхронизация — не переход: таймер от неё не стартует.
    if (initial) prevIndex.current = next;
    setIndex(next);
  }, []);
  const { link, send } = useSpeakerSync(room, onIndex);

  // Смена сцены: сбрасываем таймер сцены; первый переход запускает общий таймер.
  const { started, start } = timer;
  useEffect(() => {
    if (prevIndex.current === index) return;
    prevIndex.current = index;
    setSceneEnteredAt(Date.now());
    if (!started) start();
  }, [index, started, start]);

  const go = useCallback(
    (command: RemoteCommandInput) => {
      navigator.vibrate?.(10);
      if (send(command)) return;
      // Презентации нет на связи — листаем текст выступления сами.
      setIndex((i) => {
        if (command.type === 'goto') return clampIndex(command.index);
        if (command.action === 'next') return Math.min(i + 1, SCENE_COUNT - 1);
        if (command.action === 'prev') return Math.max(i - 1, 0);
        return command.action === 'first' ? 0 : SCENE_COUNT - 1;
      });
    },
    [send],
  );

  const { toggle } = timer;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea')) return;
      if (target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        go({ type: 'command', action: 'next' });
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        go({ type: 'command', action: 'prev' });
      } else if (e.key === 'Home') go({ type: 'command', action: 'first' });
      else if (e.key === 'End') go({ type: 'command', action: 'last' });
      else if (['t', 'T', 'е', 'Е'].includes(e.key)) toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, toggle]);

  useEffect(() => {
    document.title = `Докладчик · ${pad2(index + 1)} / ${SCENE_COUNT} — FootureX`;
  }, [index]);

  // Экран телефона не гаснет, пока идёт доклад.
  useWakeLock(link === 'linked' || timer.running);

  const connect = useCallback((code: string) => {
    writeRoom(code);
    setRoom(code);
  }, []);
  const disconnect = useCallback(() => {
    writeRoom(null);
    setRoom(null);
  }, []);

  const scene = SCENES[index];
  const view = {
    index,
    scene,
    next: SCENES[index + 1],
    notes: SPEAKER_NOTES[scene.id] ?? [],
    elapsed: timer.elapsedSec(now),
    sceneElapsed: (now - sceneEnteredAt) / 1000,
    timer,
    link,
    room,
    offerConnect: !room && link !== 'linked' && graceOver,
    go,
    connect,
    disconnect,
  };

  return desktop ? <SpeakerDesktop {...view} /> : <SpeakerMobile {...view} landscape={landscape} />;
}
