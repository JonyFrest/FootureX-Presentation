import { HEADCOUNT, KPI_GROUPS, TIME_TO_HIRE_DAYS } from '@/data/hr';
import { DAY_FORMS, PEOPLE_FORMS, ruPlural } from './ru';

/** Цель по годовой текучести — из плановых KPI (src/data/hr.ts). */
export const TURNOVER_TARGET =
  KPI_GROUPS.find((g) => g.id === 'hr')?.metrics.find((m) => m.label === 'Годовая текучесть')?.target ?? '';

export interface LifecycleStage {
  id: string;
  ru: string;
  en: string;
  /** Одна короткая фраза: что этап значит для FootureX. */
  text: string;
  /** Ключевая цифра или формула этапа. */
  figure?: { value: string; unit?: string; caption: string };
  /** Ступени карьерной лестницы (вместо цифры). */
  ladder?: readonly string[];
  /** Инструменты / каналы этапа. */
  points: readonly string[];
}

export const LIFECYCLE: readonly LifecycleStage[] = [
  {
    id: 'planning',
    ru: 'Планирование',
    en: 'Planning',
    text: 'Потребность в кадрах по этапам развития FootureX.',
    figure: {
      value: String(HEADCOUNT),
      unit: ruPlural(HEADCOUNT, PEOPLE_FORMS),
      caption: 'штатное расписание этапа 1 · план',
    },
    points: [],
  },
  {
    id: 'recruitment',
    ru: 'Подбор',
    en: 'Recruitment',
    text: 'Каналы поиска кандидатов:',
    figure: {
      value: `≤ ${TIME_TO_HIRE_DAYS}`,
      unit: ruPlural(TIME_TO_HIRE_DAYS, DAY_FORMS),
      caption: 'срок закрытия вакансии · цель',
    },
    points: ['hh.uz', 'LinkedIn', 'Telegram-сообщества', 'IT Park', 'Вузы', 'Рекомендации'],
  },
  {
    id: 'onboarding',
    ru: 'Адаптация',
    en: 'Onboarding',
    text: 'Новичок входит в продукт и команду по плану.',
    figure: { value: '30 · 60 · 90', unit: 'дней', caption: 'программа адаптации' },
    points: ['Наставник-бадди', 'Испытательный срок до 3 месяцев'],
  },
  {
    id: 'performance',
    ru: 'Оценка эффективности',
    en: 'Performance',
    text: 'Цели и результаты по каждому направлению.',
    figure: { value: 'KPI · OKR', caption: 'цели по направлениям' },
    points: ['Квартальный обзор', 'Встречи 1:1'],
  },
  {
    id: 'development',
    ru: 'Развитие',
    en: 'Development',
    text: 'Понятный карьерный путь внутри компании.',
    ladder: ['Junior', 'Middle', 'Senior', 'Lead'],
    points: ['Бюджет на обучение', 'Индивидуальный план развития'],
  },
  {
    id: 'retention',
    ru: 'Удержание',
    en: 'Retention',
    text: 'Сохраняем ключевых специалистов.',
    figure: { value: TURNOVER_TARGET, caption: 'текучесть в год · цель' },
    points: ['Премии по KPI', 'Карьерный рост', 'ДМС', 'Корпоративная культура'],
  },
] as const;

export const LOOP_NOTE = { lead: 'Цикл замыкается:', rest: 'данные об удержании → новое планирование' } as const;
