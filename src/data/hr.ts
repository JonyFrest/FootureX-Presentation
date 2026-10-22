/**
 * HR-модель FootureX Uzbekistan — единый источник данных для сцен 08–14.
 * Все суммы считаются кодом из исходных строк, поэтому таблицы, диаграммы и итоги
 * всегда математически согласованы.
 *
 * Важно: это ПЛАН (проект штатного расписания и бюджета этапа 1), а не фактические
 * данные компании. Оклады — валовые (до удержания НДФЛ), млн сум в месяц.
 */

export type DepartmentId = 'leadership' | 'tech' | 'product' | 'marketing' | 'hr' | 'finance';

export interface Department {
  id: DepartmentId;
  name: string;
  short: string;
  /** Руководитель направления (для оргструктуры). */
  head: string;
  responsibilities: string[];
}

export interface Position {
  id: string;
  department: DepartmentId;
  title: string;
  count: number;
  /** Оклад одного сотрудника, млн сум/мес (gross). */
  salary: number;
}

export const DEPARTMENTS: readonly Department[] = [
  {
    id: 'leadership',
    name: 'Руководство',
    short: 'CEO',
    head: 'CEO / основатель',
    responsibilities: [
      'Стратегия и переход между этапами развития',
      'Инвесторы, партнёры, бюджет',
      'Найм руководителей направлений',
    ],
  },
  {
    id: 'tech',
    name: 'Разработка',
    short: 'Tech',
    head: 'CTO / Tech Lead',
    responsibilities: [
      'Telegram Mini App и серверный матч-движок',
      'Архитектура, качество кода, релизы',
      'Стабильность и безопасность платформы',
    ],
  },
  {
    id: 'product',
    name: 'Продукт и дизайн',
    short: 'Product',
    head: 'Product Manager',
    responsibilities: [
      'Дорожная карта игры и приоритеты спринтов',
      'UX-исследования и интерфейс',
      'Продуктовая аналитика: MAU, удержание',
    ],
  },
  {
    id: 'marketing',
    name: 'Маркетинг и комьюнити',
    short: 'Marketing',
    head: 'Маркетинг-менеджер',
    responsibilities: [
      'Привлечение игроков и запуск в Узбекистане',
      'Telegram-каналы, соцсети, турниры',
      'Бренд FootureX и партнёрские акции',
    ],
  },
  {
    id: 'hr',
    name: 'HR и администрирование',
    short: 'HR',
    head: 'HR-менеджер',
    responsibilities: [
      'Подбор, адаптация, кадровое делопроизводство',
      'Оценка эффективности и KPI',
      'Обучение, мотивация, корпоративная культура',
    ],
  },
  {
    id: 'finance',
    name: 'Финансы',
    short: 'Finance',
    head: 'Бухгалтер',
    responsibilities: [
      'Расчёт заработной платы и налогов',
      'Бюджет и отчётность',
      'Платежи и договоры',
    ],
  },
] as const;

export const POSITIONS: readonly Position[] = [
  { id: 'ceo', department: 'leadership', title: 'CEO / основатель', count: 1, salary: 25 },
  { id: 'cto', department: 'tech', title: 'CTO / Tech Lead', count: 1, salary: 30 },
  { id: 'backend', department: 'tech', title: 'Backend-разработчик', count: 2, salary: 22 },
  { id: 'frontend', department: 'tech', title: 'Frontend / Telegram-разработчик', count: 2, salary: 20 },
  { id: 'gamedesign', department: 'tech', title: 'Геймдизайнер', count: 1, salary: 15 },
  { id: 'qa', department: 'tech', title: 'QA-инженер', count: 1, salary: 12 },
  { id: 'pm', department: 'product', title: 'Product Manager', count: 1, salary: 20 },
  { id: 'uiux', department: 'product', title: 'UI/UX-дизайнер', count: 1, salary: 14 },
  { id: 'marketing', department: 'marketing', title: 'Маркетинг-менеджер', count: 1, salary: 14 },
  { id: 'smm', department: 'marketing', title: 'SMM / Community-менеджер', count: 1, salary: 8 },
  { id: 'hrm', department: 'hr', title: 'HR-менеджер', count: 1, salary: 12 },
  { id: 'accountant', department: 'finance', title: 'Бухгалтер', count: 1, salary: 10 },
] as const;

