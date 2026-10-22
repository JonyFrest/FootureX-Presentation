/**
 * Проект «FootureX MVP» — единый источник данных для сцен 02–14.
 *
 * Основа — спринт-бэклог Stage 0 проекта FootureX (документ BX-016): 6 месяцев,
 * 12 спринтов по 2 недели, 13 эпиков с оценками в идеальных человеко-днях (ид),
 * бюджет команды $5 000 в месяц, вехи и риски. Всё, чего нет в бэклоге
 * (разбивка бюджета, оценки рисков, RACI, стейкхолдеры, KPI), — плановые допущения
 * этого проекта и помечаются на слайдах как «план».
 *
 * Итоги, суммы и доли считаются кодом, поэтому все сцены и текст выступления согласованы.
 */

/* ------------------------------------------------------------------
   Паспорт проекта и устав
   ------------------------------------------------------------------ */
export const PROJECT = {
  code: 'FootureX MVP',
  name: 'Запуск игры FootureX в Telegram',
  program: 'Этап 1 · IT + Game',
  durationMonths: 6,
  sprintWeeks: 2,
  sprints: 12,
  /** Бюджет команды из бэклога, $ в месяц. */
  teamBudgetMonthlyUsd: 5000,
  /** Ёмкость спринта с учётом накладных, идеальные человеко-дни (бэклог BX-016). */
  sprintCapacity: { min: 16, max: 18 },
  sponsor: 'CEO / основатель',
  manager: 'Руководитель проекта (Product Owner)',
  /** Цель по SMART. */
  goal:
    'За 6 месяцев (12 спринтов по 2 недели) запустить в Узбекистане Telegram Mini App FootureX — создание клуба, матч, управление составом, магазин и платежи — и выйти на ~15 000 активных игроков в месяц при бюджете команды $5 000 в месяц.',
  inScope: [
    'Создание клуба: название, эмблема, форма, стартовый состав',
    'Матч на сервере и AI-статистика матча',
    'Управление составом и тактикой, рост игроков',
    'Экономика, магазин и платежи Telegram Stars',
    'Профиль, аналитика, локализация RU / UZ / EN',
    'Закрытая бета и публичный запуск в Узбекистане',
  ],
  outOfScope: [
    'Полноценные лиги и маркетплейс — следующий этап',
    'Футбольная академия и клуб FC FootureX — этап 2',
    'Стадион и FootureX City — этап 3',
  ],
  constraints: [
    'Бюджет команды — $5 000 в месяц',
    'Команда — 2 инженера и 2 специалиста на полставки',
    'Срок — 6 месяцев без переноса публичного запуска',
    'Платежи Telegram Stars/TON доступны в регионе с ограничениями',
  ],
  /** Критерии приёмки из бэклога BX-016. */
  acceptance: [
    'Создание клуба проходит без ошибок',
    'Матч и AI-статистика считаются на сервере и отображаются',
    'Покупка Premium Pass и пака FTXcoin; леджер и защита экономики корректны',
    'Адаптивность: iPhone SE, стандартные и крупные Android, светлая и тёмная темы',
    'Метрики собираются, закрытая бета идёт',
  ],
} as const;

/* ------------------------------------------------------------------
   Иерархическая структура работ (WBS)
   ------------------------------------------------------------------ */
export type DeliverableId = 'platform' | 'game' | 'economy' | 'growth';

export interface Deliverable {
  id: DeliverableId;
  code: string;
  title: string;
  description: string;
}

export const DELIVERABLES: readonly Deliverable[] = [
  { id: 'platform', code: '1', title: 'Платформа и запуск', description: 'Каркас, инфраструктура, CI, бета и публичный запуск' },
  { id: 'game', code: '2', title: 'Игровой продукт', description: 'Клуб, состав, матч, AI-статистика, рост игроков' },
  { id: 'economy', code: '3', title: 'Экономика и монетизация', description: 'Валюты, леджер, магазин, платежи Telegram Stars' },
  { id: 'growth', code: '4', title: 'Аналитика и локализация', description: 'Профиль, события, MAU, D1/D7, RU / UZ / EN' },
] as const;

