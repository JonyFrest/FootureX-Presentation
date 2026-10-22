import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  Building2,
  Code2,
  FlaskConical,
  Gamepad2,
  Landmark,
  Network,
  Rocket,
  TrendingUp,
  Trees,
  Trophy,
  Users,
  Warehouse,
} from 'lucide-react';
import { PROJECT, ROLES } from '@/data/project';

/** Русское склонение после числа: [1 месяц, 2 месяца, 5 месяцев]. */
export function ruPlural(n: number, forms: readonly [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

/** Одна цифра «паспорта» проекта (только для текущего этапа; всё считается из project.ts). */
export interface ProjectFact {
  id: string;
  /** Число для анимированного счёта. */
  value?: number;
  prefix?: string;
  /** Готовая строка вместо числа (например, «2 + 2»). */
  text?: string;
  caption: string;
}

export interface RoadmapStage {
  id: string;
  n: number;
  title: string;
  /** Проект (или проекты) этапа внутри программы развития. */
  project: { label: string; name: string };
  text: string;
  status: 'current' | 'planned';
  icon: LucideIcon;
  /** Проектный фокус этапа. */
  focus: readonly { label: string; icon: LucideIcon }[];
  facts?: readonly ProjectFact[];
}

const FULL_TIME = ROLES.filter((r) => r.fte === 1).length;
const PART_TIME = ROLES.filter((r) => r.fte !== null && r.fte < 1).length;

const MVP_FACTS: readonly ProjectFact[] = [
  {
    id: 'months',
    value: PROJECT.durationMonths,
    caption: ruPlural(PROJECT.durationMonths, ['месяц', 'месяца', 'месяцев']),
  },
  {
    id: 'sprints',
    value: PROJECT.sprints,
    caption: `${ruPlural(PROJECT.sprints, ['спринт', 'спринта', 'спринтов'])} по ${PROJECT.sprintWeeks} ${ruPlural(
      PROJECT.sprintWeeks,
      ['неделе', 'недели', 'недель'],
    )}`,
  },
  {
    id: 'team',
    text: `${FULL_TIME} + ${PART_TIME}`,
    caption: `${ruPlural(FULL_TIME, ['инженер', 'инженера', 'инженеров'])} + ${ruPlural(PART_TIME, [
      'специалист',
      'специалиста',
      'специалистов',
    ])} на полставки`,
  },
  {
    id: 'budget',
    value: PROJECT.teamBudgetMonthlyUsd,
    prefix: '$',
    caption: 'в месяц — бюджет команды',
  },
];

export const ROADMAP: readonly RoadmapStage[] = [
  {
    id: 'it-game',
    n: 1,
    title: 'IT + Game',
    project: { label: 'Проект', name: PROJECT.code },
    text: 'Запуск футбольного симулятора в Telegram.',
    status: 'current',
    icon: Gamepad2,
    facts: MVP_FACTS,
    focus: [
      { label: 'MVP игры', icon: Code2 },
      { label: 'Закрытая бета', icon: FlaskConical },
      { label: 'Публичный запуск в Узбекистане', icon: Rocket },
      { label: 'Кейс для раунда Seed', icon: TrendingUp },
    ],
  },
  {
    id: 'academy-fc',
    n: 2,
    title: 'Football Academy + FC FootureX',
    project: { label: 'Проекты', name: 'Академия и клуб' },
    text: 'Детско-юношеская академия и профессиональный клуб.',
    status: 'planned',
    icon: Trophy,
    focus: [
      { label: 'Лицензирование', icon: BadgeCheck },
      { label: 'Инфраструктура', icon: Warehouse },
      { label: 'Тренерский штаб', icon: Users },
    ],
  },
  {
    id: 'stadium-city',
    n: 3,
    title: 'Stadium + FootureX City',
    project: { label: 'Проект', name: 'Стадион и город' },
    text: 'Капитальный инфраструктурный проект: стадион и городская среда.',
    status: 'planned',
    icon: Building2,
    focus: [
      { label: 'Строительство стадиона', icon: Landmark },
      { label: 'Городская среда', icon: Trees },
      { label: 'Портфель подрядчиков', icon: Network },
    ],
  },
] as const;

export const STATUS_LABEL = { current: 'Текущий этап', planned: 'Планируется' } as const;

export const FOCUS_LABEL = 'Проектный фокус';
