import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'footurex-speaker-timer';
/** Сохранённый таймер действителен 3 часа: перезагрузка страницы посреди доклада его не сбрасывает. */
const MAX_AGE = 3 * 60 * 60 * 1000;

interface SavedTimer {
  base: number;
  startedAt: number | null;
  savedAt: number;
}

function load(): SavedTimer {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as SavedTimer | null;
    if (saved && Date.now() - saved.savedAt < MAX_AGE && Number.isFinite(saved.base)) return saved;
  } catch {
    /* хранилище недоступно */
  }
  return { base: 0, startedAt: null, savedAt: 0 };
}

/** Общий таймер выступления: старт, пауза, сброс; переживает перезагрузку. */
export function useSpeakerTimer() {
  const [initial] = useState(load);
  const [base, setBase] = useState(initial.base); // накоплено до последнего старта, мс
  const [startedAt, setStartedAt] = useState<number | null>(initial.startedAt);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ base, startedAt, savedAt: Date.now() } satisfies SavedTimer));
    } catch {
      /* не критично */
    }
  }, [base, startedAt]);

  const running = startedAt !== null;
  const start = useCallback(() => setStartedAt((s) => s ?? Date.now()), []);
  const pause = useCallback(() => {
    if (startedAt === null) return;
    setBase((b) => b + Date.now() - startedAt);
    setStartedAt(null);
  }, [startedAt]);
  const reset = useCallback(() => {
    setBase(0);
    setStartedAt((s) => (s === null ? null : Date.now()));
  }, []);
  const toggle = running ? pause : start;
  const elapsedSec = (now: number) => (base + (startedAt !== null ? now - startedAt : 0)) / 1000;

  return { running, started: running || base > 0, start, pause, reset, toggle, elapsedSec };
}
