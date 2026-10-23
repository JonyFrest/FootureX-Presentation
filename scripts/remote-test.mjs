// Пульт на телефоне: презентация («ноутбук») и окно докладчика («телефон») открыты в разных
// контекстах браузера — BroadcastChannel между ними не работает, связь идёт только через /api/remote.
// Нужен сервер с ретранслятором: `npm run build && npm run preview` (или `npm run dev`).
// Запуск: node scripts/remote-test.mjs [--url http://localhost:4173/] [--shots qa-output/remote]
import { mkdirSync } from 'node:fs';
import { launch, parseArgs } from './browser.mjs';

const args = parseArgs(process.argv.slice(2));
const base = args.url ?? 'http://localhost:4173/';
const shots = args.shots ?? 'qa-output/remote';
mkdirSync(shots, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};
const attempt = async (fn) => {
  try {
    await fn();
    return true;
  } catch {
    return false;
  }
};

const browser = await launch();
const laptopCtx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const phoneCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const laptop = await laptopCtx.newPage();
const phone = await phoneCtx.newPage();
const errors = [];
for (const [name, page] of [['ноутбук', laptop], ['телефон', phone]]) {
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text()}`));
}

const index = () => laptop.evaluate(() => window.__FX__.getState().index);
const waitIdle = () =>
  laptop.waitForFunction(() => window.__FX__.getState().phase === 'idle' && window.__FX__.getState().ready, null, { timeout: 10000 });
const waitIndex = (i, timeout = 6000) => laptop.waitForFunction((n) => window.__FX__.getState().index === n, i, { timeout });
const phoneTitle = (text, page = phone, timeout = 6000) =>
  page.waitForFunction((t) => document.querySelector('h1')?.textContent?.includes(t), text, { timeout });

// --- Сервер ---
const health = await laptop.request.get(new URL('api/remote?health', base).toString());
const healthBody = await health.json().catch(() => ({}));
check('Ретранслятор /api/remote отвечает', health.ok() && healthBody.ok === true, JSON.stringify(healthBody));

// --- Ноутбук: окно «Пульт» ---
await laptop.goto(base, { waitUntil: 'networkidle' });
await waitIdle();
await laptop.keyboard.press('p');
const dialog = laptop.getByRole('dialog', { name: /Текст выступления и управление/ });
check('P открывает окно пульта', await attempt(() => dialog.waitFor({ timeout: 3000 })));
const gotCode = await attempt(() =>
  laptop.waitForFunction(() => /^\d{3} \d{3}$/.test(document.querySelector('[data-room-code]')?.textContent ?? ''), null, { timeout: 6000 }),
);
const code = gotCode ? (await laptop.locator('[data-room-code]').textContent()).replace(/\D/g, '') : '';
const qrLink = (await laptop.locator('svg[data-qr]').getAttribute('data-qr').catch(() => null)) ?? '';
check('Показан шестизначный код', /^\d{6}$/.test(code), code);
check('QR-код ведёт в окно докладчика с этим кодом', qrLink.endsWith(`?speaker=1&room=${code}`), qrLink);
check('Статус «Ждём телефон…»', await attempt(() => dialog.getByText('Ждём телефон…').waitFor({ timeout: 6000 })));
await laptop.screenshot({ path: `${shots}/laptop-remote-dialog.png` });

// --- Телефон открывает ссылку из QR ---
await phone.goto(qrLink, { waitUntil: 'networkidle' });
check('Телефон подключился к презентации', await attempt(() => phone.waitForSelector('[data-link="linked"]', { timeout: 8000 })));
check('Мобильная раскладка докладчика', (await phone.locator('[data-speaker-layout="phone"]').count()) === 1);
check('Телефон показывает текущую сцену', await attempt(() => phoneTitle('Управление проектами FootureX')));
check('Ноутбук видит телефон', await attempt(() => dialog.getByText(/Телефон подключён/).waitFor({ timeout: 6000 })));
check('Окно пульта само закрывается после подключения', await attempt(() => dialog.waitFor({ state: 'hidden', timeout: 5000 })));
check('Индикатор пульта в верхней панели', (await laptop.locator('[data-remote-dot]').count()) === 1);

// Раскладка телефона: без горизонтальной прокрутки, большие кнопки внизу экрана.
const layout = await phone.evaluate(() => {
  const next = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith('Далее'));
  const r = next?.getBoundingClientRect();
  return { overflow: document.documentElement.scrollWidth - window.innerWidth, h: r?.height ?? 0, bottom: r?.bottom ?? 0, vh: window.innerHeight };
});
check('Нет горизонтальной прокрутки (портрет)', layout.overflow <= 0, `${layout.overflow}px`);
check('Кнопка «Далее» крупная и у нижнего края', layout.h >= 56 && layout.bottom <= layout.vh && layout.bottom > layout.vh - 120, JSON.stringify(layout));
await phone.screenshot({ path: `${shots}/phone-portrait.png` });

// --- Управление с телефона ---
let t0 = Date.now();
await phone.getByRole('button', { name: 'Далее' }).tap();
check('«Далее» на телефоне листает презентацию', await attempt(() => waitIndex(1)), `${Date.now() - t0} мс`);
check('Телефон показывает новую сцену', await attempt(() => phoneTitle('Цель и задачи')));
await waitIdle();

t0 = Date.now();
await laptop.keyboard.press('ArrowRight');
check('Телефон следует за клавиатурой ноутбука', await attempt(() => phoneTitle('Актуальность проектного управления')), `${Date.now() - t0} мс`);
await waitIdle();
const elapsedText = await phone.locator('[data-speaker-elapsed]').textContent();
check('Таймер на телефоне запустился с первым переходом', !elapsedText.startsWith('00:00') || (await attempt(() =>
  phone.waitForFunction(() => !document.querySelector('[data-speaker-elapsed]')?.textContent?.startsWith('00:00'), null, { timeout: 2500 }),
)));

await phone.getByRole('button', { name: 'Сцены и подключение' }).tap();
const sheet = phone.getByRole('dialog', { name: 'Сцены и подключение' });
await sheet.waitFor();
await phone.waitForTimeout(350);
await phone.screenshot({ path: `${shots}/phone-sheet.png` });
await sheet.getByRole('button', { name: /Устав проекта/ }).tap();
check('Переход к сцене из списка на телефоне', await attempt(() => waitIndex(7)), `index=${await index()}`);
await waitIdle();
await phoneTitle('Устав проекта');

// Быстрое двойное касание не пропускает сцену (вторая команда приходит во время перехода).
await phone.evaluate(() => {
  const next = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith('Далее'));
  next?.click();
  next?.click();
});
await waitIndex(8).catch(() => {});
await phone.waitForTimeout(2500);
await waitIdle();
check('Двойное касание «Далее» не пропускает сцену', (await index()) === 8, `index=${await index()}`);

// --- Перезагрузка презентации не рвёт пульт ---
await laptop.reload({ waitUntil: 'networkidle' });
await waitIdle();
check('Пульт восстанавливается после перезагрузки', await attempt(() => laptop.waitForSelector('[data-remote-dot]', { timeout: 6000 })));
await phone.waitForTimeout(1500);
await phone.getByRole('button', { name: 'Назад' }).tap();
check('Команды телефона работают после перезагрузки', await attempt(() => waitIndex(7, 8000)), `index=${await index()}`);
await waitIdle();

// --- Альбомная ориентация телефона ---
await phone.setViewportSize({ width: 844, height: 390 });
await phone.waitForTimeout(400);
const land = await phone.evaluate(() => {
  const next = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith('Далее'));
  const r = next?.getBoundingClientRect();
  return {
    layout: document.querySelector('[data-speaker-layout]')?.getAttribute('data-speaker-layout'),
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    visible: Boolean(r && r.bottom <= window.innerHeight && r.right <= window.innerWidth && r.height >= 48),
  };
});
check('Альбомная раскладка телефона', land.layout === 'phone-landscape' && land.overflow <= 0 && land.visible, JSON.stringify(land));
await phone.screenshot({ path: `${shots}/phone-landscape.png` });
await phone.setViewportSize({ width: 390, height: 844 });

// --- Ввод кода вручную ---
const phone2 = await phoneCtx.newPage();
phone2.on('pageerror', (e) => errors.push(`телефон 2: ${e.message}`));
await phone2.goto(new URL('?speaker=1', base).toString(), { waitUntil: 'networkidle' });
const input = phone2.getByRole('textbox', { name: 'Код пульта из 6 цифр' });
check('Без кода телефон предлагает подключиться', await attempt(() => input.waitFor({ timeout: 4000 })));
await phone2.screenshot({ path: `${shots}/phone-connect.png` });
await input.fill(code);
await phone2.getByRole('button', { name: 'Подключить' }).tap();
check('Подключение по введённому коду', await attempt(() => phone2.waitForSelector('[data-link="linked"]', { timeout: 8000 })));
check('Код записан в адрес (перезагрузка не теряет связь)', phone2.url().includes(`room=${code}`), phone2.url());
await phone2.close();

// --- Отключение пульта на ноутбуке ---
await laptop.keyboard.press('p');
await dialog.waitFor();
await dialog.getByRole('button', { name: 'Отключить пульт' }).click();
await laptop.keyboard.press('Escape');
t0 = Date.now();
check(
  'Телефон замечает, что презентация отключилась',
  await attempt(() => phone.waitForSelector('[data-link="waiting"]', { timeout: 20000 })),
  `${Math.round((Date.now() - t0) / 1000)} с`,
);
check('Индикатор пульта погас', (await laptop.locator('[data-remote-dot]').count()) === 0);

// --- Хостинг без ретранслятора ---
const staticCtx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
await staticCtx.route('**/api/remote**', (route) => route.fulfill({ status: 404, body: 'Not found' }));
const staticPage = await staticCtx.newPage();
await staticPage.goto(base, { waitUntil: 'networkidle' });
// Ноутбук с презентацией ещё открыт и рендерит WebGL программно, поэтому ждём только монтирования.
await staticPage.waitForFunction(() => window.__FX__ !== undefined, null, { timeout: 20000 });
await staticPage.waitForTimeout(800);
await staticPage.keyboard.press('p');
check(
  'Без ретранслятора окно пульта объясняет, что делать',
  await attempt(() => staticPage.getByText('На этом хостинге нет сервера синхронизации', { exact: false }).waitFor({ timeout: 12000 })),
);
await staticCtx.close();

check('Нет ошибок в консоли', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} проверок пройдено`);
process.exit(failed ? 1 : 0);
