import type { LucideIcon } from 'lucide-react';
import { CalendarClock, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import {
  BUDGET,
  CAPACITY,
  CONTROL_PILLARS,
  MILESTONES,
  PROJECT,
  RESERVE_RATE,
  RISKS,
  WBS_TOTAL,
  WORK_PACKAGES,
  formatUsd,
  riskScore,
  type Risk,
} from '@/data/project';
import { INDEX_TARGET } from '../s04/stages';
import { MILESTONE_FORMS, PACKAGE_FORMS, SPRINT_FORMS, plural } from '../s04/ru';

/** Неразрывные пробелы: «$37 290», «15 000» не разрываются между строками. */
const nb = (s: string) => s.replace(/[  ]/g, ' ');

type PillarId = (typeof CONTROL_PILLARS)[number]['id'];

const META: Record<PillarId, { en: string; icon: LucideIcon }> = {
  schedule: { en: 'Schedule', icon: CalendarClock },
  cost: { en: 'Cost', icon: Wallet },
  quality: { en: 'Quality', icon: ShieldCheck },
  value: { en: 'Value', icon: TrendingUp },
};

/** «SPI ≥ 0,95» → число «≥ 0,95» и подпись «SPI»; «15 000 MAU» → «15 000» и «MAU». */
function splitMetric(metric: string): { value: string; unit: string } {
  const m = metric.match(/(≥\s*)?\d[\d\s,.]*%?/);
  if (!m || m.index === undefined) return { value: metric, unit: '' };
  const value = nb(m[0].trim());
  const unit = `${metric.slice(0, m.index)} ${metric.slice(m.index + m[0].length)}`.replace(/\s+/g, ' ').trim();
  return { value, unit };
}

export interface Pillar {
  id: PillarId;
  ru: string;
  en: string;
  icon: LucideIcon;
  /** Целевое значение (план), крупно. */
  value: string;
  unit: string;
  instruments: readonly string[];
}

export const PILLARS: readonly Pillar[] = CONTROL_PILLARS.map((p) => ({
  id: p.id,
  ru: p.title,
  en: META[p.id].en,
  icon: META[p.id].icon,
  ...splitMetric(p.metric),
  instruments: p.instruments,
}));

/** Ядро схемы: общий порог индексов освоенного объёма. */
export const CORE = { label: 'Контроль', caption: `SPI · CPI ${INDEX_TARGET}`, note: 'целевое значение' } as const;

/* ---------------- Выводы и рекомендации ---------------- */

type Part = string | { em: string };

/** Короткие формулировки рисков для вывода (полные названия и меры — в src/data/project.ts, сцена 13). */
const RISK_SHORT: Record<string, { name: string; response: string }> = {
  R1: { name: 'расползание содержания', response: 'жёсткие границы MVP' },
  R2: { name: 'платежи в регионе', response: 'запасной способ оплаты' },
  R3: { name: 'дисбаланс экономики', response: 'настройка по данным беты' },
  R4: { name: 'уход ключевого инженера', response: 'общие знания в команде' },
};

const short = (r: Risk) => RISK_SHORT[r.id] ?? { name: r.title.toLowerCase(), response: r.response.toLowerCase() };

/** Два риска с наибольшей оценкой «вероятность × влияние». */
export const TOP_RISKS = [...RISKS].sort((a, b) => riskScore(b) - riskScore(a)).slice(0, 2).map(short);

export const CONCLUSIONS: readonly { parts: readonly Part[] }[] = [
  {
    parts: [
      'Проектный подход превращает стратегию FootureX в ',
      { em: 'управляемый план' },
      ': устав, ',
      { em: nb(plural(WORK_PACKAGES.length, PACKAGE_FORMS)) },
      ', ',
      { em: nb(plural(PROJECT.sprints, SPRINT_FORMS)) },
      ' и ',
      { em: nb(plural(MILESTONES.length, MILESTONE_FORMS)) },
      '.',
    ],
  },
  {
    parts: [
      'План реалистичен: ',
      { em: `${WBS_TOTAL}\u00A0ид` },
      ' при ёмкости ',
      { em: `${CAPACITY.min}–\u2060${CAPACITY.max}\u00A0ид` },
      '; бюджет ',
      { em: nb(formatUsd(BUDGET.total)) },
      ' с резервом ',
      { em: `${Math.round(RESERVE_RATE * 100)}%` },
      '.',
    ],
  },
  {
    parts: [
      'Главные риски — ',
      { em: `${TOP_RISKS[0].name} и ${TOP_RISKS[1].name}` },
      '; их снижают ',
      { em: TOP_RISKS[0].response },
      ' и ',
      { em: TOP_RISKS[1].response },
      '.',
    ],
  },
];

export const RECOMMENDATIONS: readonly string[] = [
  'Пересматривать риски и SPI/CPI на каждом обзоре спринта',
  'Калибровать оценки после спринта 1 и обновлять базовый план',
  'Не расширять содержание MVP без решения спонсора',
  'Использовать опыт MVP как шаблон для проектов этапов 2–3',
];
