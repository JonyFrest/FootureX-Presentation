import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { SceneFrame, Reveal, useScene } from '@/components/scene';
import { usePresentation } from '@/app/store';
import { pad2 } from '@/data/scenes';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { GOAL_KEY, GOAL_LEAD, GOAL_TAIL, TASKS, sceneRange, sceneTitle, type GoalTask } from './s02/data';
import { GoalCore } from './s02/GoalCore';
import { Connectors } from './s02/Connectors';

/**
 * 02 · Goals — одна цель в центре (светящееся ядро) и четыре задачи вокруг.
 * Наведение/фокус подсвечивает линию к ядру, выбор показывает сцены, где задача раскрыта.
 */
export default function Scene02Goals() {
  const compact = useIsCompact();
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const toggle = (id: string) => setSelected((cur) => (cur === id ? null : id));
  const selectedTask = TASKS.find((t) => t.id === selected) ?? null;
  const highlighted = TASKS.find((t) => t.id === (hovered ?? selected)) ?? null;

  return (
    <SceneFrame justify={compact ? 'start' : 'center'}>
      <GoalHeader compact={compact} />
      {compact ? (
        <MobileGoals selected={selected} onToggle={toggle} highlighted={highlighted} />
      ) : (
        <DesktopGoals
          selectedTask={selectedTask}
          highlighted={highlighted}
          onToggle={toggle}
          onHover={setHovered}
        />
      )}
    </SceneFrame>
  );
}

function GoalHeader({ compact }: { compact: boolean }) {
  const { meta } = useScene();
  return (
    <header className={`mx-auto max-w-[1480px] ${compact ? 'text-left' : 'text-center'}`}>
      <Reveal y={10}>
        <p className={`t-eyebrow flex items-center gap-3 ${compact ? '' : 'justify-center'}`}>
          <span className="inline-block h-px w-8 bg-gradient-to-r from-transparent to-secondary" aria-hidden />
          {pad2(meta.number)} · {meta.eyebrow}
          {compact ? null : (
            <span className="inline-block h-px w-8 bg-gradient-to-l from-transparent to-secondary" aria-hidden />
          )}
        </p>
      </Reveal>
      <Reveal delay={0.06} y={16}>
        <h1 className={`${compact ? 't-h3' : 't-h2'} mt-[var(--gap-2)] text-balance text-ice`}>
          <span className="text-highlight">Цель: </span>
          {GOAL_LEAD.toLowerCase()} <span className="text-gradient">{GOAL_KEY}</span> {GOAL_TAIL}
        </h1>
      </Reveal>
    </header>
  );
}

/* ------------------------------------------------------------------
   Широкий экран: ядро в центре, задачи 2 слева / 2 справа, линии к ядру.
   ------------------------------------------------------------------ */

interface DesktopGoalsProps {
  selectedTask: GoalTask | null;
  highlighted: GoalTask | null;
  onToggle: (id: string) => void;
  onHover: (id: string | null) => void;
}

