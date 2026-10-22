import type { LucideIcon } from 'lucide-react';
import { ListChecks, Target, Users, Wallet } from 'lucide-react';
import { MILESTONES, PROJECT, ROLES, WORK_PACKAGES, formatUsd } from '@/data/project';
import { EPIC_FORMS, WEEK_FORMS, ruPlural } from '../s04/ru';

/**
 * Гибридная методология FootureX MVP: каскад (stage-gate) на уровне этапа и вех,
 * Scrum — внутри исполнения. Все числа считаются из src/data/project.ts.
 */

const nb = (s: string) => s.replace(/ /g, ' ');
const fte = (n: number) => n.toLocaleString('ru-RU');

/** Команда в ставках: «2 + 2 × 0,5» (полные ставки + полставки). */
const FULL = ROLES.filter((r) => r.fte === 1).length;
const PART = ROLES.filter((r) => r.fte !== null && r.fte < 1);
const TEAM_LABEL = PART.length
  ? nb(`${FULL} + ${PART.length} × ${fte(PART[0].fte ?? 0)}`)
  : String(FULL);

export const SPRINT_WEEKS_LABEL = `${PROJECT.sprintWeeks} ${ruPlural(PROJECT.sprintWeeks, WEEK_FORMS)}`;
export const MILESTONE_RANGE = `${MILESTONES[0].id}–${MILESTONES[MILESTONES.length - 1].id}`;

export type ColumnId = 'in' | 'st' | 'sc' | 'out';
export type NodeKey = `${ColumnId}:${string}` | 'loop';

export interface FlowNode {
  id: string;
  label: string;
  /** Короткое пояснение под подписью. */
  sub?: string;
  icon?: LucideIcon;
}

export const INPUTS: readonly FlowNode[] = [
  { id: 'goal', label: 'Цель и устав', icon: Target },
  {
    id: 'backlog',
    label: `Бэклог: ${WORK_PACKAGES.length} ${ruPlural(WORK_PACKAGES.length, EPIC_FORMS)}`,
    icon: ListChecks,
  },
  { id: 'budget', label: `Бюджет команды ${nb(formatUsd(PROJECT.teamBudgetMonthlyUsd))}/мес`, icon: Wallet },
  { id: 'team', label: `Команда: ${TEAM_LABEL}`, icon: Users },
] as const;

/** Каскад этапа: устав → план → вехи (решение go / no-go на каждой вехе). */
export const CASCADE: readonly FlowNode[] = [
  { id: 'charter', label: 'Устав', sub: 'цель и границы MVP' },
  { id: 'plan', label: 'План', sub: 'WBS, график, бюджет' },
  { id: 'gates', label: `Вехи ${MILESTONE_RANGE}`, sub: 'решение go / no-go' },
] as const;

/** Scrum-цикл по часовой стрелке: ↖ планирование → ↗ разработка → ↘ обзор → ↙ ретроспектива. */
export const SCRUM: readonly FlowNode[] = [
  { id: 'planning', label: 'Планирование спринта' },
  { id: 'dev', label: 'Разработка и Daily Scrum' },
  { id: 'review', label: 'Обзор спринта' },
  { id: 'retro', label: 'Ретроспектива' },
] as const;

export const OUTPUTS: readonly FlowNode[] = [
  { id: 'increment', label: `Инкремент каждые ${SPRINT_WEEKS_LABEL}` },
  { id: 'launch', label: 'Закрытая бета и публичный запуск' },
  { id: 'seed', label: 'Кейс для Seed' },
] as const;

export const COLUMNS = [
  { id: 'in' as const, n: '01', en: 'Input', ru: 'Вход' },
  { id: 'st' as const, n: '02', en: 'Stage-gate', ru: 'Каскад этапа' },
  { id: 'sc' as const, n: '03', en: 'Scrum', ru: `Scrum-цикл · ${SPRINT_WEEKS_LABEL}` },
  { id: 'out' as const, n: '04', en: 'Output', ru: 'Результат' },
] as const;

