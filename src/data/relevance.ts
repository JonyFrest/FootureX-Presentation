/**
 * Сцена 03 «Почему HR важен для развивающейся технологической компании».
 * Три ключевые проблемы — по одной проверенной цифре на каждую.
 * Источник проверки: docs/research-notes.md (раздел A, статус VERIFIED, проверено 22.10.2026).
 * Компонент сцены читает значения отсюда: число можно поменять, не трогая раскладку.
 */

export type RelevanceVisual = 'gauge' | 'bars' | 'dots';

export interface RelevanceItem {
  id: string;
  /** Название проблемы (заголовок карточки). */
  title: string;
  /** Крупное число на карточке. */
  value: number;
  /** Единица числа: '%' включает пропорциональные визуализации. */
  unit: string;
  /** Короткое слово перед числом (например, «лишь»), необязательно. */
  lead?: string;
  /** Подпись после числа, не длиннее 12 слов. */
  caption: string;
  /** Полная формулировка для слайда и экранного диктора. */
  statement: string;
  /** Издатель и название отчёта. */
  source: string;
  sourceYear: number;
  url: string;
  verified: boolean;
  /** Тип анимированной инфографики. */
  visual: RelevanceVisual;
}

export const RELEVANCE: readonly RelevanceItem[] = [
  {
    id: 'competition',
    title: 'Конкуренция за специалистов',
    value: 72,
    unit: '%',
    caption: 'работодателей в мире с трудом находят квалифицированных специалистов',
    statement: '72% работодателей в мире с трудом находят квалифицированных специалистов',
    source: 'ManpowerGroup, Global Talent Shortage 2026',
    sourceYear: 2026,
    url: 'https://investor.manpowergroup.com/node/68796',
    verified: true,
    visual: 'gauge',
  },
  {
    id: 'growth',
    title: 'Рост команды',
    value: 39,
    unit: '%',
    caption: 'навыков работников изменятся или устареют к 2030 году',
    statement: '39% навыков работников изменятся или устареют к 2030 году',
    source: 'WEF, The Future of Jobs Report 2025',
    sourceYear: 2025,
    url: 'https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf',
    verified: true,
    visual: 'bars',
  },
  {
    id: 'retention',
    title: 'Удержание талантов',
    value: 20,
    unit: '%',
    lead: 'лишь',
    caption: 'сотрудников в мире вовлечены в работу',
    statement: 'Лишь 20% сотрудников в мире вовлечены в работу',
    source: 'Gallup, State of the Global Workplace 2026',
    sourceYear: 2026,
    url: 'https://www.gallup.com/file/workplace/707798/state-of-the-global-workplace-2026-download.pdf',
    verified: true,
    visual: 'dots',
  },
];

/** Вывод для FootureX (связка статистики с проектом). */
export const RELEVANCE_TAKEAWAY = {
  lead: 'Для FootureX это значит:',
  text: 'HR-система нужна уже на этапе стартапа — чтобы нанять, развивать и удержать команду.',
} as const;

/** Контекст Узбекистана (VERIFIED, research-notes A.4). */
export const RELEVANCE_UZ_CONTEXT = {
  label: 'Цель «Узбекистан-2030»',
  value: '300 тыс.',
  text: 'молодых людей в IT-сфере',
  source: 'Указ УП-158 от 11.09.2023',
  url: 'https://lex.uz/ru/docs/6600404',
  verified: true,
} as const;

/** Дополнительная строка к карточке удержания (VERIFIED, research-notes A.3, п. 8). */
export const RELEVANCE_RETENTION_NOTE = {
  text: '90% компаний обеспокоены удержанием; обучение — стратегия №1',
  source: 'LinkedIn, Workplace Learning Report 2024',
  url: 'https://learning.linkedin.com/content/dam/lem/business/en/learn/resources/workplace-learning-report-2024/LinkedIn-Workplace-Learning-Report-2024.pdf',
  verified: true,
} as const;
