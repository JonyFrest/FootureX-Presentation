import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * Адаптивное качество: каждые 2 секунды измеряет FPS и при просадке снижает
 * плотность пикселей (не ниже 1), а при стабильно высоком FPS — возвращает её.
 */
export function AdaptiveQuality({ maxDpr }: { maxDpr: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const dpr = useRef(maxDpr);
  const frames = useRef(0);
  const time = useRef(0);
  const goodWindows = useRef(0);

  useFrame((_, delta) => {
    frames.current += 1;
    time.current += delta;
    if (time.current < 2) return;
    const fps = frames.current / time.current;
    frames.current = 0;
    time.current = 0;
    if (document.hidden) return;
    if (fps < 45 && dpr.current > 1) {
      dpr.current = Math.max(1, dpr.current - 0.25);
      goodWindows.current = 0;
      setDpr(dpr.current);
    } else if (fps > 57 && dpr.current < maxDpr) {
      goodWindows.current += 1;
      if (goodWindows.current >= 3) {
        dpr.current = Math.min(maxDpr, dpr.current + 0.25);
        goodWindows.current = 0;
        setDpr(dpr.current);
      }
    }
  });
  return null;
}
