#!/usr/bin/env node
/**
 * Capture screenshots of the live product for the README.
 *
 * Playwright is an optional, manually installed dependency — screenshots are an
 * occasional task and a browser download does not belong in every `npm install`
 * or in CI. See assets/docs/README.md.
 *
 *   npm install --save-dev playwright
 *   npx playwright install chromium
 *   node scripts/screenshots.mjs
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = 8129;
const ROOT = process.cwd();
const OUT = 'assets/docs';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function serve() {
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (path.endsWith('/')) path += 'index.html';
      // Contain the path inside ROOT.
      const filePath = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''));
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

const SHOTS = [
  { file: 'hero-desktop.png', path: '/', viewport: [1440, 900] },
  { file: 'catalog-desktop.png', path: '/', viewport: [1440, 900], anchor: '#catalogo' },
  { file: 'pricing-desktop.png', path: '/', viewport: [1440, 900], anchor: '#precos' },
  { file: 'reservation-modal.png', path: '/', viewport: [1440, 950], modal: true },
  { file: 'mobile.png', path: '/', viewport: [390, 844], fullPage: true },
  { file: 'case-study.png', path: '/case-study/', viewport: [1440, 900] },
];

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('Playwright is not installed. Run:');
    console.error('  npm install --save-dev playwright && npx playwright install chromium');
    process.exit(1);
  }

  const server = await serve();
  const browser = await chromium.launch();

  try {
    for (const shot of SHOTS) {
      const page = await browser.newPage({
        viewport: { width: shot.viewport[0], height: shot.viewport[1] },
        deviceScaleFactor: 2,
      });
      await page.goto(`http://localhost:${PORT}${shot.path}`, { waitUntil: 'networkidle' });

      if (shot.anchor) {
        // This callback is serialised and executed inside the browser, not here.
        // eslint-disable-next-line no-undef
        await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView(), shot.anchor);
      }
      if (shot.modal) {
        await page.click('[data-open-reserve]');
        await page.fill('input[name="nome"]', 'Ana Souza');
        await page.fill('input[name="whatsapp"]', '11987654321');
        await page.check('input[name="raquetes"][value="Wilson Blade 98 18x20 V9"]');
        await page.check('input[name="raquetes"][value="Head Speed MP 2026"]');
        await page.check('input[name="urgencia"][value="Esta semana"]');
        await page.fill('input[name="bairro"]', 'Pinheiros');
      }

      // Let fonts settle so headings do not capture mid-swap.
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(OUT, shot.file), fullPage: Boolean(shot.fullPage) });
      console.log(`captured ${OUT}/${shot.file}`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main();