/** Допущения бюджета (план). */
export const BUDGET_ASSUMPTIONS = {
  /** Целевая средняя премия по KPI, доля от окладного фонда (выплата ежеквартально). */
  bonusRate: 0.1,
  /** Социальный налог работодателя (общий режим НК РУз), доля от ФОТ (оклады + премии). */
  socialTaxRate: 0.12,
  /** НДФЛ удерживается из начисленной зарплаты сотрудника — не дополнительный расход работодателя. */
  personalIncomeTaxRate: 0.12,
} as const;

/** Дополнительные HR-расходы, млн сум в месяц. */
export const HR_EXTRA_COSTS = [
  { id: 'training', label: 'Обучение и развитие', monthly: 6 },
  { id: 'health', label: 'Медицинское страхование (ДМС)', monthly: 7 },
  { id: 'recruiting', label: 'Подбор персонала', monthly: 4 },
  { id: 'culture', label: 'Корпоративная культура', monthly: 3 },
  { id: 'hrtech', label: 'HR-сервисы и софт', monthly: 1.5 },
] as const;

const round1 = (n: number) => Math.round(n * 1000) / 1000;

export function positionMonthly(p: Position): number {
  return p.count * p.salary;
}

export const HEADCOUNT = POSITIONS.reduce((sum, p) => sum + p.count, 0);

export const departmentStats = DEPARTMENTS.map((d) => {
  const positions = POSITIONS.filter((p) => p.department === d.id);
  const headcount = positions.reduce((s, p) => s + p.count, 0);
  const monthly = positions.reduce((s, p) => s + positionMonthly(p), 0);
  return { ...d, positions, headcount, monthly };
});

const salariesMonthly = round1(POSITIONS.reduce((s, p) => s + positionMonthly(p), 0));
const bonusesMonthly = round1(salariesMonthly * BUDGET_ASSUMPTIONS.bonusRate);
const employerTaxMonthly = round1((salariesMonthly + bonusesMonthly) * BUDGET_ASSUMPTIONS.socialTaxRate);
const extraMonthly = round1(HR_EXTRA_COSTS.reduce((s, c) => s + c.monthly, 0));

export interface BudgetLine {
  id: 'salaries' | 'bonuses' | 'employerTax' | 'extra';
  label: string;
  note: string;
  monthly: number;
  annual: number;
}

export const BUDGET_LINES: readonly BudgetLine[] = [
  {
    id: 'salaries',
    label: 'Оклады',
    note: `${HEADCOUNT} сотрудников по штатному расписанию`,
    monthly: salariesMonthly,
    annual: round1(salariesMonthly * 12),
  },
  {
    id: 'bonuses',
    label: 'Премии по KPI',
    note: `${BUDGET_ASSUMPTIONS.bonusRate * 100}% окладного фонда, выплата раз в квартал`,
    monthly: bonusesMonthly,
    annual: round1(bonusesMonthly * 12),
  },
  {
    id: 'employerTax',
    label: 'Начисления работодателя',
    note: `Социальный налог ${BUDGET_ASSUMPTIONS.socialTaxRate * 100}% от (оклады + премии)`,
    monthly: employerTaxMonthly,
    annual: round1(employerTaxMonthly * 12),
  },
  {
    id: 'extra',
    label: 'Дополнительные HR-расходы',
    note: 'Обучение, ДМС, подбор, культура, HR-сервисы',
    monthly: extraMonthly,
    annual: round1(extraMonthly * 12),
  },
] as const;

export const BUDGET_TOTAL = {
  monthly: round1(BUDGET_LINES.reduce((s, l) => s + l.monthly, 0)),
  annual: round1(BUDGET_LINES.reduce((s, l) => s + l.annual, 0)),
};

/** Доля статьи в общем бюджете, %. */
export function budgetShare(line: BudgetLine): number {
  return (line.monthly / BUDGET_TOTAL.monthly) * 100;
}

/** Форматирование сумм: «244,0 млн сум», «3,87 млрд сум». */
export function formatMln(value: number, decimals = 1): string {
  return `${value.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} млн сум`;
}

export function formatBln(valueMln: number, decimals = 2): string {
  return `${(valueMln / 1000).toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} млрд сум`;
}

/* ------------------------------------------------------------------
   Воронка найма (план волны найма этапа 1: все позиции, кроме основателя)
   ------------------------------------------------------------------ */
export const HIRING_WAVE_POSITIONS = HEADCOUNT - 1;

