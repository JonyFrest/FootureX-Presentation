// Замер плавности анимаций на эмулированном телефоне: проход по всем сценам production-сборки,
// статистика кадров (rAF), длинные задачи, draw calls / треугольники WebGL, загрузка процессов.
// node scripts/perf.mjs --url http://localhost:4180/ [--sizes 390x844,844x390] [--dpr 3] [--cpu 4]
//   [--scenes 1-15] [--idle 3000] [--query quality=low] [--desktop] [--css "селектор{…}"] [--out qa-output/perf.json]
// Важно: WebGL здесь программный (SwiftShader), поэтому абсолютные числа — не телефонные,
// сравнивать имеет смысл только «до/после» на одной машине одним и тем же скриптом.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { launch, parseArgs, parseScenes, parseSizes } from './browser.mjs';

const args = parseArgs(process.argv.slice(2));
const base = args.url ?? 'http://localhost:4173/';
const desktop = args.desktop === 'true';
const sizes = parseSizes(args.sizes ?? (desktop ? '1920x1080' : '390x844,844x390'));
const dpr = Number(args.dpr ?? (desktop ? 1 : 3));
const cpu = Number(args.cpu ?? (desktop ? 1 : 4));
const scenes = parseScenes(args.scenes);
const idleMs = Number(args.idle ?? 3000);
/** Пауза между остановкой перехода и замером покоя: графики и каскады успевают отыграть. */
const entryMs = Number(args.entry ?? 1500);
const out = args.out ?? 'qa-output/perf.json';

/** Счётчики в странице: кадры rAF, длинные задачи, вызовы отрисовки WebGL. */
function instrument() {
  const P = (window.__PERF__ = { frames: [], longtasks: [], draws: 0, tris: 0, prims: 0 });
  const count = (mode, n, inst = 1) => {
    if (mode === 4) P.tris += (n / 3) * inst;
    else if (mode === 5 || mode === 6) P.tris += Math.max(0, n - 2) * inst;
    else P.prims += n * inst; // точки и линии
  };
  const wrap = (proto, name, fn) => {
    const orig = proto?.[name];
    if (!orig) return;
    proto[name] = function (...a) {
      P.draws += 1;
      fn(a);
      return orig.apply(this, a);
    };
  };
  for (const proto of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype]) {
    wrap(proto, 'drawArrays', (a) => count(a[0], a[2]));
    wrap(proto, 'drawElements', (a) => count(a[0], a[1]));
    wrap(proto, 'drawArraysInstanced', (a) => count(a[0], a[2], a[3]));
    wrap(proto, 'drawElementsInstanced', (a) => count(a[0], a[1], a[4]));
  }
  let last = 0;
  let lastDraws = 0;
  let lastTris = 0;
  const loop = (t) => {
    if (last) P.frames.push([t, t - last, P.draws - lastDraws, P.tris - lastTris]);
    last = t;
    lastDraws = P.draws;
    lastTris = P.tris;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) P.longtasks.push([e.startTime, e.duration]);
    }).observe({ type: 'longtask', buffered: true });
  } catch {
    /* нет поддержки longtask */
  }
}

const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0);
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/** Статистика окна по сырым данным из страницы. */
function windowStats(perf, w) {
  const frames = perf.frames.filter(([t]) => t > w.start && t <= w.end);
  const dts = frames.map((f) => f[1]).sort((a, b) => a - b);
  const glFrames = frames.filter((f) => f[2] > 0);
  const long = perf.longtasks.filter(([s, d]) => s + d > w.start && s < w.end);
  const seconds = (w.end - w.start) / 1000;
  return {
    frames: dts.length,
    seconds,
    dts,
    avg: dts.length ? dts.reduce((a, b) => a + b, 0) / dts.length : 0,
    p95: pct(dts, 0.95),
    slow: dts.length ? dts.filter((d) => d > 33.4).length / dts.length : 0,
    longCount: long.length,
    longMs: long.reduce((a, [, d]) => a + d, 0),
    glFps: glFrames.length / seconds,
    draws: glFrames.length ? glFrames.reduce((a, f) => a + f[2], 0) / glFrames.length : 0,
    tris: glFrames.length ? glFrames.reduce((a, f) => a + f[3], 0) / glFrames.length : 0,
  };
}

async function processCpu(browserSession) {
  const { processInfo } = await browserSession.send('SystemInfo.getProcessInfo');
  const byType = {};
  for (const p of processInfo) byType[p.type] = (byType[p.type] ?? 0) + p.cpuTime;
  return byType;
}

async function mainThread(session) {
  const { metrics } = await session.send('Performance.getMetrics');
  const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
  return { task: m.TaskDuration ?? 0, script: m.ScriptDuration ?? 0, style: m.RecalcStyleDuration ?? 0, layout: m.LayoutDuration ?? 0 };
}

const browser = await launch();
const browserSession = await browser.newBrowserCDPSession();
const report = { url: base, dpr, cpu, query: args.query ?? '', sizes: {} };

