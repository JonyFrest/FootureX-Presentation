import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/** Размер элемента в CSS-пикселях (ResizeObserver). До первого замера — 0×0. */
export function useElementSize<T extends HTMLElement>(): [RefObject<T | null>, ElementSize] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      // getBoundingClientRect учитывает transform (scale при переходе сцены), поэтому берём offset-размеры.
      const width = node.offsetWidth || rect.width;
      const height = node.offsetHeight || rect.height;
      setSize((prev) =>
        Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5 ? prev : { width, height },
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}