export interface WorkPackage {
  id: string;
  /** Код в WBS, например 2.3. */
  code: string;
  deliverable: DeliverableId;
  title: string;
  detail: string;
  /** Оценка, идеальные человеко-дни (бэклог BX-016). */
  estimate: number;
  /** Номера спринтов (1–12), в которых идёт работа. */
  sprints: number[];
  /** На критическом пути к публичному запуску. */
  critical: boolean;
}

export const WORK_PACKAGES: readonly WorkPackage[] = [
  { id: 'E1', code: '1.1', deliverable: 'platform', title: 'Платформа и каркас', detail: 'Монорепозиторий, CI, Docker, окружения', estimate: 8, sprints: [1], critical: true },
  { id: 'E13', code: '1.2', deliverable: 'platform', title: 'Бета, запуск и наблюдаемость', detail: 'Закрытая бета → публичный запуск, мониторинг, стабилизация', estimate: 14, sprints: [6, 8, 11, 12], critical: true },
  { id: 'E2', code: '2.1', deliverable: 'game', title: 'Вход и онбординг', detail: 'Авторизация Telegram, сессия, обучающий матч', estimate: 14, sprints: [1], critical: true },
  { id: 'E3', code: '2.2', deliverable: 'game', title: 'CREATE — создание клуба', detail: 'Название, эмблема, форма, философия, стартовый состав', estimate: 16, sprints: [2], critical: true },
  { id: 'E5', code: '2.3', deliverable: 'game', title: 'MANAGE — состав и тактика', detail: 'Расстановка, химия и сила состава, тактика', estimate: 20, sprints: [3], critical: true },
  { id: 'E6', code: '2.4', deliverable: 'game', title: 'Матч-движок', detail: 'Баланс движка и интеграция с API', estimate: 14, sprints: [4], critical: true },
  { id: 'E7', code: '2.5', deliverable: 'game', title: 'AI-статистика матча', detail: 'Владение, xG, удары, тепловая карта', estimate: 12, sprints: [4], critical: false },
  { id: 'E8', code: '2.6', deliverable: 'game', title: 'DEVELOP — рост игроков', detail: 'Опыт за матчи, рост характеристик', estimate: 10, sprints: [6], critical: false },
  { id: 'E4', code: '2.7', deliverable: 'game', title: 'Главный экран', detail: 'Валюты, карточка матча, бесплатный пак, плитки', estimate: 12, sprints: [7], critical: false },
  { id: 'E9', code: '3.1', deliverable: 'economy', title: 'Экономика и леджер', detail: 'Валюты, леджер, защита экономики, баланс', estimate: 16, sprints: [5, 9], critical: false },
  { id: 'E10', code: '3.2', deliverable: 'economy', title: 'Магазин и платежи', detail: 'Premium Pass и паки FTXcoin за Telegram Stars', estimate: 22, sprints: [5, 8], critical: true },
  { id: 'E11', code: '4.1', deliverable: 'growth', title: 'Профиль и аналитика', detail: 'События, MAU, удержание D1/D7, воронка', estimate: 10, sprints: [6, 11], critical: false },
  { id: 'E12', code: '4.2', deliverable: 'growth', title: 'Локализация', detail: 'Русский, узбекский, английский', estimate: 8, sprints: [7], critical: false },
] as const;

/** Задел следующего этапа: выполняется из буфера ёмкости, если график соблюдается (вне содержания MVP). */
export const OPTIONAL_PACKAGE = {
  id: 'L1',
  title: 'Задел: базовые лиги',
  detail: 'Рейтинговая лестница и сезоны — только при запасе ёмкости',
  estimate: 11,
  sprints: [10],
} as const;

export const WBS_TOTAL = WORK_PACKAGES.reduce((s, p) => s + p.estimate, 0);

