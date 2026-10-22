/**
 * Реестр рисков (сцена 13): ранжирование по p × i, размещение в матрице 5×5, пороги уровней.
 * Всё выводится из src/data/project.ts.
 */
import {
  RISKS,
  RISK_LEVEL_LABEL,
  ROLES,
  STRATEGY_TITLE,
  riskLevel,
  riskScore,
  type Risk,
  type RiskLevel,
  type RiskStrategy,
} from '@/data/project';

export const SCALE = [1, 2, 3, 4, 5] as const;

export interface RankedRisk extends Risk {
  rank: number;
  score: number;
  level: RiskLevel;
  levelLabel: string;
  strategyTitle: string;
  ownerTitle: string;
}

/** Реестр, отсортированный по баллу (при равенстве — по влиянию, затем по номеру). */
export const REGISTER: RankedRisk[] = [...RISKS]
  .sort((a, b) => riskScore(b) - riskScore(a) || b.impact - a.impact || a.id.localeCompare(b.id, 'en', { numeric: true }))
  .map((r, i) => {
    const score = riskScore(r);
    const level = riskLevel(score);
    return {
      ...r,
      rank: i + 1,
      score,
      level,
      levelLabel: RISK_LEVEL_LABEL[level],
      strategyTitle: STRATEGY_TITLE[r.strategy],
      ownerTitle: ROLES.find((role) => role.id === r.owner)?.title ?? r.owner,
    };
  });

export const RISK_BY_ID = new Map(REGISTER.map((r) => [r.id, r]));

/** Риски в ячейке матрицы (вероятность, влияние), по рангу. */
export const cellRisks = (p: number, i: number) => REGISTER.filter((r) => r.probability === p && r.impact === i);

/** Диапазоны баллов для уровней — из функции riskLevel на всех произведениях шкалы 1–5. */
export const LEVEL_RANGES = (() => {
  const products = [...new Set(SCALE.flatMap((p) => SCALE.map((i) => p * i)))].sort((a, b) => a - b);
  const levels: RiskLevel[] = ['high', 'medium', 'low'];
  return levels.map((level) => {
    const xs = products.filter((x) => riskLevel(x) === level);
    return { level, label: RISK_LEVEL_LABEL[level], min: Math.min(...xs), max: Math.max(...xs) };
  });
})();

export const rangeText = (r: (typeof LEVEL_RANGES)[number]) =>
  r.max === Math.max(...SCALE) ** 2 ? `≥ ${r.min}` : r.min === 1 ? `≤ ${r.max}` : `${r.min}–${r.max}`;

/** Сколько рисков на каждую стратегию реагирования (только встречающиеся). */
export const STRATEGY_COUNTS = (Object.keys(STRATEGY_TITLE) as RiskStrategy[])
  .map((s) => ({ id: s, title: STRATEGY_TITLE[s], count: RISKS.filter((r) => r.strategy === s).length }))
  .filter((s) => s.count > 0);

export const BACKLOG_COUNT = RISKS.filter((r) => r.fromBacklog).length;

/** Заливка ячейки матрицы по уровню: чем выше уровень, тем ярче синий. */
export const CELL_STYLE: Record<RiskLevel, { background: string; border: string }> = {
  high: {
    background: 'linear-gradient(135deg, rgba(37,147,250,0.5), rgba(37,80,250,0.62))',
    border: 'rgba(142,180,255,0.5)',
  },
  medium: {
    background: 'linear-gradient(135deg, rgba(37,147,250,0.2), rgba(37,80,250,0.26))',
    border: 'rgba(142,180,255,0.22)',
  },
  low: {
    background: 'rgba(142,180,255,0.045)',
    border: 'rgba(142,180,255,0.1)',
  },
};
