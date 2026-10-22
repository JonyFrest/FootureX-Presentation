import { Component, Suspense, lazy, useState, type ReactNode } from 'react';
import { SCENES } from '@/data/scenes';
import { usePresentation } from '@/app/store';
import { hasWebGL, liteModeRequested } from '@/three/webgl';
import { FallbackBackdrop } from './FallbackBackdrop';

const World = lazy(() => import('@/three/World'));

class WorldErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** 3D-фон (WebGL) + затемнение под контентом. При отсутствии WebGL — CSS-фон. */
export function Backdrop() {
  const index = usePresentation((s) => s.index);
  const [webgl, setWebgl] = useState(() => hasWebGL() && !liteModeRequested());
  const dim = SCENES[index].dim;

  return (
    <div className="fixed inset-0 z-0" aria-hidden data-backdrop={webgl ? 'webgl' : 'fallback'}>
      {webgl ? (
        <WorldErrorBoundary fallback={<FallbackBackdrop />}>
          <Suspense fallback={<FallbackBackdrop />}>
            <World onContextLost={() => setWebgl(false)} />
          </Suspense>
        </WorldErrorBoundary>
      ) : (
        <FallbackBackdrop />
      )}
      {/* Читаемость: виньетка и затемнение, плотность которого задаёт сцена. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(7,10,18,0.75)_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 bg-deep transition-opacity duration-[1200ms] ease-out"
        style={{ opacity: dim }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-deep/90 to-transparent" />
    </div>
  );
}
