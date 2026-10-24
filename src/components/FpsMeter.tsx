import { useEffect, useRef, useState } from 'react';
import { DEVICE_TIER } from '@/app/deviceTier';

/** Текущая плотность пикселей 3D-фона (её снижает AdaptiveQuality); без WebGL — 0. */
function canvasDpr(): number {
  const canvas = document.querySelector('canvas');
  return canvas && canvas.clientWidth ? canvas.width / canvas.clientWidth : 0;
}

/** Счётчик кадров для проверки производительности на конкретном ноутбуке/проекторе/телефоне: ?fps=1 */
export function FpsMeter() {
  const [fps, setFps] = useState(0);
  const [min, setMin] = useState(Infinity);
  const [dpr, setDpr] = useState(0);
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
        setDpr(canvasDpr());
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
      {fps} FPS · min {Number.isFinite(min) ? min : '—'} · DPR {dpr ? dpr.toFixed(2) : '—'} · {DEVICE_TIER}
    </div>
  );
}
