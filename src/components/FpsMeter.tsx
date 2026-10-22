import { useEffect, useRef, useState } from 'react';

/** Счётчик кадров для проверки производительности на конкретном ноутбуке/проекторе: ?fps=1 */
export function FpsMeter() {
  const [fps, setFps] = useState(0);
  const [min, setMin] = useState(Infinity);
  const frames = useRef(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      frames.current += 1;
      if (t - last >= 1000) {
        const value = Math.round((frames.current * 1000) / (t - last));
        setFps(value);
        setMin((m) => Math.min(m, value));
        frames.current = 0;
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="glass t-micro t-num fixed left-3 top-[calc(var(--topbar-h)+var(--safe-top))] z-50 px-3 py-1.5 font-display text-ice" aria-hidden>
      {fps} FPS · min {Number.isFinite(min) ? min : '—'} · DPR {Math.min(window.devicePixelRatio, 1.75).toFixed(2)}
    </div>
  );
}
