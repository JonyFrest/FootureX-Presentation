import { HeartHandshake, Target, Timer, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import { KPI_GROUPS, TIME_TO_HIRE_DAYS, type KpiGroup, type KpiMetric } from '@/data/hr';

/**
 * Разбор строк целевых значений KPI из hr.ts.
 * Индикатор-кольцо рисуется только для долей в процентах («≥ 85%», «≤ 12%», «100%»):
 * кольцо заполнено до уровня цели. Для дней, MAU, eNPS и темпа роста («+10% / мес»)
 * кольцо было бы вводящим в заблуждение — показываем само число цели.
 */
export interface ParsedTarget {
  kind: 'share' | 'number';
  /** «≥», «≤» или пусто. */
  cmp: string;
  /** Число для показа (ru-RU): «99,5», «15 000», «+30». */
  num: string;
  /** Единица после числа: «%», «дней», «MAU», «% / мес». */
  unit: string;
  /** Для долей — значение 0..100. */
  share: number;
  icon: LucideIcon;
}

const intFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export function parseTarget(metric: KpiMetric): ParsedTarget {
  const m = metric.target.match(/^(≥|≤)?\s*([+-]?[\d\s  ]+(?:,\d+)?)\s*(.*)$/);
  const cmp = m?.[1] ?? '';
  const rawNum = (m?.[2] ?? metric.target).trim();
  const unit = (m?.[3] ?? '').trim();
  const numeric = Number(rawNum.replace(/[\s  ]/g, '').replace(',', '.'));
  const num = !rawNum.includes(',') && Math.abs(numeric) >= 1000 ? intFormat.format(numeric) : rawNum;
  const kind: ParsedTarget['kind'] = unit === '%' && Number.isFinite(numeric) ? 'share' : 'number';
  let icon: LucideIcon = Target;
  if (/дн/.test(unit)) icon = Timer;
  else if (/MAU/.test(unit)) icon = Users;
  else if (/мес/.test(unit)) icon = TrendingUp;
  else if (/eNPS/.test(metric.label)) icon = HeartHandshake;
  return { kind, cmp, num, unit, share: kind === 'share' ? numeric : 0, icon };
}

function findMetric(group: KpiGroup['id'], test: (m: KpiMetric) => boolean): KpiMetric {
  const g = KPI_GROUPS.find((x) => x.id === group);
  const found = g?.metrics.find(test);
  if (!found) throw new Error(`KPI не найден в группе ${group}`);
  return found;
}

/** Ключевые цели для верхней «консоли» — те же строки из KPI_GROUPS. */
export const HEADLINE = [
  {
    key: 'tth',
    latin: 'Time to hire',
    label: 'Срок закрытия вакансии',
    metric: findMetric('hr', (m) => m.target.includes(String(TIME_TO_HIRE_DAYS))),
  },
  {
    key: 'offer',
    latin: 'Offer accept',
    label: 'Принятие офферов',
    metric: findMetric('hr', (m) => /оффер/i.test(m.label)),
  },
  {
    key: 'turnover',
    latin: 'Turnover',
    label: 'Годовая текучесть',
    metric: findMetric('hr', (m) => /текучесть/i.test(m.label)),
  },
  {
    key: 'enps',
    latin: 'eNPS',
    label: 'Индекс вовлечённости',
    metric: findMetric('leaders', (m) => /eNPS/.test(m.label)),
  },
] as const;
