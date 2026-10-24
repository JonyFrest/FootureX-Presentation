import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { IDLE_FPS, fullRateActive } from './frameRate';

/**
 * Регулятор кадров для Canvas с frameloop="demand": сам решает, когда перерисовать фон.
 * Переход/перелёт камеры — каждый кадр экрана, покой — не чаще IDLE_FPS (экономия батареи,
 * телефон меньше греется). Скрытая вкладка не рисует вовсе: rAF браузер останавливает.
 */
export function FrameGovernor() {
  const advance = useThree((s) => s.advance);

  useEffect(() => {
    // Запас 4 мс: при 60/90/120 Гц кадр попадает ровно в каждый 2-й/3-й/4-й тик экрана.
    const interval = 1000 / IDLE_FPS - 4;
    let last = -Infinity;
    let raf = requestAnimationFrame(function tick(t: number) {
      raf = requestAnimationFrame(tick);
      if (fullRateActive(t) || t - last >= interval) {
        last = t;
        // Рисуем в этом же тике (invalidate() отложил бы кадр до следующего и съел бы половину частоты).
        advance(t);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [advance]);

  return null;
}
