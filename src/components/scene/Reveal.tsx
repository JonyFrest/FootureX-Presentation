import { useEffect, useState, type ElementType, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useScene } from './SceneContext';

interface RevealProps {
  children: ReactNode;
  /** Дополнительная задержка относительно появления сцены, с. */
  delay?: number;
  /** Смещение по вертикали при появлении, px. */
  y?: number;
  /** Смещение по горизонтали при появлении, px. */
  x?: number;
  scale?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span' | 'header' | 'article' | 'ul' | 'p' | 'h1' | 'h2' | 'h3';
  /** Ждать полной остановки камеры (для графиков и счётчиков). */
  waitReady?: boolean;
}

/**
 * Каскадное появление элементов сцены. Запускается один раз, когда сцена становится
 * текущей; уход сцены анимирует общий таймлайн перехода, а не Reveal.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  x = 0,
  scale = 1,
  className,
  as = 'div',
  waitReady = false,
}: RevealProps) {
  const { active, ready, enterDelay, reducedMotion } = useScene();
  const trigger = waitReady ? ready : active;
  const [shown, setShown] = useState(trigger);

  useEffect(() => {
    if (trigger) setShown(true);
  }, [trigger]);

  const Tag = motion[as] as ElementType;
  const baseDelay = waitReady ? 0 : enterDelay;

  return (
    <Tag
      className={className}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y, x, scale }}
      animate={shown ? { opacity: 1, y: 0, x: 0, scale: 1 } : undefined}
      transition={
        reducedMotion
          ? { duration: 0.2, delay: 0 }
          : { duration: 0.8, delay: baseDelay + delay, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {children}
    </Tag>
  );
}