export const deliverableStats = DELIVERABLES.map((d) => {
  const packages = WORK_PACKAGES.filter((p) => p.deliverable === d.id);
  const estimate = packages.reduce((s, p) => s + p.estimate, 0);
  return { ...d, packages, estimate, share: (estimate / WBS_TOTAL) * 100 };
});

export const CAPACITY = {
  min: PROJECT.sprints * PROJECT.sprintCapacity.min,
  max: PROJECT.sprints * PROJECT.sprintCapacity.max,
};

/** Загрузка команды оценкой WBS, % (при минимальной и максимальной ёмкости). */
export const LOAD = {
  atMin: (WBS_TOTAL / CAPACITY.min) * 100,
  atMax: (WBS_TOTAL / CAPACITY.max) * 100,
};

/** Буфер ёмкости, ид. */
export const BUFFER = { min: CAPACITY.min - WBS_TOTAL, max: CAPACITY.max - WBS_TOTAL };

/** Цель проекта по SMART (значения считаются из WBS и паспорта проекта). */
export const SMART = [
  { letter: 'S', label: 'Конкретная', text: 'MVP игры в Telegram: клуб, матч, состав, магазин' },
  { letter: 'M', label: 'Измеримая', text: `${PROJECT.acceptance.length} критериев приёмки и ~15 000 MAU` },
  { letter: 'A', label: 'Достижимая', text: `${WBS_TOTAL} ид работ при ёмкости ${CAPACITY.min}–${CAPACITY.max} ид` },
  { letter: 'R', label: 'Значимая', text: 'Основа экосистемы и кейс для раунда Seed' },
  { letter: 'T', label: 'Ограниченная во времени', text: `${PROJECT.durationMonths} месяцев, ${PROJECT.sprints} спринтов, 5 вех` },
] as const;

/* ------------------------------------------------------------------
   Календарный план: вехи
   ------------------------------------------------------------------ */
export interface Milestone {
  id: string;
  title: string;
  /** Веха наступает в конце этого спринта. */
  sprint: number;
  month: number;
  result: string;
  /** Цель по аудитории, если есть (бэклог BX-016). */
  mau?: number;
}

export const MILESTONES: readonly Milestone[] = [
  { id: 'M1', title: 'Альфа', sprint: 4, month: 2, result: 'Клуб, матч и базовое управление составом работают' },
  { id: 'M2', title: 'Закрытая бета', sprint: 6, month: 3, result: 'Экономика, первые платежи, сбор метрик', mau: 1200 },
  { id: 'M3', title: 'Публичный запуск в Узбекистане', sprint: 8, month: 4, result: 'Главный экран, локализация, магазин, адаптивность' },
  { id: 'M4', title: 'Экономика v1', sprint: 10, month: 5, result: 'Баланс по данным беты, базовые лиги', mau: 9000 },
  { id: 'M5', title: 'Кейс для раунда Seed', sprint: 12, month: 6, result: 'Стабильность, метрики роста, демо для инвесторов', mau: 15000 },
] as const;

/** Неделя окончания спринта (1-я неделя проекта = 1). */
export const sprintEndWeek = (sprint: number) => sprint * PROJECT.sprintWeeks;

/* ------------------------------------------------------------------
   Команда, RACI, стейкхолдеры
   ------------------------------------------------------------------ */
export type RoleId = 'sponsor' | 'pm' | 'fullstack' | 'frontend' | 'design' | 'qa';
export type Raci = 'R' | 'A' | 'C' | 'I';

export interface Role {
  id: RoleId;
  title: string;
  /** Занятость в проекте, ставки (null — вне бюджета команды). */
  fte: number | null;
  focus: string;
}

