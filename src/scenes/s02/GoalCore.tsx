import { AnimatePresence, motion } from 'motion/react';
import { useScene } from '@/components/scene';
import { LOW_TIER } from '@/app/deviceTier';
import { pad2 } from '@/data/scenes';
import { GOAL_MARK, TASKS, sceneRange, tasksLabel, type GoalTask } from './data';

/** Радиус кольца точек подключения — доля от стороны ядра (viewBox 200 → r = 68). */
export const ANCHOR_RATIO = 68 / 200;

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad) };
}

interface GoalCoreProps {
  /** Подсвеченная задача (наведение, фокус или выбор). */
  active: GoalTask | null;
  className?: string;
}

/**
 * Светящееся ядро цели: концентрические кольца, медленное вращение (только после
 * остановки камеры, без reduced motion и не на телефоне: вращение SVG перерисовывает
 * ядро в каждом кадре), четыре точки подключения задач.
 */
export function GoalCore({ active, className = '' }: GoalCoreProps) {
  const { ready, reducedMotion } = useScene();
  const spin = ready && !reducedMotion && !LOW_TIER;

  return (
    <div className={`relative aspect-square ${className}`}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <radialGradient id="s02-halo" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.35" stopColor="#2550FA" stopOpacity="0.42" />
            <stop offset="1" stopColor="#2550FA" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="s02-core" cx="0.42" cy="0.36" r="0.75">
            <stop offset="0" stopColor="#2593FA" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#2550FA" stopOpacity="0.55" />
            <stop offset="1" stopColor="#0E1629" stopOpacity="0.9" />
          </radialGradient>
          <linearGradient id="s02-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#DCE7FF" />
            <stop offset="0.5" stopColor="#2593FA" />
            <stop offset="1" stopColor="#2550FA" stopOpacity="0.4" />
          </linearGradient>
          <filter id="s02-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.circle
          cx="100"
          cy="100"
          r="100"
          fill="url(#s02-halo)"
          animate={{ opacity: active ? 1 : 0.7 }}
          transition={{ duration: 0.5 }}
        />

        {/* Внешнее пунктирное кольцо */}
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '100px 100px' }}
          animate={spin ? { rotate: 360 } : { rotate: 0 }}
          transition={spin ? { duration: 90, ease: 'linear', repeat: Infinity } : { duration: 0 }}
        >
          <circle cx="100" cy="100" r="95" fill="none" stroke="#8EB4FF" strokeOpacity="0.35" strokeWidth="0.6" strokeDasharray="1.2 4.2" />
          <circle cx="100" cy="5" r="1.6" fill="#DCE7FF" />
        </motion.g>

        {/* Шкала с рисками, вращается в обратную сторону */}
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '100px 100px' }}
          animate={spin ? { rotate: -360 } : { rotate: 0 }}
          transition={spin ? { duration: 140, ease: 'linear', repeat: Infinity } : { duration: 0 }}
        >
          {TICKS.map((deg) => {
            const long = deg % 45 === 0;
            const a = polar(long ? 79 : 82, deg);
            const b = polar(86, deg);
            return (
              <line
                key={deg}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={long ? '#8EB4FF' : '#2593FA'}
                strokeOpacity={long ? 0.75 : 0.35}
                strokeWidth={long ? 0.9 : 0.5}
              />
            );
          })}
        </motion.g>

        {/* Кольцо подключения задач */}
        <circle cx="100" cy="100" r="68" fill="none" stroke="url(#s02-ring)" strokeWidth="1.1" strokeOpacity="0.85" />

        {/* Ядро */}
        <circle cx="100" cy="100" r="54" fill="url(#s02-core)" />
        <circle cx="100" cy="100" r="54" fill="none" stroke="#DCE7FF" strokeOpacity="0.28" strokeWidth="0.6" />
        <motion.circle
          cx="100"
          cy="100"
          r="58"
          fill="none"
          stroke="#2593FA"
          strokeWidth="1.4"
          filter="url(#s02-glow)"
          initial={false}
          animate={{ opacity: active ? 0.9 : 0.25 }}
          transition={{ duration: 0.4 }}
        />

        {/* Точки подключения */}
        {TASKS.map((task) => {
          const p = polar(68, task.angle);
          const on = active?.id === task.id;
          return (
            <g key={task.id}>
              <motion.circle
                cx={p.x}
                cy={p.y}
                r="7"
                fill="#2593FA"
                initial={false}
                animate={{ opacity: on ? 0.35 : 0 }}
                transition={{ duration: 0.3 }}
                filter="url(#s02-glow)"
              />
              <circle cx={p.x} cy={p.y} r={on ? 3.4 : 2.4} fill={on ? '#FFFFFF' : '#2593FA'} stroke="#0E1629" strokeWidth="0.8" />
            </g>
          );
        })}
      </svg>

      {/* Надпись в центре ядра — настоящий HTML */}
      <div className="absolute inset-[27%] flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait" initial={false}>
          {active ? (
            <motion.div
              key={active.id}
              className="flex flex-col items-center"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              transition={{ duration: reducedMotion ? 0.15 : 0.28 }}
            >
              <span className="t-eyebrow text-ice/80">Задача</span>
              <span className="t-stat mt-1 text-white">{pad2(active.n)}</span>
              <span className="t-micro mt-1 whitespace-nowrap text-ice/85">сцены {sceneRange(active)}</span>
            </motion.div>
          ) : (
            <motion.div
              key="goal"
              className="flex flex-col items-center"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              transition={{ duration: reducedMotion ? 0.15 : 0.28 }}
            >
              <span className="t-eyebrow text-ice/80">Goal</span>
              <span className="t-stat mt-1 text-white" lang="en">
                {GOAL_MARK}
              </span>
              <span className="t-micro mt-1 whitespace-nowrap text-ice/85">{tasksLabel()}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
