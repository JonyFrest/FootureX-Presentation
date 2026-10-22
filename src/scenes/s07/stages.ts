import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ClipboardList,
  Code2,
  Gamepad2,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trophy,
  Users,
  Warehouse,
} from 'lucide-react';
import { HEADCOUNT } from '@/data/hr';
import { PEOPLE_FORMS, ruPlural } from '../s04/ru';

export interface RoadmapStage {
  id: string;
  n: number;
  title: string;
  text: string;
  status: 'current' | 'planned';
  icon: LucideIcon;
  focus: readonly { label: string; icon: LucideIcon }[];
  stat?: { value: number; unit: string; caption: string };
}

export const ROADMAP: readonly RoadmapStage[] = [
  {
    id: 'it-game',
    n: 1,
    title: 'IT + Game',
    text: 'Telegram Mini App — стратегический футбольный симулятор.',
    status: 'current',
    icon: Gamepad2,
    focus: [
      { label: 'Найм IT-специалистов', icon: Code2 },
      { label: 'Продуктовая культура', icon: Sparkles },
    ],
    stat: { value: HEADCOUNT, unit: ruPlural(HEADCOUNT, PEOPLE_FORMS), caption: 'команда этапа 1 · план штата' },
  },
  {
    id: 'academy-fc',
    n: 2,
    title: 'Football Academy + FC FootureX',
    text: 'Детско-юношеская академия и профессиональный клуб.',
    status: 'planned',
    icon: Trophy,
    focus: [
      { label: 'Тренерский штаб', icon: Users },
      { label: 'Скауты', icon: Search },
      { label: 'Спортивные врачи', icon: Stethoscope },
      { label: 'Администрация академии', icon: ClipboardList },
    ],
  },
  {
    id: 'stadium-city',
    n: 3,
    title: 'Stadium + FootureX City',
    text: 'Стадион и городская инфраструктура.',
    status: 'planned',
    icon: Building2,
    focus: [
      { label: 'Операционный персонал стадиона', icon: Warehouse },
      { label: 'Сервис и безопасность', icon: ShieldCheck },
      { label: 'Масштабирование HR-службы', icon: Network },
    ],
  },
] as const;

export const STATUS_LABEL = { current: 'Текущий этап', planned: 'Планируется' } as const;
