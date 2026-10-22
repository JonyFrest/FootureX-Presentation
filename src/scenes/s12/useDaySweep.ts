import { useEffect, useState } from 'react';
import { animate, useMotionValue, type MotionValue } from 'motion/react';
import { useScene } from '@/components/scene';
import { MILESTONES, TOTAL_DAYS } from './phases';

export interface DaySweep {
  /** Текущий день маркера, 0..90 (MotionValue — без ре-рендеров на каждом кадре). */
  day: MotionValue<number>;
  /** Какие вехи (0/30/60/90) маркер уже прошёл. */
  reached: readonly boolean[];
  /** Пробег 0 → 90 завершён. */
  done: boolean;
}

const SWEEP_SECONDS = 4.6;

/** Маркер дня один раз пробегает 0 → 90 после остановки камеры; при reduced motion сразу стоит на 90. */
export function useDaySweep(): DaySweep {
  const { ready, reducedMotion } = useScene();
  const day = useMotionValue(reducedMotion ? TOTAL_DAYS : 0);
  const [reached, setReached] = useState<boolean[]>(() => MILESTONES.map((m) => reducedMotion || m.day === 0));
  const [done, setDone] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      day.set(TOTAL_DAYS);
      setReached(MILESTONES.map(() => true));
      setDone(true);
      return;
    }
    if (!ready || done) return;
    const controls = animate(day, TOTAL_DAYS, {
      duration: SWEEP_SECONDS,
      delay: 0.5,
      ease: [0.45, 0, 0.25, 1],
      onUpdate: (d) => {
        setReached((prev) => {
          const next = MILESTONES.map((m) => d >= m.day - 0.01);
          return next.every((v, i) => v === prev[i]) ? prev : next;
        });
      },
      onComplete: () => setDone(true),
    });
    return () => controls.stop();
  }, [ready, reducedMotion, done, day]);

  return { day, reached, done };
}
