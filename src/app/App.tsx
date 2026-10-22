import { useEffect } from 'react';
import { Backdrop } from '@/components/backdrop/Backdrop';
import { NavBar } from '@/components/nav/NavBar';
import { TopBar } from '@/components/nav/TopBar';
import { SceneMenu } from '@/components/nav/SceneMenu';
import { FpsMeter } from '@/components/FpsMeter';
import { SCENES, SCENE_COUNT, pad2 } from '@/data/scenes';
import { Stage } from './Stage';
import { usePresentation } from './store';
import { useKeyboardNav } from './useKeyboardNav';
import { useSpeakerBridge } from './useSpeakerBridge';

/** Номер сцены в адресе (#/07) и заголовок вкладки — перезагрузка не сбрасывает позицию. */
function useUrlSync() {
  const index = usePresentation((s) => s.index);
  useEffect(() => {
    const hash = `#/${pad2(index + 1)}`;
    if (window.location.hash !== hash) {
      const url = new URL(window.location.href);
      url.searchParams.delete('scene');
      url.hash = hash;
      window.history.replaceState(null, '', url);
    }
    document.title = `${pad2(index + 1)} · ${SCENES[index].title} — FootureX`;
  }, [index]);

  useEffect(() => {
    const onHash = () => {
      const n = Number(window.location.hash.match(/^#\/?(\d{1,2})$/)?.[1]);
      if (Number.isFinite(n)) usePresentation.getState().go(n - 1);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
}

function LiveRegion() {
  const index = usePresentation((s) => s.index);
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {`Сцена ${index + 1} из ${SCENE_COUNT}: ${SCENES[index].title}`}
    </p>
  );
}

// Только чтение состояния для автоматических проверок (scripts/qa.mjs).
declare global {
  interface Window {
    __FX__?: { getState: typeof usePresentation.getState };
  }
}
window.__FX__ = { getState: usePresentation.getState };

/** ?clean — только 3D-пространство без интерфейса (для проверки ракурсов камеры). */
const CLEAN = new URLSearchParams(window.location.search).has('clean');
/** ?fps — счётчик кадров для проверки производительности. */
const SHOW_FPS = new URLSearchParams(window.location.search).has('fps');

export default function App() {
  useKeyboardNav();
  useSpeakerBridge();
  useUrlSync();

  return (
    <div className="fixed inset-0 overflow-hidden bg-deep text-white">
      <Backdrop />
      <main aria-label="Презентация FootureX" style={CLEAN ? { opacity: 0 } : undefined}>
        <Stage />
      </main>
      {CLEAN ? null : (
        <>
          <TopBar />
          <NavBar />
          <SceneMenu />
        </>
      )}
      <LiveRegion />
      {SHOW_FPS ? <FpsMeter /> : null}
    </div>
  );
}