export const ROLES: readonly Role[] = [
  { id: 'sponsor', title: 'Спонсор проекта (CEO)', fte: null, focus: 'Утверждает устав, бюджет и изменения границ проекта' },
  { id: 'pm', title: 'Руководитель проекта (Product Owner)', fte: null, focus: 'План, бэклог, приоритеты, риски, отчётность' },
  { id: 'fullstack', title: 'Fullstack-инженер', fte: 1, focus: 'Сервер, матч-движок, экономика, платежи' },
  { id: 'frontend', title: 'Frontend / Telegram-инженер', fte: 1, focus: 'Mini App, интерфейс, локализация, аналитика' },
  { id: 'design', title: 'UI/UX-дизайнер', fte: 0.5, focus: 'Интерфейс, эмблемы, адаптивность' },
  { id: 'qa', title: 'QA-инженер', fte: 0.5, focus: 'Тестирование, приёмка, бета, стабильность' },
] as const;

/** Колонки матрицы RACI: результаты WBS + управление проектом. */
export const RACI_COLUMNS = [
  ...DELIVERABLES.map((d) => ({ id: d.id as string, title: d.title })),
  { id: 'pmgmt', title: 'Управление проектом' },
] as const;

export const RACI: Record<RoleId, Record<string, Raci>> = {
  sponsor: { platform: 'I', game: 'C', economy: 'C', growth: 'I', pmgmt: 'A' },
  pm: { platform: 'A', game: 'A', economy: 'A', growth: 'A', pmgmt: 'R' },
  fullstack: { platform: 'R', game: 'R', economy: 'R', growth: 'C', pmgmt: 'C' },
  frontend: { platform: 'C', game: 'R', economy: 'C', growth: 'R', pmgmt: 'C' },
  design: { platform: 'I', game: 'R', economy: 'C', growth: 'C', pmgmt: 'I' },
  qa: { platform: 'R', game: 'C', economy: 'R', growth: 'C', pmgmt: 'I' },
};

export const RACI_LEGEND: Record<Raci, string> = {
  R: 'Исполняет',
  A: 'Отвечает за результат',
  C: 'Консультирует',
  I: 'Информируется',
};

export type StakeholderStrategy = 'manage' | 'satisfy' | 'inform' | 'monitor';

export interface Stakeholder {
  id: string;
  title: string;
  /** Влияние 1–5. */
  power: number;
  /** Заинтересованность 1–5. */
  interest: number;
  need: string;
}

export const STAKEHOLDERS: readonly Stakeholder[] = [
  { id: 'sponsor', title: 'Основатель / спонсор', power: 5, interest: 5, need: 'Сроки, бюджет, решения по границам проекта' },
  { id: 'investors', title: 'Инвесторы раунда Seed', power: 4.5, interest: 3.5, need: 'Метрики роста и кейс к вехе M5' },
  { id: 'telegram', title: 'Telegram — платформа Mini Apps и Stars', power: 4.5, interest: 1.5, need: 'Соблюдение правил платформы и платежей' },
  { id: 'team', title: 'Команда проекта', power: 3, interest: 5, need: 'Понятные приоритеты, реалистичный план' },
  { id: 'players', title: 'Игроки и бета-тестеры', power: 2, interest: 4.5, need: 'Стабильная игра, обратная связь учитывается' },
  { id: 'itpark', title: 'IT Park и регуляторы', power: 3, interest: 1.5, need: 'Соответствие требованиям резидентства и закона' },
  { id: 'community', title: 'Футбольное сообщество и медиа', power: 2, interest: 2.5, need: 'Новости о запуске и турнирах' },
] as const;

/** Квадрант сетки «влияние / заинтересованность» (порог 3). */
export function stakeholderStrategy(s: Stakeholder): StakeholderStrategy {
  const high = (v: number) => v > 3;
  if (high(s.power) && high(s.interest)) return 'manage';
  if (high(s.power)) return 'satisfy';
  if (high(s.interest)) return 'inform';
  return 'monitor';
}

export const STRATEGY_LABEL: Record<StakeholderStrategy, string> = {
  manage: 'Управлять плотно',
  satisfy: 'Удовлетворять',
  inform: 'Информировать',
  monitor: 'Наблюдать',
};

