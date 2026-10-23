import { useEffect } from 'react';

/** Не даёт экрану телефона погаснуть, пока идёт доклад (Screen Wake Lock API, где он есть). */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) void lock.release();
        else sentinel = lock;
      } catch {
        // отказ (энергосбережение, вкладка скрыта) — экран может погаснуть как обычно
      }
    };
    // Блокировка снимается, когда вкладка уходит в фон, — возвращаем её при возвращении.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) void request();
    };
    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}
