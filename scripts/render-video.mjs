#!/usr/bin/env node
/**
 * Renders Version B (video.html) to MP4, frame by frame.
 *
 *   npm run render:video                 # full video → video/
 *   npm run render:video -- --from 17 --to 26 --out video/preview.mp4   # a section
 *
 * How it works: the built site is served locally, Chromium opens
 * video.html?render (paused master timeline), and for every frame we call
 * window.__seek(frame / fps), take a lossless PNG screenshot and pipe it
 * into FFmpeg. Nothing depends on real time, so no frame can be dropped.
 *
 * Requires: FFmpeg on PATH (or FFMPEG_PATH) and Playwright with Chromium
 *   npm i -D playwright && npx playwright install chromium
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { preview } from 'vite';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright not found. Run:  npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .join(' ')
    .split('--')
    .filter(Boolean)
    .map((s) => s.trim().split(/\s+/))
    .map(([k, ...v]) => [k, v.join(' ') || true]),
);
const FPS = Number(args.fps ?? 30);
const WIDTH = 1920;
const HEIGHT = 1080;
const OUT = resolve(args.out ?? 'video/tuwaiq-committees-1080p.mp4');
const FULL = !args.from && !args.to && !args.out;
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

function run(cmd, argv, opts = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, argv, { stdio: ['ignore', 'inherit', 'inherit'], ...opts });
    p.on('error', fail);
    p.on('close', (code) => (code === 0 ? ok() : fail(new Error(`${cmd} exited with ${code}`))));
  });
}

mkdirSync(dirname(OUT), { recursive: true });

const server = await preview({ preview: { port: 4317, strictPort: false, open: false }, logLevel: 'warn' });
const url = `${server.resolvedUrls.local[0]}video.html?render`;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'],
});

try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__videoReady === true, null, { timeout: 60_000 });

  const duration = await page.evaluate(() => window.__videoDuration);
  const from = Number(args.from ?? 0);
  const to = Math.min(Number(args.to ?? duration), duration);
  const first = Math.round(from * FPS);
  const last = Math.round(to * FPS); // exclusive
  const total = last - first;
  console.log(`Rendering ${total} frames (${(total / FPS).toFixed(2)} s @ ${FPS} fps, ${WIDTH}×${HEIGHT}) → ${OUT}`);

  const ff = spawn(
    FFMPEG,
    [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
      '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p',
      '-r', String(FPS), '-movflags', '+faststart',
      OUT,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );
  const ffDone = new Promise((ok, fail) => ff.on('close', (c) => (c === 0 ? ok() : fail(new Error(`ffmpeg exited ${c}`)))));

  const started = Date.now();
  for (let f = first; f < last; f++) {
    await page.evaluate((t) => window.__seek(t), f / FPS);
    const png = await page.screenshot({ type: 'png', animations: 'allow', caret: 'hide' });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    const done = f - first + 1;
    if (done % 30 === 0 || done === total) {
      const eta = ((Date.now() - started) / done) * (total - done) / 1000;
      process.stdout.write(`\r  frame ${done}/${total}  (${Math.round((done / total) * 100)}%)  ETA ${Math.round(eta)}s   `);
    }
  }
  ff.stdin.end();
  await ffDone;
  console.log(`\n✓ ${OUT} (${(statSync(OUT).size / 1e6).toFixed(1)} MB)`);
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}

if (FULL) {
  // Website-ready versions: lighter 720p MP4 (fast start) + poster image.
  const dir = dirname(OUT);
  const web = resolve(dir, 'tuwaiq-committees-web-720p.mp4');
  await run(FFMPEG, [
    '-y', '-loglevel', 'error', '-i', OUT,
    '-vf', 'scale=1280:720:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22',
    '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', web,
  ]);
  console.log(`✓ ${web} (${(statSync(web).size / 1e6).toFixed(1)} MB)`);
  const poster = resolve(dir, 'poster.jpg');
  await run(FFMPEG, ['-y', '-loglevel', 'error', '-ss', String(args.poster ?? 27.0), '-i', OUT, '-frames:v', '1', '-q:v', '2', poster]);
  console.log(`✓ ${poster}`);
}