for (const size of sizes) {
  const mobile = !desktop && size.w < 1000;
  const context = await browser.newContext({
    viewport: { width: size.w, height: size.h },
    deviceScaleFactor: dpr,
    isMobile: mobile,
    hasTouch: mobile,
  });
  await context.addInitScript(instrument);
  // --css: временное CSS-правило для экспериментов (что именно стоит кадров), без пересборки.
  if (args.css)
    await context.addInitScript((css) => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.append(style);
      });
    }, args.css);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const session = await context.newCDPSession(page);
  await session.send('Performance.enable');
  if (cpu > 1) await session.send('Emulation.setCPUThrottlingRate', { rate: cpu });

  const url = new URL(base);
  if (args.query) for (const kv of args.query.split('&')) url.searchParams.set(...kv.split('='));
  url.searchParams.set('scene', String(scenes[0]));
  await page.goto(url.toString(), { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.__FX__?.getState().ready === true, null, { timeout: 60000, polling: 100 });
  // Прогрев: вступительный наезд камеры, компиляция шейдеров, ленивые чанки сцен.
  await page.waitForTimeout(4000);

  const windows = [];
  /** Сцены, у которых к моменту ready ещё не было содержимого (проверка отложенного монтирования). */
  const emptyAtReady = [];
  const now = () => page.evaluate(() => performance.now());
  /** Окно замера: время страницы + процессорное время процессов и главного потока. */
  const measure = async (label, scene, kind, body) => {
    const cpu0 = await processCpu(browserSession);
    const mt0 = await mainThread(session);
    const start = await now();
    await body();
    const end = await now();
    const cpu1 = await processCpu(browserSession);
    const mt1 = await mainThread(session);
    const seconds = (end - start) / 1000;
    const per = (a, b) => (b - a) / seconds;
    windows.push({
      label,
      scene,
      kind,
      start,
      end,
      gpuCpu: per(cpu0.GPU ?? cpu0.gpu ?? 0, cpu1.GPU ?? cpu1.gpu ?? 0),
      rendererCpu: per(cpu0.renderer ?? 0, cpu1.renderer ?? 0),
      mainBusy: per(mt0.task, mt1.task),
      mainScript: per(mt0.script, mt1.script),
      mainStyleLayout: per(mt0.style + mt0.layout, mt1.style + mt1.layout),
    });
  };

  for (let k = 0; k < scenes.length; k++) {
    const n = scenes[k];
    if (k > 0) {
      await measure(`→${n}`, n, 'transition', async () => {
        await page.evaluate((target) => window.__FX__.getState().go(target - 1), n);
        await page.waitForFunction(() => {
          const s = window.__FX__.getState();
          return s.phase === 'idle' && s.ready;
        }, null, { timeout: 30000, polling: 50 });
        if (!(await page.evaluate(() => Boolean(document.querySelector('[data-current="true"] [data-scene-frame]'))))) emptyAtReady.push(n);
      });
      await measure(`${n} вход`, n, 'entry', () => page.waitForTimeout(entryMs));
    }
    await measure(`${n} покой`, n, 'idle', () => page.waitForTimeout(idleMs));
  }

  const perf = await page.evaluate(() => window.__PERF__);
  const rows = windows.map((w) => {
    const s = windowStats(perf, w);
    return { ...w, ...s };
  });
  const summary = {};
  for (const kind of ['transition', 'entry', 'idle']) {
    const list = rows.filter((r) => r.kind === kind);
    if (!list.length) continue;
    const dts = list.flatMap((r) => r.dts).sort((a, b) => a - b);
    const seconds = list.reduce((a, r) => a + r.seconds, 0);
    const wavg = (key) => list.reduce((a, r) => a + r[key] * r.seconds, 0) / seconds;
    summary[kind] = {
      windows: list.length,
      seconds: round(seconds),
      frames: dts.length,
      fps: round(dts.length / seconds),
      avgMs: round(dts.reduce((a, b) => a + b, 0) / Math.max(1, dts.length)),
      p95Ms: round(pct(dts, 0.95)),
      slowPct: round((dts.filter((d) => d > 33.4).length / Math.max(1, dts.length)) * 100),
      longTasks: list.reduce((a, r) => a + r.longCount, 0),
      longMsPerSec: round(list.reduce((a, r) => a + r.longMs, 0) / seconds),
      glFps: round(wavg('glFps')),
      drawsPerFrame: round(wavg('draws')),
      trisPerFrame: Math.round(wavg('tris')),
      mainBusyPct: round(wavg('mainBusy') * 100),
      gpuCpuPct: round(wavg('gpuCpu') * 100),
      rendererCpuPct: round(wavg('rendererCpu') * 100),
    };
  }
  report.sizes[size.name] = {
    summary,
    errors,
    emptyAtReady,
    windows: rows.map(({ dts, ...r }) => ({
      ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? round(v, 2) : v])),
    })),
  };

  console.log(`\n${size.name} @${dpr}x, CPU ×${cpu}${args.query ? `, ?${args.query}` : ''}`);
  console.table(summary);
  if (errors.length) console.log('Ошибки страницы:', errors.slice(0, 3));
  if (emptyAtReady.length) console.log('Пустая сцена в момент ready:', emptyAtReady.join(', '));
  await context.close();
}

await browser.close();
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`Отчёт: ${out}`);