function DesktopGoals({ selectedTask, highlighted, onToggle, onHover }: DesktopGoalsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const left = TASKS.filter((t) => t.side === 'left');
  const right = TASKS.filter((t) => t.side === 'right');

  const column = (tasks: GoalTask[], side: 'left' | 'right', baseDelay: number) => (
    <div className="relative z-10 flex flex-col justify-center gap-[var(--gap-4)]">
      {tasks.map((task, i) => (
        <Reveal key={task.id} delay={baseDelay + i * 0.08} x={side === 'left' ? -24 : 24} y={0}>
          <TaskCard
            task={task}
            selected={selectedTask?.id === task.id}
            highlighted={highlighted?.id === task.id}
            onToggle={onToggle}
            onHover={onHover}
            refCallback={(el) => {
              if (el) cardRefs.current.set(task.id, el);
              else cardRefs.current.delete(task.id);
            }}
          />
        </Reveal>
      ))}
    </div>
  );

  return (
    <div className="mt-[var(--gap-4)] flex flex-col items-center">
      <div
        ref={containerRef}
        className="relative grid w-full grid-cols-[minmax(0,1fr)_clamp(220px,calc(var(--u)*21),400px)_minmax(0,1fr)] items-center gap-x-[clamp(28px,calc(var(--u)*4.4),96px)]"
      >
        {column(left, 'left', 0.2)}
        <Reveal delay={0.1} scale={0.86} y={0} className="relative z-0">
          <div ref={coreRef}>
            <GoalCore active={highlighted} />
          </div>
        </Reveal>
        {column(right, 'right', 0.28)}
        <Connectors containerRef={containerRef} coreRef={coreRef} cardRefs={cardRefs} activeId={highlighted?.id ?? null} />
      </div>

      <Reveal delay={0.45} y={10} className="mt-[var(--gap-3)] w-full max-w-[880px]">
        <div className="flex min-h-[clamp(60px,calc(var(--u)*4.4),84px)] items-center justify-center" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {selectedTask ? (
              <TaskDetail key={selectedTask.id} task={selectedTask} />
            ) : (
              <motion.p
                key="hint"
                className="t-small text-mute"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                Выберите задачу — покажем, в каких сценах она раскрыта
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </Reveal>
    </div>
  );
}

interface TaskCardProps {
  task: GoalTask;
  selected: boolean;
  highlighted: boolean;
  onToggle: (id: string) => void;
  onHover: (id: string | null) => void;
  refCallback: (el: HTMLButtonElement | null) => void;
}

function TaskCard({ task, selected, highlighted, onToggle, onHover, refCallback }: TaskCardProps) {
  return (
    <button
      ref={refCallback}
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(task.id)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(task.id)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
      onFocus={() => onHover(task.id)}
      onBlur={() => onHover(null)}
      data-active={selected || highlighted ? 'true' : undefined}
      className={`glass glass-hover group flex w-full cursor-pointer items-start gap-[var(--gap-3)] rounded-[var(--radius-md)] p-[var(--gap-3)] text-left outline-offset-4 ${
        selected ? 'bg-[rgba(37,80,250,0.16)]!' : ''
      }`}
    >
      <span
        className={`t-h2 font-display leading-none transition-colors duration-300 ${
          selected || highlighted ? 'text-brand-gradient' : 'text-highlight/70'
        }`}
        aria-hidden
      >
        {pad2(task.n)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[var(--gap-2)]">
        <span className="t-h3 block text-pretty text-white">{task.text}</span>
        <span className="flex items-center gap-2">
          <span className={`chip ${selected ? 'border-secondary/70!' : ''}`}>Сцены {sceneRange(task)}</span>
        </span>
      </span>
    </button>
  );
}

function TaskDetail({ task }: { task: GoalTask }) {
  const { reducedMotion } = useScene();
  const first = task.scenes[0];
  return (
    <motion.div
      className="glass-strong flex w-full flex-wrap items-center justify-between gap-x-[var(--gap-3)] gap-y-[var(--gap-2)] rounded-[var(--radius-md)] px-[var(--gap-3)] py-[var(--gap-2)]"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: reducedMotion ? 0.12 : 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <ul className="flex min-w-0 flex-1 flex-col gap-0.5">
        {task.scenes.map((n) => (
          <li key={n} className="t-small flex items-baseline gap-2 text-soft">
            <span className="font-display text-highlight">{pad2(n)}</span>
            <span className="truncate">{sceneTitle(n)}</span>
          </li>
        ))}
      </ul>
      <GoToScene n={first} />
    </motion.div>
  );
}

function GoToScene({ n, className = '' }: { n: number; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => usePresentation.getState().go(n - 1)}
      className={`t-small inline-flex cursor-pointer items-center gap-2 rounded-full bg-[image:var(--grad-brand)] px-4 py-2 font-semibold whitespace-nowrap text-white shadow-[0_10px_30px_-12px_rgba(37,80,250,0.9)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 ${className}`}
    >
      Перейти к сцене {pad2(n)}
      <ArrowRight className="size-[1.1em]" aria-hidden />
    </button>
  );
}

/* ------------------------------------------------------------------
   Телефон: ядро сверху, задачи — список с раскрытием на месте.
   ------------------------------------------------------------------ */

interface MobileGoalsProps {
  selected: string | null;
  highlighted: GoalTask | null;
  onToggle: (id: string) => void;
}

function MobileGoals({ selected, highlighted, onToggle }: MobileGoalsProps) {
  const { reducedMotion } = useScene();
  return (
    <div className="mt-[var(--gap-3)] flex flex-col items-center gap-[var(--gap-3)] landscape:flex-row landscape:items-start">
      <Reveal delay={0.1} scale={0.88} y={0} className="w-[min(46vw,190px)] shrink-0 landscape:w-[min(30vw,170px)]">
        <GoalCore active={highlighted} />
      </Reveal>
      <ol className="relative flex w-full flex-col gap-[var(--gap-2)] pl-4">
        <span
          aria-hidden
          className="absolute top-2 bottom-2 left-0 w-px bg-gradient-to-b from-secondary/80 via-secondary/30 to-transparent"
        />
        {TASKS.map((task, i) => {
          const open = selected === task.id;
          return (
            <Reveal as="li" key={task.id} delay={0.18 + i * 0.06} y={14} className="relative">
              <span
                aria-hidden
                className={`absolute top-[1.35em] -left-4 h-px w-4 ${open ? 'bg-secondary' : 'bg-secondary/40'}`}
              />
              <div className={`glass glass-hover rounded-[var(--radius-md)] ${open ? 'border-secondary/60!' : ''}`} data-active={open ? 'true' : undefined}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`s02-task-${task.id}`}
                  onClick={() => onToggle(task.id)}
                  className="flex w-full cursor-pointer items-start gap-3 p-[var(--gap-2)] text-left"
                >
                  <span className={`t-h3 font-display leading-tight ${open ? 'text-brand-gradient' : 'text-highlight/80'}`} aria-hidden>
                    {pad2(task.n)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="t-small font-semibold text-white">{task.text}</span>
                    <span className="chip self-start">Сцены {sceneRange(task)}</span>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      id={`s02-task-${task.id}`}
                      key="detail"
                      initial={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={reducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                      exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0.12 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-2 border-t border-white/10 px-[var(--gap-2)] pt-2 pb-[var(--gap-2)]">
                        <ul className="flex flex-col gap-0.5">
                          {task.scenes.map((n) => (
                            <li key={n} className="t-micro flex items-baseline gap-2 text-soft">
                              <span className="font-display text-highlight">{pad2(n)}</span>
                              {sceneTitle(n)}
                            </li>
                          ))}
                        </ul>
                        <GoToScene n={task.scenes[0]} className="self-start" />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </ol>
    </div>
  );
}
