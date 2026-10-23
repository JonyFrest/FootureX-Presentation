// Проверка навигации, клавиатуры, блокировки повторов, меню, полноэкранного режима
// и синхронизации окна докладчика: node scripts/nav-test.mjs [--url http://localhost:5173/]
import { launch, parseArgs } from './browser.mjs';

const args = parseArgs(process.argv.slice(2));
const base = args.url ?? 'http://localhost:5173/';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const state = () => page.evaluate(() => window.__FX__.getState());
const index = async () => (await state()).index;
const waitIdle = () => page.waitForFunction(() => window.__FX__.getState().phase === 'idle' && window.__FX__.getState().ready, null, { timeout: 8000 });

await page.goto(base, { waitUntil: 'networkidle' });
await waitIdle();
check('Старт с первой сцены', (await index()) === 0);

await page.getByRole('button', { name: 'Следующая сцена' }).click();
await waitIdle();
check('Кнопка «Далее»', (await index()) === 1);

await page.getByRole('button', { name: 'Предыдущая сцена' }).click();
await waitIdle();
check('Кнопка «Назад»', (await index()) === 0);

await page.getByRole('button', { name: 'Следующая сцена' }).dblclick();
await waitIdle();
await page.waitForTimeout(300);
check('Двойной клик не пропускает сцены', (await index()) === 1, `index=${await index()}`);

await page.keyboard.press('ArrowRight');
await page.keyboard.press('ArrowRight');
await page.keyboard.press('ArrowRight');
await waitIdle();
check('Повторные нажатия во время перехода блокируются', (await index()) === 2, `index=${await index()}`);

await page.keyboard.press('ArrowLeft');
await waitIdle();
check('Стрелка влево', (await index()) === 1);

await page.mouse.click(5, 5); // снять фокус с кнопок
await page.keyboard.press('Space');
await waitIdle();
check('Пробел — далее', (await index()) === 2);

await page.keyboard.press('End');
await waitIdle();
check('End — последняя сцена', (await index()) === 14);
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(300);
check('За последней сценой ничего нет', (await index()) === 14);

await page.keyboard.press('Home');
await waitIdle();
check('Home — первая сцена', (await index()) === 0);

await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', repeat: true, bubbles: true })));
await page.waitForTimeout(300);
check('Удержание клавиши (repeat) не листает', (await index()) === 0);

// Клик по свободной области сцены.
await page.mouse.click(683, 470);
await waitIdle();
check('Клик по свободной области — далее', (await index()) === 1, `index=${await index()}`);

// Клик по интерактивному элементу сцены не листает.
const interactive = page.locator('[data-current="true"] button, [data-current="true"] [data-interactive]').first();
if ((await interactive.count()) > 0) {
  await interactive.click({ force: true });
  await page.waitForTimeout(500);
  check('Клик по интерактивному элементу не листает', (await index()) === 1, `index=${await index()}`);
} else check('Клик по интерактивному элементу не листает', false, 'на сцене 2 нет интерактивных элементов');

// Меню сцен.
await page.keyboard.press('m');
await page.waitForTimeout(400);
const dialog = page.getByRole('dialog', { name: 'Список сцен' });
check('M открывает список сцен', await dialog.isVisible());
await dialog.getByRole('button', { name: /Устав проекта/ }).click();
await waitIdle();
check('Переход из списка сцен', (await index()) === 7, `index=${await index()}`);
await page.waitForTimeout(600);
check('Список закрывается после выбора', !(await dialog.isVisible().catch(() => false)));
await page.keyboard.press('m');
await dialog.waitFor({ state: 'visible' });
await page.waitForTimeout(500);
await page.keyboard.press('Escape');
await page.waitForTimeout(900);
check('Esc закрывает список сцен', !(await state()).menuOpen && !(await dialog.isVisible().catch(() => false)));

// URL-хэш.
check('Номер сцены в адресе', page.url().endsWith('#/08'), page.url());

// Полноэкранный режим.
await page.getByRole('button', { name: /Полный экран/ }).click();
await page.waitForTimeout(500);
const fsOn = await page.evaluate(() => Boolean(document.fullscreenElement));
check('Кнопка полноэкранного режима включает его', fsOn);
await page.keyboard.press('f');
await page.waitForTimeout(500);
const fsOff = await page.evaluate(() => !document.fullscreenElement);
check('F выключает полноэкранный режим', fsOff);

// Окно докладчика: синхронизация через BroadcastChannel.
const speaker = await context.newPage();
await speaker.goto(new URL('?speaker=1', base).toString(), { waitUntil: 'networkidle' });
await speaker.waitForTimeout(1200);
const speakerTitle = await speaker.locator('h1').first().textContent();
check('Окно докладчика показывает текущую сцену', speakerTitle?.includes('Устав проекта'), speakerTitle ?? '');
check('Окно докладчика подключено', await speaker.getByText('Синхронизировано с презентацией').isVisible());
await speaker.getByRole('button', { name: 'Далее' }).click();
await page.waitForTimeout(200);
await waitIdle();
check('«Далее» в окне докладчика листает презентацию', (await index()) === 8, `index=${await index()}`);
await page.keyboard.press('ArrowRight');
await waitIdle();
await speaker.waitForTimeout(500);
const speakerTitle2 = await speaker.locator('h1').first().textContent();
check('Окно докладчика следует за презентацией', speakerTitle2?.includes('Иерархическая структура работ'), speakerTitle2 ?? '');
const notesOnMain = await page.evaluate(() => document.body.innerText.includes('Содержание проекта разложено в иерархическую структуру работ'));
check('Текст выступления не показывается на основном экране', !notesOnMain);

check('Нет ошибок в консоли', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} проверок пройдено`);
process.exit(failed ? 1 : 0);
