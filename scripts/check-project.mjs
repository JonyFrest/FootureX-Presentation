// Согласованность данных проекта (src/data/project.ts): WBS, ёмкость, бюджет, RACI, риски, вехи.
// Запуск: node scripts/check-project.mjs (из корня проекта). TypeScript грузится через Vite.
import { createServer } from 'vite';
import assert from 'node:assert/strict';

const server = await createServer({
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
});

let failures = 0;
const check = (label, fn) => {
  try {
    fn();
    console.log(`  ok   ${label}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${label}\n       ${e.message.split('\n')[0]}`);
  }
};
const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const r1 = (n) => Math.round(n * 10) / 10;

try {
  const P = await server.ssrLoadModule('/src/data/project.ts');

  console.log('WBS и ёмкость');
  check('сумма пакетов = WBS_TOTAL', () => assert.equal(sum(P.WORK_PACKAGES.map((p) => p.estimate)), P.WBS_TOTAL));
  check('сумма результатов = WBS_TOTAL', () => assert.equal(sum(P.deliverableStats.map((d) => d.estimate)), P.WBS_TOTAL));
  check('у каждого пакета есть результат', () =>
    P.WORK_PACKAGES.forEach((p) => assert.ok(P.DELIVERABLES.some((d) => d.id === p.deliverable), p.id)));
  check('спринты пакетов в пределах 1…12', () =>
    P.WORK_PACKAGES.forEach((p) => p.sprints.forEach((s) => assert.ok(s >= 1 && s <= P.PROJECT.sprints, p.id))));
  check('оценка не превышает минимальную ёмкость', () => assert.ok(P.WBS_TOTAL <= P.CAPACITY.min));
  check('буфер = ёмкость − оценка', () => assert.equal(P.BUFFER.min, P.CAPACITY.min - P.WBS_TOTAL));
  check('задел лиг помещается в буфер', () => assert.ok(P.OPTIONAL_PACKAGE.estimate <= P.BUFFER.min));
  const shares = P.deliverableStats.map((d) => r1(d.share));
  console.log(`  доли результатов: ${shares.join(' + ')} = ${r1(sum(shares))}%`);
  check('доли результатов дают 100%', () => assert.equal(r1(sum(shares)), 100));

  console.log('Вехи');
  check('вехи идут по возрастанию спринтов', () =>
    P.MILESTONES.forEach((m, i) => i && assert.ok(m.sprint > P.MILESTONES[i - 1].sprint, m.id)));
  check('последняя веха — последний спринт', () => assert.equal(P.MILESTONES.at(-1).sprint, P.PROJECT.sprints));
  check('месяц вехи = спринт / 2', () => P.MILESTONES.forEach((m) => assert.equal(m.month, m.sprint / 2, m.id)));

  console.log('Бюджет');
  const lines = P.budgetLineTotals.map((l) => l.total);
  console.log(`  статьи: ${lines.join(' + ')} = ${sum(lines)}; резерв ${P.BUDGET.reserve}; итого ${P.BUDGET.total}`);
  check('команда = бюджет из бэклога × месяцы', () =>
    assert.equal(P.budgetLineTotals.find((l) => l.id === 'team').total, P.PROJECT.teamBudgetMonthlyUsd * P.PROJECT.durationMonths));
  check('ставки ролей = бюджет команды в месяц', () => assert.equal(sum(P.TEAM_RATES.map((r) => r.monthly)), P.PROJECT.teamBudgetMonthlyUsd));
  check('статьи = базовый план', () => assert.equal(sum(lines), P.BUDGET.baseline));
  check('месяцы = базовый план', () => assert.equal(sum(P.BASELINE_MONTHLY), P.BUDGET.baseline));
  check('S-кривая заканчивается базовым планом', () => assert.equal(P.PV_CUMULATIVE.at(-1), P.BUDGET.baseline));
  check('резерв = 10% базового плана', () => assert.equal(P.BUDGET.reserve, Math.round(P.BUDGET.baseline * P.RESERVE_RATE)));
  check('итог = базовый план + резерв', () => assert.equal(P.BUDGET.total, P.BUDGET.baseline + P.BUDGET.reserve));

  console.log('RACI, стейкхолдеры, риски');
  for (const c of P.RACI_COLUMNS) {
    check(`«${c.title}»: ровно один A`, () => assert.equal(Object.values(P.RACI).filter((r) => r[c.id] === 'A').length, 1));
  }
  check('у каждой роли заполнены все столбцы', () =>
    P.ROLES.forEach((r) => P.RACI_COLUMNS.forEach((c) => assert.ok(P.RACI[r.id][c.id], `${r.id}/${c.id}`))));
  check('оценки рисков в шкале 1…5', () =>
    P.RISKS.forEach((r) => assert.ok(r.probability >= 1 && r.probability <= 5 && r.impact >= 1 && r.impact <= 5, r.id)));
  check('владельцы рисков — роли проекта', () => P.RISKS.forEach((r) => assert.ok(P.ROLES.some((x) => x.id === r.owner), r.id)));
  check('стейкхолдеры в шкале 1…5', () =>
    P.STAKEHOLDERS.forEach((s) => assert.ok(s.power >= 1 && s.power <= 5 && s.interest >= 1 && s.interest <= 5, s.id)));
} finally {
  await server.close();
}

console.log(failures ? `\nПРОВАЛЕНО ПРОВЕРОК: ${failures}` : '\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ');
process.exit(failures ? 1 : 0);
