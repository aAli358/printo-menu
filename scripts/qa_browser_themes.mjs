/**
 * Browser QA — verify each menu theme renders with correct CSS on the customer menu.
 * Requires: frontend dev server (5173), backend (8000), playwright in frontend/
 * Run: node scripts/qa_browser_themes.mjs
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FRONTEND = join(ROOT, 'frontend');
const require = createRequire(join(FRONTEND, 'package.json'));
const { chromium } = require('playwright');

const BASE = process.env.QA_FRONTEND_URL || 'http://127.0.0.1:5173';
const SLUG = 'shams';
const TABLE = '1';
const PYTHON = process.env.PYTHON || 'C:\\Users\\a\\.codegeex\\mamba\\envs\\codegeex-agent\\python.exe';

function ensurePlaywrightBrowsersPath() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) return;
  const local = join(homedir(), 'AppData', 'Local', 'ms-playwright');
  if (existsSync(local)) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = local;
  }
}

const THEMES = {
  'modern-indigo': '#6366f1',
  'classic-gold': '#d4af37',
  'emerald-fresh': '#059669',
  'rose-boutique': '#e11d48',
  'ocean-blue': '#0284c7',
  'sunset-warm': '#ea580c',
  'midnight-lounge': '#8b5cf6',
  'minimal-mono': '#171717',
  'arabesque': '#b45309',
  'coffee-roast': '#78350f',
};

const setThemePy = `
import os, sys, django
sys.path.insert(0, r'${ROOT.replace(/\\/g, '\\\\')}')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from menu.models import Restaurant
r = Restaurant.objects.get(slug='${SLUG}')
r.menu_theme = sys.argv[1]
r.save(update_fields=['menu_theme'])
print(r.menu_theme)
`;

function setTheme(themeId) {
  const r = spawnSync(PYTHON, ['-c', setThemePy, themeId], {
    cwd: ROOT,
    encoding: 'utf-8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  });
  if (r.status !== 0) {
    throw new Error(`setTheme ${themeId}: ${r.stderr || r.stdout}`);
  }
  return r.stdout.trim();
}

function restoreTheme(original) {
  if (original) setTheme(original);
}

async function main() {
  ensurePlaywrightBrowsersPath();
  mkdirSync(join(ROOT, 'qa-screenshots'), { recursive: true });

  const metaPy = `
import os, sys, django, json
sys.path.insert(0, r'${ROOT.replace(/\\/g, '\\\\')}')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from menu.models import Restaurant
r = Restaurant.objects.get(slug='${SLUG}')
print(json.dumps({'menu_theme': r.menu_theme, 'primary_color': r.primary_color or ''}))
`;
  const metaRaw = spawnSync(PYTHON, ['-c', metaPy], { cwd: ROOT, encoding: 'utf-8' }).stdout.trim();
  const meta = JSON.parse(metaRaw);
  const original = meta.menu_theme;
  const brandPrimary = (meta.primary_color || '').toLowerCase();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('requestfailed', (req) => {
    failedRequests.push(`${req.url()} — ${req.failure()?.errorText || 'failed'}`);
  });

  const results = [];
  let failed = 0;

  console.log('\n=== Browser Theme Visual QA ===\n');

  for (const [themeId, expectedPrimary] of Object.entries(THEMES)) {
    setTheme(themeId);
    const url = `${BASE}/r/${SLUG}?table=${TABLE}&_qa=${Date.now()}`;
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

    await page.waitForFunction(
      () => document.documentElement.dataset.menuTheme && document.body.innerText.length > 80,
      { timeout: 20000 },
    ).catch(() => {});

    const state = await page.evaluate(() => ({
      menuTheme: document.documentElement.dataset.menuTheme || '',
      menuLayout: document.documentElement.dataset.menuLayout || '',
      primary: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
      textLen: document.body.innerText.length,
      title: document.title,
    }));

    const themeOk = state.menuTheme === themeId;
    const primaryOk = brandPrimary
      ? state.primary.toLowerCase() === brandPrimary
      : state.primary.toLowerCase() === expectedPrimary.toLowerCase();
    const contentOk = state.textLen > 80;
    const httpOk = (resp?.status() ?? 0) < 400;
    const ok = themeOk && primaryOk && contentOk && httpOk;

    const shot = join(ROOT, 'qa-screenshots', `theme-${themeId}.png`);
    await page.screenshot({ path: shot, fullPage: false });

    console.log(
      `  ${ok ? 'OK' : 'FAIL'}  ${themeId.padEnd(18)} theme=${state.menuTheme} primary=${state.primary} items=${state.textLen > 80 ? 'yes' : 'no'}`,
    );
    if (!ok) {
      failed += 1;
      if (!themeOk) console.log(`         expected data-menu-theme=${themeId}, got ${state.menuTheme}`);
      if (!primaryOk) {
        const expected = brandPrimary || expectedPrimary;
        console.log(`         expected --color-primary=${expected}, got ${state.primary}`);
      }
    }

    results.push({ themeId, ok, state, screenshot: shot });
  }

  // Extra pages smoke
  console.log('\n=== Browser Page Smoke ===\n');
  const pages = [
    ['landing', `${BASE}/`],
    ['login', `${BASE}/login`],
    ['kitchen', `${BASE}/kitchen`],
    ['dashboard', `${BASE}/dashboard`],
    ['platform', `${BASE}/platform`],
  ];
  let pageFailed = 0;
  for (const [name, url] of pages) {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const hasRoot = await page.evaluate(() => !!document.getElementById('root')?.childElementCount);
    const ok = (resp?.status() ?? 0) < 400 && hasRoot;
    console.log(`  ${ok ? 'OK' : 'FAIL'}  ${name.padEnd(12)} HTTP ${resp?.status() ?? 0}`);
    if (!ok) pageFailed += 1;
  }

  restoreTheme(original);
  await browser.close();

  const uniqueErrors = [...new Set(consoleErrors)].slice(0, 8);
  const uniqueFailed = [...new Set(failedRequests)].slice(0, 8);

  console.log('\n=== Summary ===');
  console.log(`  Themes: ${Object.keys(THEMES).length - failed}/${Object.keys(THEMES).length} OK`);
  console.log(`  Pages:  ${pages.length - pageFailed}/${pages.length} OK`);
  if (uniqueErrors.length) {
    console.log('  Console errors:', uniqueErrors.join(' | '));
  }
  if (uniqueFailed.length) {
    console.log('  Failed requests:', uniqueFailed.join(' | '));
  }
  console.log(`  Screenshots: qa-screenshots/\n`);

  process.exit(failed || pageFailed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
