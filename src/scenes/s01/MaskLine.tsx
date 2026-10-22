import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useScene } from '@/components/scene';

interface MaskLineProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Строка заголовка, «выезжающая» из-под маски — кинематографичное появление титра.
 * При reduced motion — только мягкое проявление без сдвига.
 */
export function MaskLine({ children, delay = 0, className = '' }: MaskLineProps) {
  const { active, enterDelay, reducedMotion } = useScene();
  return (
    <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
      <motion.span
        className={`block ${className}`}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: '105%' }}
        animate={active ? { opacity: 1, y: '0%' } : undefined}
        transition={
          reducedMotion
            ? { duration: 0.2 }
            : { duration: 1.1, delay: enterDelay + delay, ease: [0.16, 1, 0.3, 1] }
        }
      >
        {children}
      </motion.span>
    </span>
  );
}
