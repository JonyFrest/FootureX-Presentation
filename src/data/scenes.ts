/**
 * Централизованная конфигурация 15 сцен.
 * Здесь только метаданные: компоненты сцен регистрируются в src/scenes/registry.ts,
 * поэтому окно докладчика не загружает тяжёлые сцены и графики.
 */
export type Vec3 = readonly [number, number, number];

/** Пространственные объекты 3D-мира, которые проявляются на конкретных сценах. */
export type WorldFeature =
  | 'ball' // голографический мяч над полем
  | 'ring' // кольцо из пяти узлов жизненного цикла проекта
  | 'flow' // потоки данных: вход → спринты → результат
  | 'path' // световая дорога этапов и вех
  | 'tower' // ярусы иерархии: проект → результаты → пакеты работ
  | 'pillars' // 3D-столбцы бюджета и показателей
  | 'funnel' // кольца-фильтры: риски проходят через меры реагирования
  | 'orbit'; // орбиты команды и стейкхолдеров

export interface CameraPose {
  position: Vec3;
  target: Vec3;
  /** Угол обзора, по умолчанию 42°. */
  fov?: number;
}

export interface SceneMeta {
  id: string;
  number: number;
  /** Название для меню, окна докладчика и заголовка вкладки. */
  title: string;
  /** Короткая латинская подпись в стиле FootureX (Zen Dots). */
  eyebrow: string;
  camera: CameraPose;
  features: WorldFeature[];
  /** Затемнение 3D-фона под контентом (0 — нет, 1 — максимум), ради читаемости. */
  dim: number;
  /** Рекомендуемая длительность выступления на сцене, секунды. Сумма = 600 с. */
  durationSec: number;
}

export const SCENES: readonly SceneMeta[] = [
  {
    id: 'opening',
    number: 1,
    title: 'Управление проектами FootureX Uzbekistan',
    eyebrow: 'FootureX · PM',
    camera: { position: [0, 28, 92], target: [0, 7, 0] },
    features: [],
    dim: 0.15,
    durationSec: 30,
  },
  {
    id: 'goals',
    number: 2,
    title: 'Цель и задачи',
    eyebrow: 'Goals',
    camera: { position: [72, 40, 74], target: [0, 6, -6] },
    features: [],
    dim: 0.35,
    durationSec: 35,
  },
  {
    id: 'relevance',
    number: 3,
    title: 'Актуальность проектного управления',
    eyebrow: 'Relevance',
    camera: { position: [104, 22, 12], target: [0, 14, -40] },
    features: [],
    dim: 0.45,
    durationSec: 45,
  },
  {
    id: 'lifecycle',
    number: 4,
    title: 'Жизненный цикл проекта',
    eyebrow: 'Project Lifecycle',
    camera: { position: [64, 58, -64], target: [0, 12, 0] },
    features: ['ring'],
    dim: 0.55,
    durationSec: 40,
  },
  {
    id: 'method',
    number: 5,
    title: 'Гибридная методология',
    eyebrow: 'Hybrid Method',
    camera: { position: [-84, 60, 70], target: [0, 22, -64] },
    features: ['flow'],
    dim: 0.5,
    durationSec: 45,
  },
  {
    id: 'about',
    number: 6,
    title: 'Что такое FootureX',
    eyebrow: 'What is FootureX',
    camera: { position: [0, 9.8, 25], target: [0, 8.4, 0], fov: 46 },
    features: ['ball'],
    dim: 0.1,
    durationSec: 30,
  },
  {
    id: 'roadmap',
    number: 7,
    title: 'Программа развития',
    eyebrow: 'Roadmap',
    camera: { position: [-64, 48, -20], target: [0, 2, -128] },
    features: ['path'],
    dim: 0.35,
    durationSec: 35,
  },
  {
    id: 'charter',
    number: 8,
    title: 'Устав проекта',
    eyebrow: 'Project Charter',
    camera: { position: [-72, 34, -42], target: [0, 12, 0] },
    features: ['ball'],
    dim: 0.6,
    durationSec: 45,
  },
  {
    id: 'team',
    number: 9,
    title: 'Команда и стейкхолдеры',
    eyebrow: 'Team & Stakeholders',
    camera: { position: [-42, 72, 52], target: [0, 4, 0] },
    features: ['orbit'],
    dim: 0.6,
    durationSec: 45,
  },
  {
    id: 'wbs',
    number: 10,
    title: 'Иерархическая структура работ',
    eyebrow: 'WBS',
    camera: { position: [22, 46, 80], target: [0, 10, 0] },
    features: ['tower'],
    dim: 0.6,
    durationSec: 45,
  },
  {
    id: 'schedule',
    number: 11,
    title: 'Календарный план',
    eyebrow: 'Schedule · Gantt',
    camera: { position: [0, 40, -42], target: [0, 4, -150] },
    features: ['path'],
    dim: 0.62,
    durationSec: 50,
  },
  {
    id: 'budget',
    number: 12,
    title: 'Бюджет проекта',
    eyebrow: 'Project Budget',
    camera: { position: [62, 76, -52], target: [0, 0, 0] },
    features: ['pillars'],
    dim: 0.62,
    durationSec: 45,
  },
  {
    id: 'risks',
    number: 13,
    title: 'Управление рисками',
    eyebrow: 'Risk Management',
    camera: { position: [-32, 30, -82], target: [0, 16, 0] },
    features: ['funnel'],
    dim: 0.58,
    durationSec: 50,
  },
  {
    id: 'control',
    number: 14,
    title: 'Мониторинг, контроль и выводы',
    eyebrow: 'Control & Conclusions',
    camera: { position: [46, 30, 54], target: [0, 14, 0] },
    features: ['ring'],
    dim: 0.55,
    durationSec: 45,
  },
  {
    id: 'final',
    number: 15,
    title: 'Спасибо за внимание!',
    eyebrow: 'Thank you',
    camera: { position: [0, 64, 150], target: [0, 4, -30] },
    features: ['ball'],
    dim: 0.35,
    durationSec: 15,
  },
] as const;

export const SCENE_COUNT = SCENES.length;

export const TOTAL_DURATION_SEC = SCENES.reduce((sum, s) => sum + s.durationSec, 0);

export function clampIndex(index: number): number {
  return Math.min(Math.max(index, 0), SCENE_COUNT - 1);
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
