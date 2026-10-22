import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SCENES, type WorldFeature } from '@/data/scenes';
import { usePresentation } from '@/app/store';

/**
 * Плавное проявление пространственного объекта на «своих» сценах.
 * Возвращает ref со значением 0..1, которое обновляется каждый кадр (без ре-рендеров React).
 */
export function useFeatureFade(feature: WorldFeature, speed = 2.2) {
  const value = useRef(0);
  useFrame((_, delta) => {
    const { index } = usePresentation.getState();
    const target = SCENES[index].features.includes(feature) ? 1 : 0;
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * speed);
    value.current += (target - value.current) * k;
    if (Math.abs(target - value.current) < 0.001) value.current = target;
  });
  return value;
}
