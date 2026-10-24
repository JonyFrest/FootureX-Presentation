import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { FULL_FPS, IDLE_FPS, fullRateActive } from './frameRate';

interface AdaptiveQualityProps {
  maxDpr: number;
  /** Нижняя граница плотности пикселей (на телефонах ниже 1 — фон всё равно затемнён). */
  minDpr?: number;
  /** Кадры дозирует FrameGovernor: в покое норма — IDLE_FPS, а не 60. */
  governed?: boolean;
}

/**
 * Адаптивное качество: за каждые 2 секунды сравнивает FPS с целевой частотой и при просадке
 * (< 75 % цели, т. е. < 45 при 60) снижает плотность пикселей (не ниже minDpr), а при стабильно
 * высоком FPS (> 95 % цели) — возвращает её. Под FrameGovernor полная частота и покой
 * считаются раздельно: поднимать качество можно только по кадрам, отрисованным на полной частоте.
 */
export function AdaptiveQuality({ maxDpr, minDpr = 1, governed = false }: AdaptiveQualityProps) {
  const setDpr = useThree((s) => s.setDpr);
  const dpr = useRef(maxDpr);
  const windows = useRef({ full: { frames: 0, time: 0 }, idle: { frames: 0, time: 0 } });
  const goodWindows = useRef(0);

  useFrame((_, delta) => {
    const full = !governed || fullRateActive();
    const w = full ? windows.current.full : windows.current.idle;
    w.frames += 1;
    w.time += delta;
    if (w.time < 2) return;
    const ratio = w.frames / (w.time * (full ? FULL_FPS : IDLE_FPS));
    w.frames = 0;
    w.time = 0;
    if (document.hidden) return;
    if (ratio < 0.75 && dpr.current > minDpr) {
      dpr.current = Math.max(minDpr, dpr.current - 0.25);
      goodWindows.current = 0;
      setDpr(dpr.current);
    } else if (full && ratio > 0.95 && dpr.current < maxDpr) {
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
