import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', callback);
      return () => mq.removeEventListener('change', callback);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Компактная (мобильная) раскладка: узкий экран или низкий альбомный телефон. */
export const COMPACT_QUERY = '(max-width: 860px), (max-height: 560px)';

export function useIsCompact(): boolean {
  return useMediaQuery(COMPACT_QUERY);
}

/** Устройство с точным указателем (мышь/тачпад) — для параллакса и hover. */
export function useFinePointer(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}
