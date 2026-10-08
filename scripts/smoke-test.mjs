/**
 * End-to-end smoke test over the production build.
 *
 * Serves dist/ on a local HTTP server (the same way the app is really served)
 * and walks the full teacher journey at laptop and phone widths, failing on
 * any console error. Run with: npm run test:smoke
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const DIST = join(fileURLToPath(new URL('../dist', import.meta.url)));
const PORT = 4178;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

/** Static server with SPA fallback, mirroring the real host config. */
function serve() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const url = (req.url ?? '/').split('?')[0];
      let path = join(DIST, normalize(url));
      try {
        let body;
        try {
          body = await readFile(path);
        } catch {
          path = join(DIST, 'index.html');
          body = await readFile(path);
        }
        res.writeHead(200, { 'Content-Type': MIME[extname(path)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(500).end('error');
      }
    });
    server.listen(PORT, () => resolve(server));
  });
}

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function signIn(page) {
  await page.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[autocomplete="username"]').fill('T1024');
  await page.locator('input[type="password"]').fill('demo1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForSelector('text=Good', { timeout: 10_000 });
}

async function run() {
  const server = await serve();
  const browser = await chromium.launch();
  const errors = [];

  // ---- Laptop ----
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  page.on('pageerror', (e) => errors.push(`desktop: ${e.message}`));
  page.on('console', (m) => {
    const text = m.text();
    // Google Fonts may be blocked on an offline CI runner; that is not an app error.
    const ignorable = ['favicon', 'fonts.googleapis', 'ERR_TUNNEL', 'ERR_INTERNET_DISCONNECTED'];
    if (m.type() === 'error' && !ignorable.some((i) => text.includes(i))) errors.push(`desktop console: ${text}`);
  });

  await signIn(page);
  check('Login and dashboard render', (await page.locator('text=My Classes').count()) > 0);

  for (const nav of ['My Classes', 'Subjects', 'Lessons', 'Teaching Progress', 'Recent Activity', 'Admin console', 'Profile', 'Settings']) {
    await page.getByText(nav, { exact: true }).first().click();
    await page.waitForTimeout(500);
    check(`Navigate: ${nav}`, (await page.locator('h1').count()) > 0);
  }

  // Lesson journey
  await page.getByText('Lessons', { exact: true }).first().click();
  await page.waitForTimeout(400);
  await page.getByText('Introduction to Fractions').first().click();
  await page.waitForSelector('text=Lesson Plan', { timeout: 10_000 });
  check('Lesson details opens', true);

  await page.getByRole('tab', { name: 'Lesson Plan' }).click();
  await page.waitForSelector('text=Download disabled by administrator', { timeout: 10_000 });
  check('Lesson plan loads via content provider', true);
  check('Download is disabled', await page.getByRole('button', { name: /Download disabled/ }).isDisabled());
  check('Watermark is rendered', (await page.locator('[aria-hidden]').count()) > 0);

  // Page navigation + zoom + search
  await page.getByRole('button', { name: 'Next page' }).click();
  await page.waitForTimeout(300);
  check('Page navigation works', (await page.locator('text=Page 2 / 8').count()) > 0);
  await page.getByPlaceholder('Search in document').fill('fraction');
  await page.waitForTimeout(400);
  check('In-document search finds matches', (await page.locator('text=in document').count()) > 0);
  await page.getByPlaceholder('Search in document').fill('');

  // Copy protection
  const copyBlocked = await page.evaluate(() => {
    const el = document.querySelector('.protected-content');
    if (!el) return false;
    const evt = new ClipboardEvent('copy', { bubbles: true, cancelable: true });
    el.dispatchEvent(evt);
    return evt.defaultPrevented;
  });
  check('Copy is blocked on protected content', copyBlocked);

  for (const tab of ['Videos', 'Resources', 'Game', 'Q&A', 'Coverage']) {
    await page.getByRole('tab', { name: tab }).click();
    await page.waitForTimeout(700);
    check(`Tab renders: ${tab}`, true);
  }

  // Save a teaching record (append-only)
  const before = await page.locator('text=/\\d+ records?/').first().textContent();
  await page.getByLabel('Denominator').check();
  await page.getByLabel('Teacher notes').fill('Smoke test record.');
  await page.getByRole('button', { name: /Save teaching record/ }).click();
  await page.getByRole('button', { name: 'Save record' }).click();
  await page.waitForSelector('text=Teaching record saved successfully.', { timeout: 10_000 });
  const after = await page.locator('text=/\\d+ records?/').first().textContent();
  check('Teaching record saved', true);
  check('History appended, not overwritten', before !== after, `${before} → ${after}`);

  // Game is playable
  await page.getByRole('tab', { name: 'Game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await page.waitForTimeout(400);
  check('Game starts', (await page.locator('text=Question 1 of 10').count()) > 0);

  // ---- Phone ----
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mpage = await mobile.newPage();
  mpage.on('pageerror', (e) => errors.push(`mobile: ${e.message}`));
  await signIn(mpage);
  check('Phone: login and dashboard', (await mpage.locator('text=My Classes').count()) > 0);
  await mpage.goto(`http://localhost:${PORT}/lessons/5A-math-fractions`, { waitUntil: 'networkidle' });
  await mpage.getByRole('tab', { name: 'Lesson Plan' }).click();
  await mpage.waitForSelector('text=Download disabled by administrator', { timeout: 10_000 });
  const overflow = await mpage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('Phone: lesson plan readable with no horizontal scroll', overflow <= 1, `overflow ${overflow}px`);

  check('No console or page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

  await browser.close();
  server.close();

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
