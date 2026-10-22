import { Cpu, Gamepad2, Waypoints, type LucideIcon } from 'lucide-react';

export interface Pillar {
  id: string;
  label: string;
  /** Короткая латинская подпись. */
  tag: string;
  icon: LucideIcon;
  /** Одна короткая строка, раскрывается при наведении, фокусе или касании. */
  line: string;
  /** Для «Экосистемы» — шаги цепочки вместо строки. */
  steps?: string[];
}

export const PILLARS: readonly Pillar[] = [
  {
    id: 'game',
    label: 'Игра',
    tag: 'Game',
    icon: Gamepad2,
    line: 'Стратегический футбольный симулятор в Telegram Mini App: свой клуб, состав, тактика, серверный расчёт матчей',
  },
  {
    id: 'tech',
    label: 'Технологии',
    tag: 'Tech',
    icon: Cpu,
    line: 'React, TypeScript, NestJS, PostgreSQL, AI-статистика матча',
  },
  {
    id: 'ecosystem',
    label: 'Экосистема',
    tag: 'Ecosystem',
    icon: Waypoints,
    line: 'Игра → академия и клуб → стадион и город',
    steps: ['Игра', 'Академия и клуб', 'Стадион и город'],
  },
];
