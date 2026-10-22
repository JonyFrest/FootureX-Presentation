import {
  BUDGET,
  CONTROL_PILLARS,
  MILESTONES,
  PROJECT,
  RISKS,
  WBS_TOTAL,
  WORK_PACKAGES,
  formatUsd,
} from '@/data/project';
import {
  CRITERION_FORMS,
  MILESTONE_FORMS,
  MONTH_FORMS,
  PACKAGE_FORMS,
  RISK_FORMS,
  SPRINT_FORMS,
  WEEK_FORMS,
  ruPlural,
} from './ru';

/** Диапазон вех: «M1–M5». */
export const MILESTONE_RANGE = `${MILESTONES[0].id}–${MILESTONES[MILESTONES.length - 1].id}`;

/** Целевой порог индексов SPI/CPI из плана контроля: «≥ 0,95». */
export const INDEX_TARGET = (CONTROL_PILLARS.find((p) => p.id === 'schedule')?.metric ?? '').replace(/^SPI\s*/, '');

export interface StageFact {
  value: string;
  label: string;
}

export interface LifecycleStage {
  id: string;
  ru: string;
  /** Группа процессов PMI (латинская подпись). */
  en: string;
  /** Короткая латинская подпись для узла кольца. */
  enShort?: string;
  /** Одна короткая фраза: что этап значит для FootureX MVP. */
  text: string;
  /** Ключевая цифра этапа. */
  figure?: { value: string; unit?: string; caption: string };
  /** Сетка ключевых чисел (вместо одной цифры). */
  facts?: readonly StageFact[];
  /** Документы и инструменты этапа. */
  points: readonly string[];
  /** Выход этапа. */
  result: string;
  /** Процесс идёт через весь проект, параллельно остальным этапам. */
  spansAll?: boolean;
}

const nb = (s: string) => s.replace(/ /g, ' ');

export const LIFECYCLE: readonly LifecycleStage[] = [
  {
    id: 'initiating',
    ru: 'Инициация',
    en: 'Initiating',
    text: 'Устав фиксирует цель по SMART, границы MVP и спонсора.',
    figure: {
      value: String(PROJECT.durationMonths),
      unit: ruPlural(PROJECT.durationMonths, MONTH_FORMS),
      caption: 'срок MVP · цель по SMART',
    },
    points: ['Устав проекта', 'Цель по SMART', 'Границы MVP', `Спонсор — ${PROJECT.sponsor}`],
    result: 'Устав утверждён',
  },
  {
    id: 'planning',
    ru: 'Планирование',
    en: 'Planning',
    text: 'Базовый план: содержание, сроки, стоимость и риски.',
    facts: [
      {
        value: String(WORK_PACKAGES.length),
        label: `${ruPlural(WORK_PACKAGES.length, PACKAGE_FORMS)} WBS · ${WBS_TOTAL} ид`,
      },
      {
        value: String(PROJECT.sprints),
        label: `${ruPlural(PROJECT.sprints, SPRINT_FORMS)} · ${MILESTONES.length} ${ruPlural(MILESTONES.length, MILESTONE_FORMS)}`,
      },
      { value: nb(formatUsd(BUDGET.total)), label: 'бюджет с резервом · план' },
      { value: String(RISKS.length), label: `${ruPlural(RISKS.length, RISK_FORMS)} в реестре` },
    ],
    points: [],
    result: 'Базовый план: содержание, сроки, бюджет',
  },
  {
    id: 'executing',
    ru: 'Исполнение',
    en: 'Executing',
    text: 'Команда создаёт продукт короткими итерациями по Scrum.',
    figure: {
      value: String(PROJECT.sprints),
      unit: ruPlural(PROJECT.sprints, SPRINT_FORMS),
      caption: `по ${PROJECT.sprintWeeks} ${ruPlural(PROJECT.sprintWeeks, WEEK_FORMS)} · ${PROJECT.sprintCapacity.min}–${PROJECT.sprintCapacity.max} ид за спринт`,
    },
    points: ['Планирование спринта', 'Daily Scrum', 'Обзор спринта', 'Ретроспектива'],
    result: 'Инкремент продукта в конце каждого спринта',
  },
  {
    id: 'monitoring',
    ru: 'Мониторинг и контроль',
    en: 'Monitoring & Controlling',
    enShort: 'Monitoring',
    text: 'Идёт параллельно всем этапам — от устава до приёмки.',
    figure: { value: INDEX_TARGET, caption: 'SPI и CPI · целевое значение' },
    points: [`Вехи ${MILESTONE_RANGE}`, 'Диаграмма сгорания', 'Изменения — через бэклог и спонсора'],
    result: 'Корректирующие действия и обновлённый план',
    spansAll: true,
  },
  {
    id: 'closing',
    ru: 'Завершение',
    en: 'Closing',
    text: 'Приёмка MVP и передача опыта следующему этапу.',
    figure: {
      value: String(PROJECT.acceptance.length),
      unit: `${ruPlural(PROJECT.acceptance.length, CRITERION_FORMS)} приёмки`,
      caption: 'из устава проекта',
    },
    points: ['Кейс для раунда Seed', 'Ретроспектива', 'Бэклог следующего этапа'],
    result: 'Проект закрыт, опыт — в следующий этап',
  },
] as const;

export const LOOP_NOTE = { lead: 'Опыт завершения', rest: '→ инициация следующего этапа' } as const;
