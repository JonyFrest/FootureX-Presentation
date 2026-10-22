import { useId } from 'react';
import { motion } from 'motion/react';
import { useScene } from '@/components/scene';

interface TargetRingProps {
  /** Уровень цели, 0..100. */
  share: number;
  size: number;
  /** Подпись «цель» в центре (для крупных колец). */
  caption?: boolean;
  delay?: number;
  className?: string;
}

/** Кольцо, заполненное до уровня цели. Это ориентир, а не измеренное значение — подпись «цель». */
export function TargetRing({ share, size, caption = false, delay = 0, className = '' }: TargetRingProps) {
  const { ready, reducedMotion } = useScene();
  const uid = useId().replace(/:/g, '');
  const stroke = Math.max(2.5, size * 0.09);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const target = c * (1 - Math.min(100, Math.max(0, share)) / 100);
  const shown = ready || reducedMotion;

  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8EB4FF" />
            <stop offset="0.5" stopColor="#2593FA" />
            <stop offset="1" stopColor="#2550FA" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(142,180,255,0.16)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${uid}-g)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reducedMotion ? target : c }}
          animate={{ strokeDashoffset: shown ? target : c }}
          transition={reducedMotion ? { duration: 0 } : { duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: size > 30 ? 'drop-shadow(0 0 4px rgba(37,147,250,0.55))' : undefined }}
        />
      </svg>
      {caption ? <span className="t-micro relative leading-none text-highlight">цель</span> : null}
    </span>
  );
}