export const COMMUNICATIONS = [
  { event: 'Daily Scrum', cadence: 'ежедневно, 15 мин', audience: 'Команда' },
  { event: 'Планирование спринта', cadence: 'раз в 2 недели', audience: 'Команда, руководитель проекта' },
  { event: 'Обзор спринта (демо)', cadence: 'раз в 2 недели', audience: 'Команда, спонсор, бета-тестеры' },
  { event: 'Ретроспектива', cadence: 'раз в 2 недели', audience: 'Команда' },
  { event: 'Отчёт спонсору: вехи, SPI/CPI, риски', cadence: 'ежемесячно', audience: 'Спонсор' },
  { event: 'Новости для игроков', cadence: 'еженедельно, с закрытой беты', audience: 'Игроки, сообщество' },
] as const;

/* ------------------------------------------------------------------
   Бюджет проекта (план, $)
   ------------------------------------------------------------------ */
export interface BudgetLine {
  id: 'team' | 'infra' | 'marketing';
  label: string;
  note: string;
  /** Затраты по месяцам 1–6, $. */
  monthly: readonly number[];
}

/** Команда: $5 000 в месяц из бэклога; разбивка по ролям — плановое допущение. */
export const TEAM_RATES = [
  { role: 'fullstack' as RoleId, title: 'Fullstack-инженер', monthly: 1900 },
  { role: 'frontend' as RoleId, title: 'Frontend / Telegram-инженер', monthly: 1700 },
  { role: 'design' as RoleId, title: 'UI/UX-дизайнер, 0,5 ставки', monthly: 700 },
  { role: 'qa' as RoleId, title: 'QA-инженер, 0,5 ставки', monthly: 700 },
] as const;

const TEAM_MONTHLY = TEAM_RATES.reduce((s, r) => s + r.monthly, 0);

export const BUDGET_LINES: readonly BudgetLine[] = [
  {
    id: 'team',
    label: 'Команда',
    note: '2 инженера и 2 специалиста на полставки',
    monthly: Array.from({ length: PROJECT.durationMonths }, () => TEAM_MONTHLY),
  },
  {
    id: 'infra',
    label: 'Инфраструктура и сервисы',
    note: 'Серверы, PostgreSQL и Redis, мониторинг, домены',
    monthly: Array.from({ length: PROJECT.durationMonths }, () => 150),
  },
  {
    id: 'marketing',
    label: 'Маркетинг беты и запуска',
    note: 'Приглашения в бету, запуск в Узбекистане, турниры',
    monthly: [0, 0, 500, 1200, 650, 650],
  },
] as const;

/** Управленческий резерв на риски, доля базового плана затрат. */
export const RESERVE_RATE = 0.1;

const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0);

export const budgetLineTotals = BUDGET_LINES.map((l) => ({ ...l, total: sum(l.monthly) }));

/** Базовый план затрат (без резерва) по месяцам, $. */
export const BASELINE_MONTHLY = Array.from({ length: PROJECT.durationMonths }, (_, m) =>
  sum(BUDGET_LINES.map((l) => l.monthly[m])),
);

/** Накопленная плановая стоимость (PV) по месяцам, $ — S-кривая. */
export const PV_CUMULATIVE = BASELINE_MONTHLY.reduce<number[]>((acc, v, i) => {
  acc.push((acc[i - 1] ?? 0) + v);
  return acc;
}, []);

export const BUDGET = {
  baseline: sum(BASELINE_MONTHLY),
  reserve: Math.round(sum(BASELINE_MONTHLY) * RESERVE_RATE),
  get total() {
    return this.baseline + this.reserve;
  },
  teamMonthly: TEAM_MONTHLY,
};

