import type { LucideIcon } from 'lucide-react';
import { ClipboardList, Compass, Gauge, GraduationCap, HeartHandshake, Rocket, ShieldCheck, UserPlus, Wallet } from 'lucide-react';

export type AmoId = 'A' | 'M' | 'O';

export interface HrProcess {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Какие факторы AMO усиливает практика (модель AMO, Armstrong & Taylor, 2023). */
  feeds: readonly AmoId[];
}

export const HR_PROCESSES: readonly HrProcess[] = [
  { id: 'plan', label: 'Планирование', icon: ClipboardList, feeds: ['O'] },
  { id: 'hire', label: 'Подбор', icon: UserPlus, feeds: ['A'] },
  { id: 'onboard', label: 'Адаптация', icon: Compass, feeds: ['A', 'O'] },
  { id: 'assess', label: 'Оценка', icon: Gauge, feeds: ['M'] },
  { id: 'develop', label: 'Развитие', icon: GraduationCap, feeds: ['A', 'M'] },
  { id: 'reward', label: 'Вознаграждение', icon: Wallet, feeds: ['M'] },
] as const;

export const AMO: readonly { id: AmoId; ru: string; en: string }[] = [
  { id: 'A', ru: 'Способности', en: 'Ability' },
  { id: 'M', ru: 'Мотивация', en: 'Motivation' },
  { id: 'O', ru: 'Возможности', en: 'Opportunity' },
] as const;

export const EFFECTIVENESS: readonly { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'quality', label: 'Качество продукта', icon: ShieldCheck },
  { id: 'speed', label: 'Скорость релизов', icon: Rocket },
  { id: 'engagement', label: 'Вовлечённость', icon: HeartHandshake },
] as const;

export const GROWTH_ITEMS = ['Аудитория игры', 'Выручка', 'Переход к этапам 2–3'] as const;

export const LOOP_LABEL = 'HR-аналитика и KPI';
export const AMO_NOTE = 'Модель AMO (Ability · Motivation · Opportunity) — по Armstrong & Taylor, 2023';

/* ---------------- Граф потоков ---------------- */

export type NodeKey = `hr:${string}` | `amo:${AmoId}` | `eff:${string}` | 'growth' | 'loop';

export interface Edge {
  id: string;
  from: NodeKey;
  to: NodeKey;
  kind: 'hr' | 'amo' | 'eff' | 'loop';
}

export const EDGES: readonly Edge[] = [
  ...HR_PROCESSES.flatMap((p) =>
    p.feeds.map((a): Edge => ({ id: `hr-${p.id}-${a}`, from: `hr:${p.id}`, to: `amo:${a}`, kind: 'hr' })),
  ),
  ...AMO.flatMap((a) =>
    EFFECTIVENESS.map((e): Edge => ({ id: `amo-${a.id}-${e.id}`, from: `amo:${a.id}`, to: `eff:${e.id}`, kind: 'amo' })),
  ),
  ...EFFECTIVENESS.map((e): Edge => ({ id: `eff-${e.id}`, from: `eff:${e.id}`, to: 'growth', kind: 'eff' })),
  { id: 'loop', from: 'growth', to: 'loop', kind: 'loop' },
];

/**
 * Рёбра, которые подсвечиваются при наведении на узел: прямые входящие рёбра
 * и вся цепочка вниз по потоку (до «Роста»). Для «Роста» и петли — обратная связь.
 */
export function highlightedEdges(node: NodeKey | null): Set<string> | null {
  if (!node) return null;
  const out = new Set<string>();
  if (node === 'loop') {
    out.add('loop');
    return out;
  }
  for (const e of EDGES) if (e.to === node && e.kind !== 'loop') out.add(e.id);
  const queue: NodeKey[] = [node];
  const seen = new Set<NodeKey>(queue);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of EDGES) {
      if (e.from !== cur) continue;
      if (e.kind === 'loop' && node !== 'growth') continue;
      out.add(e.id);
      if (!seen.has(e.to)) {
        seen.add(e.to);
        queue.push(e.to);
      }
    }
  }
  return out;
}

/** Узлы, которых касаются подсвеченные рёбра (для подсветки карточек). */
export function highlightedNodes(edges: Set<string> | null, node: NodeKey | null): Set<NodeKey> | null {
  if (!edges || !node) return null;
  const out = new Set<NodeKey>([node]);
  for (const e of EDGES) {
    if (!edges.has(e.id)) continue;
    out.add(e.from);
    out.add(e.to);
  }
  if (edges.has('loop')) {
    out.add('growth');
    for (const p of HR_PROCESSES) out.add(`hr:${p.id}`);
  }
  return out;
}
