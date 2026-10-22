import { memo } from 'react';
import { motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { CountUp } from '@/components/ui';
import { STAFF_HEADCOUNT } from './workforceData';

/** Фигура сотрудника (SVG). Руководитель направления — насыщенным синим, сотрудники — светлым. */
export function Person({
  head,
  on,
  dim,
  index,
  className = '',
}: {
  head: boolean;
  on: boolean;
  dim: boolean;
  index: number;
  className?: string;
}) {
  const { ready, reducedMotion } = useScene();
  const show = ready || reducedMotion;
  const fill = head ? '#2593FA' : on ? '#DCE7FF' : '#8EB4FF';
  return (
    <motion.svg
      viewBox="0 0 20 28"
      aria-hidden
      className={`shrink-0 overflow-visible ${className}`}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.4, y: 6 }}
      animate={show ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.5, delay: index * 0.045, ease: [0.16, 1, 0.3, 1] }}
    >
      <g style={{ opacity: dim ? 0.3 : 1, transition: 'opacity 0.3s ease, fill 0.3s ease' }}>
        <circle cx="10" cy="7" r="5" fill={fill} />
        <path d="M1.5 27.5c0-6.4 3.8-10.6 8.5-10.6s8.5 4.2 8.5 10.6z" fill={fill} />
      </g>
    </motion.svg>
  );
}

/** Крупный счётчик численности; изолирован от перерисовок наведения. */
export const HeadcountCount = memo(function HeadcountCount({ className = '' }: { className?: string }) {
  return <CountUp to={STAFF_HEADCOUNT} className={`t-stat text-gradient ${className}`} />;
});

export const FOOTNOTE = 'Оклады — валовые, до удержания НДФЛ; проект штатного расписания этапа 1';
