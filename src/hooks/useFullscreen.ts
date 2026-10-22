import { useCallback, useEffect, useState } from 'react';

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

function currentFullscreen(): boolean {
  const doc = document as FsDocument;
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
}

export function fullscreenSupported(): boolean {
  const el = document.documentElement as FsElement;
  return typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function';
}

export async function toggleFullscreen(): Promise<void> {
  const doc = document as FsDocument;
  try {
    if (currentFullscreen()) {
      await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
    } else {
      const el = document.documentElement as FsElement;
      await (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.());
    }
  } catch {
    // Браузер может отказать (например, без жеста пользователя) — интерфейс остаётся рабочим.
  }
}

/** Состояние полноэкранного режима. Esc обрабатывает сам браузер — мы лишь синхронизируемся. */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setIsFullscreen(currentFullscreen());
    sync();
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const toggle = useCallback(() => void toggleFullscreen(), []);
  return { isFullscreen, toggle, supported: typeof document !== 'undefined' && fullscreenSupported() };
}
