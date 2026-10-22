/**
 * Сцена 03 «Почему проектное управление критично для технологического стартапа».
 * Три проблемы — по одной проверенной цифре на каждую, и вывод для FootureX.
 * Источник проверки: docs/research-notes-pm.md (часть A, статус VERIFIED, проверено 22.10.2026).
 * Компонент сцены читает значения отсюда: цифры и тип инфографики меняются без правки раскладки.
 */

export type RelevanceVisual = 'gauge' | 'bars' | 'dots';

/** Строка сравнения для инфографики 'bars'. */
export interface RelevanceBarRow {
  /** Подпись строки слева (например, год). */
  label: string;
  value: number;
  /** Подпись значения справа. */
  display: string;
}

export interface RelevanceItem {
  id: string;
  /** Название проблемы (заголовок карточки). */
  title: string;
  /** Крупное число на карточке. */
  value: number;
  /** Знаков после запятой у крупного числа. */
  decimals?: number;
  /** Единица числа: '%' включает пропорциональные визуализации; иначе выводится рядом с числом. */
  unit: string;
  /** Короткое слово перед числом (например, «до»), необязательно. */
  lead?: string;
  /** Подпись после числа, не длиннее 12 слов. */
  caption: string;
  /** Дополнительная короткая строка из того же источника, необязательно. */
  note?: string;
  /** Полная формулировка для слайда и экранного диктора. */
  statement: string;
  /** Издатель и название отчёта. */
  source: string;
  sourceYear: number;
  url: string;
  verified: boolean;
  /** Тип анимированной инфографики. */
  visual: RelevanceVisual;
  /** 'bars': подпись над полосами и строки сравнения (длина — доля от максимума строк). */
  bars?: { title: string; rows: readonly RelevanceBarRow[] };
}

export const RELEVANCE: readonly RelevanceItem[] = [
  {
    // research-notes-pm A1.1 + A1.2
    id: 'time-budget',
    title: 'Сроки и бюджет',
    value: 31,
    unit: '%',
    caption: 'сложных проектов не достигают всех запланированных выгод',
    note: 'Из-за плохо управляемой сложности 35% срывают сроки, 28% превышают бюджет',
    statement:
      '31% сложных проектов не достигают запланированных выгод; из-за плохо управляемой сложности 35% проектов срывают сроки, 28% превышают бюджет',
    source: 'PMI, Pulse of the Profession 2026',
    sourceYear: 2026,
    url: 'https://www.pmi.org/-/media/pmi/documents/public/pdf/learning/thought-leadership/pulse-of-the-profession_2026_pdf.pdf',
    verified: true,
    visual: 'gauge',
  },
  {
    // research-notes-pm A2.1 + A2.2 (Узбекистан, пессимистичный сценарий, тыс. специалистов)
    id: 'talent-gap',
    title: 'Нехватка проектных специалистов',
    value: 29.8,
    decimals: 1,
    unit: 'млн',
    lead: 'до',
    caption: 'дефицит проектных специалистов в мире к 2035 году',
    statement:
      'К 2035 году дефицит проектных специалистов в мире составит до 29,8 млн; Узбекистан — в топ-10 стран по росту спроса: +70%, со 107 до 182 тыс.',
    source: 'PMI, Global Project Management Talent Gap 2025',
    sourceYear: 2025,
    url: 'https://www.pmi.org/-/media/pmi/documents/public/pdf/learning/thought-leadership/talent_gap_2025-v3.pdf',
    verified: true,
    visual: 'bars',
    bars: {
      title: 'Узбекистан: спрос +70%',
      rows: [
        { label: '2025', value: 107, display: '107 тыс.' },
        { label: '2035', value: 182, display: '182 тыс.' },
      ],
    },
  },
  {
    // research-notes-pm A3.1 (версия от 05.03.2026; цифры 2021 года 38% / 35% не цитировать)
    id: 'uncertainty',
    title: 'Неопределённость стартапа',
    value: 43,
    unit: '%',
    caption: 'закрывшихся стартапов: слабое соответствие продукта рынку',
    statement: 'У 43% закрывшихся венчурных стартапов корневая причина — слабое соответствие продукта рынку',
    source: 'CB Insights, The top 9 reasons startups fail, 2026',
    sourceYear: 2026,
    url: 'https://www.cbinsights.com/research/report/startup-failure-reasons-top/',
    verified: true,
    visual: 'dots',
  },
];

/** Вывод для FootureX (связка статистики с проектом, без новых цифр). */
export const RELEVANCE_TAKEAWAY = {
  lead: 'Для FootureX это значит:',
  text: 'маленькой команде с жёстким бюджетом нужны ясный план, приоритеты и контроль рисков с первого спринта.',
} as const;
