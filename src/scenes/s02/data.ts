import { SCENES, pad2 } from '@/data/scenes';

/** Цель работы: «Цель: разработать <акцент> <хвост>». */
export const GOAL_LEAD = 'Разработать';
export const GOAL_KEY = 'систему управления проектом';
export const GOAL_TAIL =
  'запуска FootureX — от устава до контроля — и показать, как она масштабируется на этапы 2–3 экосистемы.';

/** Короткая латинская метка в центре ядра (Project Management). */
export const GOAL_MARK = 'PM';

export interface GoalTask {
  id: string;
  /** Номер задачи, 1–4. */
  n: number;
  text: string;
  /** Номера сцен (1-based), где задача раскрывается. */
  scenes: number[];
  /** Сторона относительно ядра на широком экране. */
  side: 'left' | 'right';
  /** Угол точки подключения на кольце ядра, градусы (0 — вправо, по часовой). */
  angle: number;
}

export const TASKS: readonly GoalTask[] = [
  {
    id: 'role',
    n: 1,
    text: 'Обосновать роль проектного управления для стартапа',
    scenes: [3, 4, 5],
    side: 'left',
    angle: 214,
  },
  {
    id: 'scope',
    n: 2,
    text: 'Определить цели и содержание: устав, команда, WBS',
    scenes: [8, 9, 10],
    side: 'left',
    angle: 146,
  },
  {
    id: 'plan',
    n: 3,
    text: 'Спланировать сроки и бюджет проекта',
    scenes: [11, 12],
    side: 'right',
    angle: -34,
  },
  {
    id: 'control',
    n: 4,
    text: 'Оценить риски и выстроить контроль',
    scenes: [13, 14],
    side: 'right',
    angle: 34,
  },
];

/** «03–05» — диапазон сцен задачи. */
export function sceneRange(task: GoalTask): string {
  const first = task.scenes[0];
  const last = task.scenes[task.scenes.length - 1];
  return first === last ? pad2(first) : `${pad2(first)}–${pad2(last)}`;
}

export function sceneTitle(n: number): string {
  return SCENES[n - 1]?.title ?? '';
}

/** «4 задачи» — согласовано с числом задач. */
export function tasksLabel(count: number = TASKS.length): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const form =
    mod10 === 1 && mod100 !== 11 ? 'задача' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'задачи' : 'задач';
  return `${count} ${form}`;
}
