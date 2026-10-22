import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function read(): number {
  return Math.min(window.innerWidth / 100, (window.innerHeight * 1.7778) / 100);
}

/** Значение --u в пикселях (1% ширины кадра 16:9) — для размеров SVG, которым нужны числа. */
export function useViewportUnit(): number {
  return useSyncExternalStore(subscribe, read, () => 13.66);
}