export function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('ru-RU')}`;
}

/* ------------------------------------------------------------------
   Риски (экспертная оценка проекта)
   ------------------------------------------------------------------ */
export type RiskStrategy = 'avoid' | 'mitigate' | 'transfer' | 'accept';

export interface Risk {
  id: string;
  title: string;
  /** Вероятность 1–5. */
  probability: number;
  /** Влияние 1–5. */
  impact: number;
  strategy: RiskStrategy;
  response: string;
  owner: RoleId;
  /** Риск назван в бэклоге BX-016. */
  fromBacklog: boolean;
}

export const RISKS: readonly Risk[] = [
  { id: 'R1', title: 'Расползание содержания', probability: 4, impact: 4, strategy: 'avoid', response: 'Границы MVP закреплены в уставе; всё спорное — в бэклог следующего этапа; изменения — только через спонсора', owner: 'pm', fromBacklog: true },
  { id: 'R2', title: 'Ограничения платежей Telegram Stars/TON в регионе', probability: 3, impact: 5, strategy: 'mitigate', response: 'Заранее подготовить запасной способ оплаты; проверить платежи в спринте 5', owner: 'fullstack', fromBacklog: true },
  { id: 'R3', title: 'Дисбаланс игровой экономики', probability: 3, impact: 4, strategy: 'mitigate', response: 'Настройка по данным беты без релиза (live-ops), спринт 9', owner: 'pm', fromBacklog: true },
  { id: 'R4', title: 'Уход ключевого инженера', probability: 2, impact: 5, strategy: 'mitigate', response: 'Код-ревью, документация движка, общие знания в команде; резерв на замену', owner: 'sponsor', fromBacklog: false },
  { id: 'R5', title: 'Недооценка трудоёмкости', probability: 3, impact: 3, strategy: 'accept', response: 'Калибровка оценок после спринта 1, буфер ёмкости и резерв 10%', owner: 'pm', fromBacklog: true },
  { id: 'R6', title: 'Медленная работа на слабых Android', probability: 3, impact: 3, strategy: 'mitigate', response: 'Лёгкий бандл, ленивая загрузка, цель — интерактивность < 2,5 с (спринты 8 и 11)', owner: 'frontend', fromBacklog: true },
  { id: 'R7', title: 'Пиковая нагрузка на матч-движок', probability: 2, impact: 4, strategy: 'mitigate', response: 'Очереди и воркеры для матчей (спринт 11), мониторинг доступности', owner: 'fullstack', fromBacklog: true },
] as const;

export const STRATEGY_TITLE: Record<RiskStrategy, string> = {
  avoid: 'Избежать',
  mitigate: 'Снизить',
  transfer: 'Передать',
  accept: 'Принять',
};

export const riskScore = (r: Risk) => r.probability * r.impact;

export type RiskLevel = 'high' | 'medium' | 'low';

/** Уровень риска по произведению вероятности и влияния (шкала 1–25). */
export function riskLevel(score: number): RiskLevel {
  if (score >= 15) return 'high';
  if (score >= 8) return 'medium';
  return 'low';
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

/* ------------------------------------------------------------------
   Мониторинг и контроль (целевые значения)
   ------------------------------------------------------------------ */
export const CONTROL_PILLARS = [
  {
    id: 'schedule',
    title: 'Сроки',
    metric: 'SPI ≥ 0,95',
    instruments: [
      'Индекс выполнения сроков SPI = EV / PV не ниже 0,95',
      'Вехи M1–M5 — сдвиг не более одного спринта',
      'Скорость команды 16–18 ид за спринт, диаграмма сгорания',
    ],
  },
  {
    id: 'cost',
    title: 'Бюджет',
    metric: 'CPI ≥ 0,95',
    instruments: [
      'Индекс выполнения бюджета CPI = EV / AC не ниже 0,95',
      'Отклонение от базового плана затрат — не более 10%',
      'Резерв 10% расходуется только с одобрения спонсора',
    ],
  },
  {
    id: 'quality',
    title: 'Качество',
    metric: '≥ 99,5% без сбоев',
    instruments: [
      'Definition of Done для каждой задачи',
      'Тесты матч-движка и леджера проходят в CI',
      'Сессии без сбоев и доступность сервиса ≥ 99,5%',
    ],
  },
  {
    id: 'value',
    title: 'Ценность',
    metric: '15 000 MAU',
    instruments: [
      'Аудитория: 1 200 → 9 000 → 15 000 активных игроков в месяц',
      'Удержание D1 и D7 по данным беты',
      'Пять критериев приёмки из устава',
    ],
  },
] as const;
