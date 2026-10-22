// Общий запуск Chromium для скриптов проверки (скриншоты, QA, навигация).
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

export async function launch() {
  const candidates = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium'].filter(Boolean);
  const executablePath = candidates.find((p) => existsSync(p));
  return chromium.launch({
    executablePath,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
  });
}

export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      out[key] = val;
    }
  }
  return out;
}

export function parseScenes(value) {
  if (!value || value === 'all') return Array.from({ length: 15 }, (_, i) => i + 1);
  return value.split(',').flatMap((part) => {
    const [a, b] = part.split('-').map(Number);
    return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a];
  });
}

export function parseSizes(value) {
  return (value ?? '1920x1080,1366x768,390x844').split(',').map((s) => {
    const [w, h] = s.split('x').map(Number);
    return { w, h, name: s };
  });
}

/** Открывает сцену N и ждёт, пока переход завершится (ready) и графики отыграют. */
export async function openScene(page, baseUrl, n, settleMs = 2200, extra = {}) {
  const url = new URL(baseUrl);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
  url.searchParams.set('scene', String(n));
  await page.goto(url.toString(), { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__FX__?.getState().ready === true, null, { timeout: 15000 });
  await page.waitForTimeout(settleMs);
}
