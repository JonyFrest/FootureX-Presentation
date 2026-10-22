import type { LucideIcon } from 'lucide-react';
import { GraduationCap, HeartHandshake, TrendingUp, Wallet } from 'lucide-react';
import { BUDGET_ASSUMPTIONS, BUDGET_LINES, BUDGET_TOTAL, HR_EXTRA_COSTS, formatBln } from '@/data/hr';
import { TURNOVER_TARGET } from '../s04/stages';

const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 1 });

const trainingMonthly = HR_EXTRA_COSTS.find((c) => c.id === 'training')?.monthly ?? 0;
const salaries = BUDGET_LINES.find((l) => l.id === 'salaries');
/** Доля окладов в годовом бюджете на персонал, % (округлено). */
export const SALARY_SHARE = salaries ? Math.round((salaries.annual / BUDGET_TOTAL.annual) * 100) : 0;
/** Неразрывные пробелы — сумма не разрывается между строками. */
export const BUDGET_ANNUAL_LABEL = formatBln(BUDGET_TOTAL.annual).replace(/ /g, '\u00A0');
export const BONUS_PCT = Math.round(BUDGET_ASSUMPTIONS.bonusRate * 100);
export { TURNOVER_TARGET };

export type Highlight =
  | { kind: 'stat'; value: string; unit?: string; caption: string }
  | { kind: 'ladder'; steps: readonly string[]; caption: string }
  | { kind: 'mission'; text: string; caption: string };

export interface Pillar {
  id: string;
  ru: string;
  en: string;
  icon: LucideIcon;
  highlight: Highlight;
  items: readonly string[];
}

export const PILLARS: readonly Pillar[] = [
  {
    id: 'money',
    ru: 'Финансовая мотивация',
    en: 'Compensation',
    icon: Wallet,
    highlight: {
      kind: 'stat',
      value: `${BONUS_PCT}%`,
      unit: 'окладного фонда',
      caption: 'квартальная премия по KPI · план',
    },
    items: ['Оклад на уровне рынка Ташкента', 'Квартальная премия по KPI', 'Ежегодный пересмотр окладов'],
  },
  {
    id: 'career',
    ru: 'Карьерное развитие',
    en: 'Career',
    icon: TrendingUp,
    highlight: { kind: 'ladder', steps: ['Junior', 'Middle', 'Senior', 'Lead'], caption: 'грейды' },
    items: ['Приоритет внутренним кандидатам на роли этапов 2–3', 'Кадровый резерв'],
  },
  {
    id: 'learning',
    ru: 'Обучение',
    en: 'Learning',
    icon: GraduationCap,
    highlight: { kind: 'stat', value: fmt(trainingMonthly), unit: 'млн сум в месяц', caption: 'бюджет на обучение · план' },
    items: ['Наставничество', 'Курсы, конференции, сертификация'],
  },
  {
    id: 'culture',
    ru: 'Корпоративная культура',
    en: 'Culture',
    icon: HeartHandshake,
    highlight: { kind: 'mission', text: 'Creating a Digital Football Era', caption: 'миссия FootureX' },
    items: ['Ценности Digital Football Era', 'Гибридный график', 'Внутренние турниры FootureX', 'eNPS-опрос раз в квартал'],
  },
] as const;

/** Выводы: части фраз с акцентом (числа считаются из src/data/hr.ts). */
export const CONCLUSIONS: readonly { parts: readonly (string | { em: string })[] }[] = [
  { parts: [{ em: 'HR — стратегическая функция' }, ' FootureX: каждому этапу развития нужен свой план персонала.'] },
  {
    parts: [
      'Бюджет на персонал этапа 1 — ',
      { em: `≈${BUDGET_ANNUAL_LABEL}` },
      ' в год, из них ',
      { em: `${SALARY_SHARE}%` },
      ' — оклады.',
    ],
  },
  {
    parts: [
      'Главный риск — ',
      { em: 'удержание IT-специалистов' },
      '; его снижают KPI-премии, грейды, обучение и культура.',
    ],
  },
];

export const RECOMMENDATIONS: readonly string[] = [
  'Внедрить HR-систему и KPI-панель с первого месяца',
  'Запустить реферальную программу найма',
  'Проводить eNPS-опрос ежеквартально',
  'Сформировать кадровый резерв к этапу 2',
];
