#!/usr/bin/env node
/**
 * Reads the label times straight from the real master timeline (built site,
 * video.html?render) and writes scripts/sound/cues.json for the sound design.
 * Run after `vite build`. Used by `npm run render:audio`.
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { preview } from 'vite';

const { chromium } = createRequire(import.meta.url)('playwright');
const server = await preview({ preview: { port: 4319, strictPort: false, open: false }, logLevel: 'warn' });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`${server.resolvedUrls.local[0]}video.html?render`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__videoReady === true, null, { timeout: 60_000 });
  const data = await page.evaluate(() => ({ duration: window.__videoDuration, labels: window.__videoLabels }));
  writeFileSync('scripts/sound/cues.json', JSON.stringify(data, null, 2) + '\n');
  console.log(`✓ scripts/sound/cues.json — ${Object.keys(data.labels).length} labels, duration ${data.duration}s`);
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
