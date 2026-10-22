/**
 * План адаптации новичка FootureX: 90 дней = испытательный срок (до 3 месяцев по ТК РУз).
 * Содержание сцены 12 — план, а не фактические данные.
 */
export interface OnboardingPhase {
  id: 'enter' | 'integrate' | 'result';
  title: string;
  /** Латинская подпись в стиле FootureX. */
  latin: string;
  from: number;
  to: number;
  employee: readonly string[];
  hr: readonly string[];
}

export const TOTAL_DAYS = 90;

export const PHASES: readonly OnboardingPhase[] = [
  {
    id: 'enter',
    title: 'Вход',
    latin: 'Enter',
    from: 1,
    to: 30,
    employee: [
      'Доступы и рабочее место',
      'Знакомство с продуктом и командой',
      'Первая задача в продакшене или первая кампания',
    ],
    hr: [
      'Welcome-день и наставник-бадди',
      'Оформление по ТК РУз: трудовой договор, приказ',
      'Встречи-чек-ины в конце 1-й и 4-й недели',
    ],
  },
  {
    id: 'integrate',
    title: 'Интеграция',
    latin: 'Integrate',
    from: 31,
    to: 60,
    employee: ['Самостоятельные задачи в спринтах', 'Цели испытательного срока согласованы'],
    hr: ['Pulse-опрос адаптации', 'Встреча 1:1 с руководителем', 'Промежуточная оценка'],
  },
  {
    id: 'result',
    title: 'Результат',
    latin: 'Deliver',
    from: 61,
    to: 90,
    employee: ['Цели испытательного срока достигнуты', 'Вклад в релиз', 'Индивидуальный план развития'],
    hr: [
      'Итоговая оценка и решение по испытательному сроку (до 3 месяцев по ТК РУз)',
      'Опрос удовлетворённости новичка',
    ],
  },
] as const;

/** Вехи на шкале дней. */
export const MILESTONES = [
  { day: 0, label: 'Первый день' },
  { day: 30, label: 'Чек-ин 4-й недели' },
  { day: 60, label: 'Промежуточная оценка' },
  { day: 90, label: 'Решение по испытательному сроку' },
] as const;
