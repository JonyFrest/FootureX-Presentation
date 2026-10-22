// Скриншоты сцен: node scripts/screenshots.mjs --scenes 1-15 --sizes 1920x1080,1366x768,390x844
import { mkdirSync } from 'node:fs';
import { launch, openScene, parseArgs, parseScenes, parseSizes } from './browser.mjs';

const args = parseArgs(process.argv.slice(2));
const base = args.url ?? 'http://localhost:5173/';
const out = args.out ?? 'qa-output/shots';
const scenes = parseScenes(args.scenes);
const sizes = parseSizes(args.sizes);
const settle = Number(args.wait ?? 2200);
mkdirSync(out, { recursive: true });

const browser = await launch();
for (const size of sizes) {
  const mobile = size.w < 800;
  const context = await browser.newContext({
    viewport: { width: size.w, height: size.h },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: args.reduced ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  page.on('pageerror', (err) => console.error(`[pageerror] ${size.name}:`, err.message));
  for (const n of scenes) {
    await openScene(page, base, n, settle, args.clean ? { clean: '1' } : {});
    const ext = args.format === 'jpg' ? 'jpg' : 'png';
    const file = `${out}/scene-${String(n).padStart(2, '0')}-${size.name}.${ext}`;
    await page.screenshot({ path: file, fullPage: false, ...(ext === 'jpg' ? { type: 'jpeg', quality: 88 } : {}) });
    console.log('saved', file);
  }
  await context.close();
}
await browser.close();
