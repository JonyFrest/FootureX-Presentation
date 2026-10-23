import { useCallback, useEffect, useRef, useState } from 'react';
import { SCENE_COUNT } from '@/data/scenes';
import { openChannel, type SpeakerMessage } from '@/app/speakerChannel';
import { pollState, sendCommand, type RemoteCommandInput } from '@/app/remote/relay';

/**
 * linked — презентация на связи; waiting — сервер отвечает, презентация не подключена;
 * connecting — первое подключение; offline — нет сети; standalone — автономный режим.
 */
export type LinkState = 'linked' | 'waiting' | 'connecting' | 'offline' | 'standalone';

/** Без ответа презентации дольше этого окно докладчика считает связь потерянной, мс. */
const CHANNEL_TIMEOUT = 6000;

/**
 * Синхронизация окна докладчика с презентацией:
 * - задан room — через ретранслятор api/remote (телефон и ноутбук — разные устройства);
 * - иначе — BroadcastChannel (окно докладчика и презентация в одном браузере).
 * onIndex(index, initial) вызывается на каждый номер сцены от презентации;
 * initial — первая синхронизация (это не переход, таймер от неё не стартует).
 * send() возвращает false, если презентации нет на связи, — тогда окно листает само.
 */
export function useSpeakerSync(room: string | null, onIndex: (index: number, initial: boolean) => void) {
  const onIndexRef = useRef(onIndex);
  useEffect(() => {
    onIndexRef.current = onIndex;
  }, [onIndex]);
  const [link, setLink] = useState<LinkState>(room ? 'connecting' : 'standalone');
  const linkRef = useRef(link);
  useEffect(() => {
    linkRef.current = link;
  }, [link]);
  const sendRef = useRef<(command: RemoteCommandInput) => boolean>(() => false);

  // Один браузер: BroadcastChannel.
  useEffect(() => {
    if (room) return;
    setLink('standalone');
    const channel = openChannel();
    if (!channel) return;
    let lastSeen = 0;
    let synced = false;
    channel.onmessage = (event: MessageEvent<SpeakerMessage>) => {
      const msg = event.data;
      if (msg.type !== 'state') return;
      lastSeen = Date.now();
      setLink('linked');
      onIndexRef.current(msg.index, !synced);
      synced = true;
    };
    const hello: SpeakerMessage = { type: 'hello' };
    channel.postMessage(hello);
    const ping = window.setInterval(() => {
      channel.postMessage(hello);
      if (Date.now() - lastSeen > CHANNEL_TIMEOUT) setLink('standalone');
    }, 2500);
    sendRef.current = (command) => {
      if (Date.now() - lastSeen > CHANNEL_TIMEOUT) return false;
      channel.postMessage(command satisfies SpeakerMessage);
      return true;
    };
    return () => {
      window.clearInterval(ping);
      sendRef.current = () => false;
      channel.close();
    };
  }, [room]);

  // Разные устройства: опрос ретранслятора.
  useEffect(() => {
    if (!room) return;
    let stopped = false;
    let timer = 0;
    let inFlight = false;
    let again = false;
    let failures = 0;
    let fastUntil = 0;
    let lastAt = 0;
    let synced = false;
    setLink('connecting');

    const schedule = () => {
      window.clearTimeout(timer);
      if (stopped || document.hidden) return; // экран погас — опрос возобновится при возвращении
      // Сразу после команды опрашиваем чаще, чтобы новая сцена появилась без задержки.
      const delay = failures ? Math.min(6000, 800 * 2 ** (failures - 1)) : Date.now() < fastUntil ? 250 : 700;
      timer = window.setTimeout(poll, delay);
    };
    const poll = async () => {
      if (stopped) return;
      if (inFlight) {
        again = true;
        return;
      }
      inFlight = true;
      window.clearTimeout(timer);
      try {
        const { state, peer } = await pollState(room);
        if (stopped) return;
        failures = 0;
        if (state && peer && state.at >= lastAt) {
          lastAt = state.at;
          onIndexRef.current(Math.min(state.index, SCENE_COUNT - 1), !synced);
          synced = true;
        }
        setLink(peer ? 'linked' : 'waiting');
      } catch {
        if (stopped) return;
        failures += 1;
        setLink('offline');
      } finally {
        inFlight = false;
      }
      if (again) {
        again = false;
        void poll();
      } else schedule();
    };

    const onVisible = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener('visibilitychange', onVisible);
    sendRef.current = (command) => {
      if (linkRef.current !== 'linked') return false;
      fastUntil = Date.now() + 2500;
      sendCommand(room, command)
        .then(() => void poll())
        .catch(() => setLink('offline'));
      return true;
    };
    void poll();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      sendRef.current = () => false;
    };
  }, [room]);

  const send = useCallback((command: RemoteCommandInput) => sendRef.current(command), []);
  return { link, send } as const;
}
