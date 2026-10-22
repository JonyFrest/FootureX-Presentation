/**
 * Оргструктура этапа 1, построенная из src/data/hr.ts (единый источник данных).
 * Руководитель направления показывается в карточке направления и не дублируется
 * в списке сотрудников.
 */
import type { ComponentType, SVGProps } from 'react';
import { CodeXml, Compass, Megaphone, PenTool, Users, Wallet } from 'lucide-react';
import { departmentStats, HEADCOUNT, type DepartmentId } from '@/data/hr';

export interface OrgMember {
  id: string;
  title: string;
  count: number;
}

export interface OrgUnit {
  id: DepartmentId;
  name: string;
  short: string;
  head: string;
  headcount: number;
  responsibilities: readonly string[];
  /** Сотрудники направления без руководителя. */
  members: OrgMember[];
}

type DeptStat = (typeof departmentStats)[number];

function toUnit(d: DeptStat): OrgUnit {
  let headTaken = false;
  const members = d.positions
    .map((p) => {
      if (!headTaken && p.title === d.head) {
        headTaken = true;
        return { id: p.id, title: p.title, count: p.count - 1 };
      }
      return { id: p.id, title: p.title, count: p.count };
    })
    .filter((m) => m.count > 0);
  return {
    id: d.id,
    name: d.name,
    short: d.short,
    head: d.head,
    headcount: d.headcount,
    responsibilities: d.responsibilities,
    members,
  };
}

const root = departmentStats.find((d) => d.id === 'leadership');
if (!root) throw new Error('В hr.ts нет подразделения leadership');

export const ORG_ROOT: OrgUnit = toUnit(root);
export const ORG_UNITS: readonly OrgUnit[] = departmentStats.filter((d) => d.id !== 'leadership').map(toUnit);
export const ORG_TOTAL = HEADCOUNT;
export const ORG_ALL: readonly OrgUnit[] = [ORG_ROOT, ...ORG_UNITS];

export function findUnit(id: DepartmentId | null): OrgUnit {
  return ORG_ALL.find((u) => u.id === id) ?? ORG_ROOT;
}

type Icon = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

export const UNIT_ICONS: Record<DepartmentId, Icon> = {
  leadership: Compass,
  tech: CodeXml,
  product: PenTool,
  marketing: Megaphone,
  hr: Users,
  finance: Wallet,
};
