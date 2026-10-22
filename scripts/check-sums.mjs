// Проверка математической согласованности сцен 09–10 из src/data/hr.ts.
// Запуск: node scripts/check-sums.mjs   (из корня проекта)
// Модули TypeScript грузятся через Vite (ssrLoadModule) с тем же алиасом '@', что и в приложении.
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

try {
  const hr = await server.ssrLoadModule('/src/data/hr.ts');
  const m = await server.ssrLoadModule('/src/scenes/s10/budgetMath.ts');
  const { fmtNum } = await server.ssrLoadModule('/src/scenes/s08/shared.ts');
  const t = (n) => Math.round(n * 10); // десятые доли — целочисленная арифметика

  console.log('Сцена 09 — штатное расписание');
  const headcount = hr.POSITIONS.reduce((s, p) => s + p.count, 0);
  const fund = hr.POSITIONS.reduce((s, p) => s + hr.positionMonthly(p), 0);
  const byDept = hr.departmentStats.reduce((s, d) => s + d.monthly, 0);
  console.log(`  ${hr.POSITIONS.length} строк, ${headcount} сотрудников, окладный фонд ${fmtNum(fund)} млн сум/мес`);
  check('HEADCOUNT = сумма количеств по строкам', () => assert.equal(hr.HEADCOUNT, headcount));
  check('сумма фондов подразделений = окладный фонд', () => assert.equal(t(byDept), t(fund)));
  check('окладный фонд = статья «Оклады» сцены 10', () =>
    assert.equal(t(fund), t(hr.BUDGET_LINES.find((l) => l.id === 'salaries').monthly)));

  for (const mode of ['monthly', 'annual']) {
    const lines = m.displayLines(mode);
    const total = m.displayTotal(mode);
    const sumLines = lines.reduce((s, l) => s + t(l.value), 0) / 10;
    const sumShares = lines.reduce((s, l) => s + t(l.share), 0) / 10;
    const extras = m.displayExtras(mode);
    const extraLine = lines.find((l) => l.id === 'extra');
    const sumExtras = extras.reduce((s, e) => s + t(e.value), 0) / 10;
    console.log(`\nСцена 10 — режим ${mode === 'monthly' ? 'Месяц' : 'Год'}`);
    console.log(
      `  ${lines.map((l) => fmtNum(l.value)).join(' + ')} = ${fmtNum(sumLines)}; итог в центре ${fmtNum(total)}` +
        (mode === 'annual' ? ` (${hr.formatBln(hr.BUDGET_TOTAL.annual)})` : ''),
    );
    console.log(`  доли: ${lines.map((l) => fmtNum(l.share) + '%').join(' + ')} = ${fmtNum(sumShares)}%`);
    console.log(`  состав доп. расходов: ${extras.map((e) => fmtNum(e.value)).join(' + ')} = ${fmtNum(sumExtras)} (статья ${fmtNum(extraLine.value)})`);
    check(`сумма статей = итог (${mode})`, () => assert.equal(t(sumLines), t(total)));
    check(`итог = BUDGET_TOTAL.${mode}, округлённый`, () => assert.equal(t(total), t(hr.BUDGET_TOTAL[mode])));
    check(`доли = 100,0% (${mode})`, () => assert.equal(t(sumShares), 1000));
    check(`состав доп. расходов = статья (${mode})`, () => assert.equal(t(sumExtras), t(extraLine.value)));
    check(`статьи округлены обычным образом, без перераспределения (${mode})`, () =>
      assert.deepEqual(lines.map((l) => t(l.value)), hr.BUDGET_LINES.map((l) => t(l[mode]))));
  }

  // Ожидаемые значения из ТЗ — только пока hr.ts содержит исходные данные (оклады 249 млн/мес).
  const original = t(fund) === 2490;
  console.log(`\nКонтрольные значения из ТЗ${original ? '' : ' — пропущены: данные hr.ts изменились'}`);
  if (original) check('месяц: 249,0 + 24,9 + 32,9 + 21,5 = 328,3', () =>
    assert.deepEqual([...m.displayLines('monthly').map((l) => fmtNum(l.value)), fmtNum(m.displayTotal('monthly'))],
      ['249,0', '24,9', '32,9', '21,5', '328,3']));
  if (original) check('год: 2 988,0 + 298,8 + 394,4 + 258,0 = 3 939,2', () =>
    assert.deepEqual(
      [...m.displayLines('annual').map((l) => fmtNum(l.value)), fmtNum(m.displayTotal('annual'))].map((s) => s.replace(/ /g, ' ')),
      ['2 988,0', '298,8', '394,4', '258,0', '3 939,2']));
  if (original) check('formatBln(годовой итог) = «3,94 млрд сум»', () => assert.equal(hr.formatBln(hr.BUDGET_TOTAL.annual), '3,94 млрд сум'));

  // Самопроверка корректировки округления на синтетических данных.
  console.log('\nroundToTotal — корректировка самой крупной позиции');
  check('[33,333; 33,333; 33,334] → сумма 100,0', () => {
    const r = m.roundToTotal([100 / 3, 100 / 3, 100 / 3], 100, 1);
    assert.equal(r.reduce((s, v) => s + t(v), 0), 1000);
  });
  check('[10,04; 20,04; 69,92] → сумма 100,0', () => {
    const r = m.roundToTotal([10.04, 20.04, 69.92], 100, 1);
    assert.equal(r.reduce((s, v) => s + t(v), 0), 1000);
  });
} finally {
  await server.close();
}

console.log(failures === 0 ? '\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ' : `\nОШИБОК: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
