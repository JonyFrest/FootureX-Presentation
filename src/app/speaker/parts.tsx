import { useEffect, useState, type FormEvent } from 'react';
import { Link2, Loader2, Wifi, WifiOff } from 'lucide-react';
import type { SceneMeta } from '@/data/scenes';
import { ROOM_PATTERN, formatRoom, type RemoteCommandInput } from '@/app/remote/relay';
import type { LinkState } from './useSpeakerSync';

/** Всё, что нужно раскладкам окна докладчика (телефон и ноутбук). */
export interface SpeakerViewProps {
  index: number;
  scene: SceneMeta;
  next: SceneMeta | undefined;
  notes: string[];
  /** Общее время выступления, с. */
  elapsed: number;
  /** Время на текущей сцене, с. */
  sceneElapsed: number;
  timer: { running: boolean; started: boolean; toggle: () => void; reset: () => void };
  link: LinkState;
  room: string | null;
  /** Окно открыто без презентации рядом — предложить подключение по коду. */
  offerConnect: boolean;
  go: (command: RemoteCommandInput) => void;
  connect: (room: string) => void;
  disconnect: () => void;
}

export const LINK_LABEL: Record<LinkState, string> = {
  linked: 'Синхронизировано с презентацией',
  waiting: 'Ждём презентацию',
  connecting: 'Подключение…',
  offline: 'Нет связи',
  standalone: 'Автономный режим',
};

export const LINK_SHORT: Record<LinkState, string> = {
  linked: 'На связи',
  waiting: 'Ждём ноутбук',
  connecting: 'Подключение…',
  offline: 'Нет сети',
  standalone: 'Автономно',
};

export function LinkIcon({ link, className = 'size-3.5' }: { link: LinkState; className?: string }) {
  if (link === 'linked') return <Wifi className={className} aria-hidden />;
  if (link === 'connecting') return <Loader2 className={`${className} animate-spin`} aria-hidden />;
  if (link === 'waiting') return <Link2 className={className} aria-hidden />;
  return <WifiOff className={className} aria-hidden />;
}

/** Проходит ли грейс-период после открытия (чтобы не мигать подсказкой, пока окно ищет презентацию). */
export function useGrace(ms: number): boolean {
  const [over, setOver] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setOver(true), ms);
    return () => window.clearTimeout(id);
  }, [ms]);
  return over;
}

/** Подключение телефона к презентации по шестизначному коду из окна «Пульт». */
export function ConnectCard({ onConnect, className = '' }: { onConnect: (room: string) => void; className?: string }) {
  const [code, setCode] = useState('');
  const valid = ROOM_PATTERN.test(code);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (valid) onConnect(code);
  };
  return (
    <form onSubmit={submit} className={`glass rounded-[var(--radius-md)] p-4 ${className}`} aria-label="Подключение к презентации">
      <p className="t-eyebrow">Подключить к презентации</p>
      <p className="mt-2 text-[15px] leading-snug text-soft">
        На ноутбуке нажмите «Пульт» (значок телефона или клавиша P) и отсканируйте QR-код камерой — или введите код:
      </p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input
          value={code.length > 3 ? formatRoom(code.padEnd(6, ' ')).trimEnd() : code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          enterKeyHint="go"
          placeholder="000 000"
          aria-label="Код пульта из 6 цифр"
          className="t-num min-w-0 rounded-full border border-white/15 bg-white/[0.06] px-3 py-3 text-center text-xl font-medium tracking-[0.18em] text-white outline-none placeholder:text-white/25 focus:border-secondary"
        />
        <button
          type="submit"
          disabled={!valid}
          className="shrink-0 cursor-pointer rounded-full bg-gradient-to-br from-secondary to-primary px-5 py-3 font-medium transition hover:brightness-110 disabled:cursor-default disabled:opacity-40"
        >
          Подключить
        </button>
      </div>
    </form>
  );
}
