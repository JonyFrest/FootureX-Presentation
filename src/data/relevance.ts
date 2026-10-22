/**
 * Сцена 03 «Почему проектное управление критично для технологического стартапа».
 * Три проблемы — по одной цифре на каждую, плюс вывод для FootureX.
 *
 * ВНИМАНИЕ: пока docs/research-notes-pm.md не готов, цифры ниже — КАНДИДАТЫ (verified: false).
 * На слайде у таких карточек выводится пометка «источник проверяется». После проверки замените
 * формулировку, число, источник, год и URL на отмеченные VERIFIED и выставьте verified: true.
 * Компонент сцены читает значения отсюда: цифры и тип инфографики меняются без правки раскладки.
 */

export type RelevanceVisual = 'gauge' | 'bars' | 'dots';

/** Строка сравнения для инфографики 'bars' (значение в процентах). */
export interface RelevanceBarRow {
  label: string;
  value: number;
  /** Подпись значения справа, по умолчанию «N%». */
  display?: string;
}

export interface RelevanceItem {
  id: string;
  /** Название проблемы (заголовок карточки). */
  title: string;
  /** Крупное число на карточке. */
  value: number;
  /** Единица числа: '%' включает пропорциональные визуализации; иначе выводится рядом с числом. */
  unit: string;
  /** Знак перед числом (например, «+»), необязательно. */
  prefix?: string;
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
  /** 'bars': строки сравнения; без них — одна полоса со значением карточки. */
  rows?: readonly RelevanceBarRow[];
  /** 'dots' для не-процентов: подпись масштаба, например «1 точка — 1 млн». */
  dotLegend?: string;
}

export const RELEVANCE: readonly RelevanceItem[] = [
  {
    // КАНДИДАТ — ждёт проверки в docs/research-notes-pm.md.
    id: 'time-budget',
    title: 'Сроки и бюджет',
    value: 45,
    unit: '%',
    prefix: '+',
    caption: 'в среднем перерасход бюджета крупных IT-проектов',
    statement: 'Крупные IT-проекты в среднем превышают бюджет на 45% и срок на 7%',
    source: 'McKinsey & University of Oxford, 2012',
    sourceYear: 2012,
    url: 'https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/delivering-large-scale-it-projects-on-time-on-budget-and-on-value',
    verified: false,
    visual: 'bars',
    rows: [
      { label: 'Бюджет', value: 45, display: '+45%' },
      { label: 'Срок', value: 7, display: '+7%' },
    ],
  },
  {
    // КАНДИДАТ — ждёт проверки в docs/research-notes-pm.md.
    id: 'talent-gap',
    title: 'Нехватка проектных специалистов',
    value: 25,
    unit: 'млн',
    caption: 'новых специалистов по управлению проектами нужно миру к 2030 году',
    statement: 'К 2030 году миру понадобится 25 млн новых специалистов по управлению проектами',
    source: 'PMI, Talent Gap, 2021',
    sourceYear: 2021,
    url: 'https://www.pmi.org/learning/careers/talent-gap-2021',
    verified: false,
    visual: 'dots',
    dotLegend: '1 точка — 1 млн специалистов',
  },
  {
    // КАНДИДАТ — ждёт проверки в docs/research-notes-pm.md.
    id: 'uncertainty',
    title: 'Неопределённость стартапа',
    value: 38,
    unit: '%',
    caption: 'закрывшихся стартапов: закончились деньги или не удалось привлечь инвестиции',
    statement: '38% закрывшихся стартапов назвали причиной нехватку денег или неудачу с привлечением инвестиций',
    source: 'CB Insights, Why Startups Fail, 2021',
    sourceYear: 2021,
    url: 'https://www.cbinsights.com/research/report/startup-failure-reasons-top/',
    verified: false,
    visual: 'gauge',
  },
];

/** Вывод для FootureX (связка статистики с проектом, без новых цифр). */
export const RELEVANCE_TAKEAWAY = {
  lead: 'Для FootureX это значит:',
  text: 'маленькой команде с фиксированным бюджетом нужны ясный план, чёткие приоритеты и контроль рисков с первого спринта.',
} as const;

/** Контекст Узбекистана: рост IT-сферы — больше технологических проектов (VERIFIED, research-notes A.4). */
export const RELEVANCE_UZ_CONTEXT = {
  label: 'Цель «Узбекистан-2030»',
  value: '300 тыс.',
  text: 'молодых людей в IT-сфере',
  source: 'Указ УП-158 от 11.09.2023',
  url: 'https://lex.uz/ru/docs/6600404',
  verified: true,
} as const;