export const SPRINTS = PROJECT.sprints;
export const SPRINTS_BADGE = `${PROJECT.sprints} спринтов подряд`;
export const LOOP_LABEL = 'Метрики беты (MAU, D1/D7) и ретроспективы → бэклог';
export const METHOD_NOTE = 'Гибридный подход: каскад на уровне этапов и вех, Scrum — внутри исполнения (PMBOK 7, Scrum Guide)';

/* ---------------- Граф потоков ---------------- */

export type EdgeKind =
  | 'in' // вход → каскад
  | 'gate' // внутри каскада (сверху вниз, через «ворота»)
  | 'feed' // план → планирование спринта
  | 'cycle' // Scrum-цикл
  | 'out' // обзор спринта → инкремент
  | 'chain' // внутри результата (сверху вниз)
  | 'milestone' // вехи → результаты (под Scrum-циклом)
  | 'loop'; // обратная связь → бэклог

export interface Edge {
  id: string;
  from: NodeKey;
  to: NodeKey;
  kind: EdgeKind;
}

const k = (col: ColumnId, id: string): NodeKey => `${col}:${id}`;

export const EDGES: readonly Edge[] = [
  { id: 'in-goal', from: k('in', 'goal'), to: k('st', 'charter'), kind: 'in' },
  { id: 'in-backlog', from: k('in', 'backlog'), to: k('st', 'plan'), kind: 'in' },
  { id: 'in-budget', from: k('in', 'budget'), to: k('st', 'plan'), kind: 'in' },
  { id: 'in-team', from: k('in', 'team'), to: k('st', 'plan'), kind: 'in' },
  { id: 'gate-1', from: k('st', 'charter'), to: k('st', 'plan'), kind: 'gate' },
  { id: 'gate-2', from: k('st', 'plan'), to: k('st', 'gates'), kind: 'gate' },
  { id: 'feed', from: k('st', 'plan'), to: k('sc', 'planning'), kind: 'feed' },
  { id: 'cy-1', from: k('sc', 'planning'), to: k('sc', 'dev'), kind: 'cycle' },
  { id: 'cy-2', from: k('sc', 'dev'), to: k('sc', 'review'), kind: 'cycle' },
  { id: 'cy-3', from: k('sc', 'review'), to: k('sc', 'retro'), kind: 'cycle' },
  { id: 'cy-4', from: k('sc', 'retro'), to: k('sc', 'planning'), kind: 'cycle' },
  { id: 'out', from: k('sc', 'review'), to: k('out', 'increment'), kind: 'out' },
  { id: 'chain-1', from: k('out', 'increment'), to: k('out', 'launch'), kind: 'chain' },
  { id: 'chain-2', from: k('out', 'launch'), to: k('out', 'seed'), kind: 'chain' },
  { id: 'ms-launch', from: k('st', 'gates'), to: k('out', 'launch'), kind: 'milestone' },
  { id: 'ms-seed', from: k('st', 'gates'), to: k('out', 'seed'), kind: 'milestone' },
  { id: 'loop', from: k('out', 'launch'), to: k('in', 'backlog'), kind: 'loop' },
];

/**
 * Рёбра, которые подсвечиваются при выборе узла: прямые входящие рёбра
 * и вся цепочка вниз по потоку. Петля обратной связи — только от её начала или от подписи петли.
 */
export function highlightedEdges(node: NodeKey | null): Set<string> | null {
  if (!node) return null;
  const out = new Set<string>();
  if (node === 'loop') {
    out.add('loop');
    return out;
  }
  const loopStart = EDGES.find((e) => e.kind === 'loop')?.from;
  for (const e of EDGES) if (e.to === node && e.kind !== 'loop') out.add(e.id);
  const queue: NodeKey[] = [node];
  const seen = new Set<NodeKey>(queue);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of EDGES) {
      if (e.from !== cur) continue;
      if (e.kind === 'loop' && node !== loopStart) continue;
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
  // Петля несёт и метрики беты, и выводы ретроспектив.
  if (edges.has('loop')) {
    out.add('loop');
    out.add(k('sc', 'retro'));
  }
  return out;
}