export const FUNNEL_STAGES = [
  { id: 'vacancy', label: 'Вакансия', metric: 'Отклики', value: 700, days: 5, owner: 'HR + руководитель', detail: 'Профиль должности, публикация на hh.uz, LinkedIn, в Telegram-каналах IT Park и вузов' },
  { id: 'screening', label: 'Скрининг', metric: 'Прошли отбор резюме', value: 175, days: 7, owner: 'HR', detail: 'Отбор резюме по профилю, 15-минутный звонок, мотивация и ожидания' },
  { id: 'interview', label: 'Интервью', metric: 'Интервью', value: 52, days: 14, owner: 'Руководитель + команда', detail: 'Техническое интервью или тестовое задание, интервью на ценности' },
  { id: 'offer', label: 'Оффер', metric: 'Офферы', value: 16, days: 5, owner: 'HR + CEO', detail: 'Решение по кандидату, проверка рекомендаций, предложение о работе' },
  { id: 'hire', label: 'Найм', metric: 'Наймы', value: HIRING_WAVE_POSITIONS, days: 4, owner: 'HR + бухгалтерия', detail: 'Трудовой договор по ТК РУз, приказ, доступы, старт адаптации' },
] as const;

/** Конверсия этапа воронки относительно предыдущего, %. */
export function funnelConversion(index: number): number | null {
  if (index === 0) return null;
  return (FUNNEL_STAGES[index].value / FUNNEL_STAGES[index - 1].value) * 100;
}

export const TIME_TO_HIRE_DAYS = FUNNEL_STAGES.reduce((s, st) => s + st.days, 0);

/* ------------------------------------------------------------------
   Плановые KPI (целевые значения, не фактические результаты)
   ------------------------------------------------------------------ */
export interface KpiMetric {
  label: string;
  target: string;
  /** Нормированное значение цели 0..1 для индикаторов. */
  gauge: number;
  hint: string;
}

export interface KpiGroup {
  id: 'dev' | 'hr' | 'marketing' | 'leaders';
  title: string;
  metrics: KpiMetric[];
}

export const KPI_GROUPS: readonly KpiGroup[] = [
  {
    id: 'dev',
    title: 'Разработчики',
    metrics: [
      { label: 'Выполнение целей спринта', target: '≥ 85%', gauge: 0.85, hint: 'Доля задач спринта, закрытых в срок' },
      { label: 'Сессии без сбоев', target: '≥ 99,5%', gauge: 0.995, hint: 'Crash-free sessions в Mini App' },
      { label: 'Доступность сервиса', target: '≥ 99,5%', gauge: 0.995, hint: 'Uptime серверной части' },
      { label: 'Время от коммита до релиза', target: '≤ 3 дня', gauge: 0.7, hint: 'Lead time for changes' },
    ],
  },
  {
    id: 'hr',
    title: 'HR',
    metrics: [
      { label: 'Срок закрытия вакансии', target: `≤ ${TIME_TO_HIRE_DAYS} дней`, gauge: 0.75, hint: 'Time to hire: от вакансии до выхода' },
      { label: 'Принятие офферов', target: '≥ 80%', gauge: 0.8, hint: 'Доля принятых предложений о работе' },
      { label: 'Прохождение испытательного срока', target: '≥ 90%', gauge: 0.9, hint: 'Новички, успешно завершившие 90 дней' },
      { label: 'Годовая текучесть', target: '≤ 12%', gauge: 0.88, hint: 'Добровольные увольнения за год' },
    ],
  },
  {
    id: 'marketing',
    title: 'Маркетинг',
    metrics: [
      { label: 'Активные игроки в месяц', target: '15 000 MAU', gauge: 0.75, hint: 'Цель к концу первых 6 месяцев' },
      { label: 'Удержание 1-го дня', target: '≥ 35%', gauge: 0.35, hint: 'D1 retention новых игроков' },
      { label: 'Конверсия в платящих', target: '≥ 2%', gauge: 0.4, hint: 'Доля игроков с покупкой' },
      { label: 'Рост сообщества', target: '+10% / мес', gauge: 0.6, hint: 'Подписчики Telegram-канала' },
    ],
  },
  {
    id: 'leaders',
    title: 'Руководители',
    metrics: [
      { label: 'Выполнение OKR команды', target: '≥ 80%', gauge: 0.8, hint: 'Квартальные цели направления' },
      { label: 'Индекс вовлечённости (eNPS)', target: '≥ +30', gauge: 0.65, hint: 'Ежеквартальный опрос сотрудников' },
      { label: 'Встречи 1:1', target: '100%', gauge: 1, hint: 'Ежемесячно с каждым сотрудником' },
      { label: 'Удержание ключевых сотрудников', target: '≥ 90%', gauge: 0.9, hint: 'Кадровый резерв к этапу 2' },
    ],
  },
] as const;
