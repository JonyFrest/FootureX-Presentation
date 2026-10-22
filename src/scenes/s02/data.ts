import { SCENES, pad2 } from '@/data/scenes';

export const GOAL_LEAD = 'Разработать';
export const GOAL_KEY = 'систему управления персоналом';
export const GOAL_TAIL =
  'FootureX Uzbekistan, которая обеспечит рост компании от IT-стартапа к футбольной и городской экосистеме.';

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
    text: 'Обосновать роль HR в растущей технологической компании',
    scenes: [3, 4, 5],
    side: 'left',
    angle: 214,
  },
  {
    id: 'structure',
    n: 2,
    text: 'Спроектировать оргструктуру и штатное расписание этапа 1',
    scenes: [8, 9],
    side: 'left',
    angle: 146,
  },
  {
    id: 'budget',
    n: 3,
    text: 'Рассчитать бюджет на персонал и выстроить найм и адаптацию',
    scenes: [10, 11, 12],
    side: 'right',
    angle: -34,
  },
  {
    id: 'kpi',
    n: 4,
    text: 'Разработать систему KPI, мотивации и удержания',
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
