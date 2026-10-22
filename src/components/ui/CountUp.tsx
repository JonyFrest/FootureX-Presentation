import { useEffect, useMemo, useRef } from 'react';
import { animate } from 'motion/react';
import { useScene } from '@/components/scene/SceneContext';

interface CountUpProps {
  to: number;
  from?: number;
  decimals?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const formatters = new Map<number, Intl.NumberFormat>();
const formatter = (decimals: number) => {
  let f = formatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    formatters.set(decimals, f);
  }
  return f;
};

/**
 * Число с анимацией счёта. Стартует после остановки камеры (ready).
 * Итоговое значение всегда точно равно `to` — для согласованных расчётов.
 */
export function CountUp({ to, from = 0, decimals = 0, duration = 1.4, delay = 0, prefix = '', suffix = '', className }: CountUpProps) {
  const { ready, reducedMotion } = useScene();
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const fmt = useMemo(() => formatter(decimals), [decimals]);

  useEffect(() => {
    const node = ref.current;
    if (!node || !ready || started.current) return;
    started.current = true;
    if (reducedMotion) {
      node.textContent = prefix + fmt.format(to) + suffix;
      return;
    }
    const controls = animate(from, to, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = prefix + fmt.format(v) + suffix;
      },
      onComplete: () => {
        node.textContent = prefix + fmt.format(to) + suffix;
      },
    });
    return () => {
      // Прерванная анимация (смена значения, StrictMode) перезапустится со следующим эффектом.
      controls.stop();
      started.current = false;
      node.textContent = prefix + fmt.format(to) + suffix;
    };
  }, [ready, reducedMotion, to, from, duration, delay, prefix, suffix, fmt]);

  return (
    <span ref={ref} className={`t-num ${className ?? ''}`} aria-label={prefix + fmt.format(to) + suffix}>
      {prefix + fmt.format(started.current || reducedMotion ? to : from) + suffix}
    </span>
  );
}
