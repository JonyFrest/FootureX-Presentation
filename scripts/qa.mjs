// Автоматическая проверка вёрстки сцен: наложение текста, выход за кадр, наезд на панели,
// горизонтальная прокрутка, мелкий шрифт, ошибки консоли.
// node scripts/qa.mjs --scenes all --sizes 1920x1080,1600x900,1366x768,390x844,844x390
import { mkdirSync, writeFileSync } from 'node:fs';
import { launch, openScene, parseArgs, parseScenes, parseSizes } from './browser.mjs';

const args = parseArgs(process.argv.slice(2));
const base = args.url ?? 'http://localhost:5173/';
const scenes = parseScenes(args.scenes);
const sizes = parseSizes(args.sizes ?? '1920x1080,1600x900,1366x768,390x844,844x390');
const out = args.out ?? 'qa-output';
mkdirSync(out, { recursive: true });

function inspect() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const compact = window.matchMedia('(max-width: 860px), (max-height: 560px)').matches;
  const issues = [];
  const layer = document.querySelector('[data-current="true"]');
  const frame = layer?.querySelector('[data-scene-frame]');
  if (!layer || !frame) return { issues: [{ type: 'no-scene', text: 'нет текущей сцены' }] };

  if (document.documentElement.scrollWidth > vw + 1) issues.push({ type: 'page-hscroll', text: `scrollWidth ${document.documentElement.scrollWidth}` });
  if (frame.scrollWidth > frame.clientWidth + 1) issues.push({ type: 'frame-hscroll', text: `frame ${frame.scrollWidth}>${frame.clientWidth}` });
  if (!compact && frame.scrollHeight > frame.clientHeight + 2)
    issues.push({ type: 'frame-vscroll', text: `контент выше кадра: ${frame.scrollHeight}>${frame.clientHeight}` });

  const opacityOf = (el) => {
    let o = 1;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || cs.display === 'none') return 0;
      o *= Number(cs.opacity);
    }
    return o;
  };

  const chrome = [
    ...document.querySelectorAll('nav[aria-label="Навигация по сценам"] > div, header button, header [role="img"]'),
  ]
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0);

  const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
  const items = [];
  const tiny = new Set();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const el = node.parentElement;
    if (!el || opacityOf(el) < 0.15) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 11 && !tiny.has(el)) {
      tiny.add(el);
      issues.push({ type: 'tiny-font', text: `${fs}px: «${text.slice(0, 40)}»` });
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.width < 2 || r.height < 2) continue;
      items.push({ r, text, el });
    }
    // Обрезка текста контейнером с overflow: hidden.
    const cs = getComputedStyle(el);
    if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip') && el.scrollWidth > el.clientWidth + 1 && cs.textOverflow !== 'ellipsis')
      issues.push({ type: 'clipped', text: `«${text.slice(0, 40)}»` });
  }

  for (const { r, text } of items) {
    if (!compact && (r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1))
      issues.push({ type: 'offscreen', text: `«${text.slice(0, 40)}» ${Math.round(r.left)},${Math.round(r.top)}` });
    if (!compact) {
      for (const c of chrome) {
        const ix = Math.min(r.right, c.right) - Math.max(r.left, c.left);
        const iy = Math.min(r.bottom, c.bottom) - Math.max(r.top, c.top);
        if (ix > 2 && iy > 2) {
          issues.push({ type: 'under-chrome', text: `«${text.slice(0, 40)}» под панелью навигации` });
          break;
        }
      }
    }
  }

  // Телефон: в конце прокрутки последний текст не должен уходить под нижнюю навигацию.
  if (compact && frame.scrollHeight > frame.clientHeight + 2) {
    const prevTop = frame.scrollTop;
    frame.scrollTop = frame.scrollHeight;
    const navTop = document.querySelector('nav[aria-label="Навигация по сценам"] > div')?.getBoundingClientRect().top ?? vh;
    let maxBottom = 0;
    const w2 = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
    for (let node = w2.nextNode(); node; node = w2.nextNode()) {
      if (!node.textContent.trim() || !node.parentElement || opacityOf(node.parentElement) < 0.15) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) if (r.height > 2) maxBottom = Math.max(maxBottom, r.bottom);
    }
    if (maxBottom > navTop - 4) issues.push({ type: 'scroll-end-under-nav', text: `низ текста ${Math.round(maxBottom)} > верх навигации ${Math.round(navTop)}` });
    frame.scrollTop = prevTop;
  }

  // Наложение текстов друг на друга.
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (ix <= 1 || iy <= 1) continue;
      const area = ix * iy;
      const minArea = Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
      if (area / minArea > 0.2) issues.push({ type: 'text-overlap', text: `«${a.text.slice(0, 30)}» × «${b.text.slice(0, 30)}»` });
    }
  }
  return { issues };
}

const browser = await launch();
const report = [];
let total = 0;
for (const size of sizes) {
  const mobile = size.w < 800;
  const context = await browser.newContext({ viewport: { width: size.w, height: size.h }, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  for (const n of scenes) {
    errors.length = 0;
    await openScene(page, base, n, Number(args.wait ?? 2600));
    const { issues } = await page.evaluate(inspect);
    for (const e of errors) issues.push({ type: 'console-error', text: e.slice(0, 160) });
    const unique = [...new Map(issues.map((i) => [i.type + i.text, i])).values()];
    total += unique.length;
    report.push({ scene: n, size: size.name, issues: unique });
    const label = `scene ${String(n).padStart(2, '0')} @ ${size.name}`;
    if (unique.length === 0) console.log(`OK    ${label}`);
    else {
      console.log(`ISSUE ${label}: ${unique.length}`);
      for (const i of unique.slice(0, 6)) console.log(`        [${i.type}] ${i.text}`);
    }
  }
  await context.close();
}
await browser.close();
writeFileSync(`${out}/qa-report.json`, JSON.stringify(report, null, 2));
console.log(`\nИтого замечаний: ${total}. Отчёт: ${out}/qa-report.json`);
process.exit(total ? 1 : 0);
