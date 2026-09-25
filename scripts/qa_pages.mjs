/** Page smoke test for E-Menu frontend */
export default async (page) => {
  const BASE = 'http://localhost:5173';
  const pages = [
    ['landing', '/'],
    ['login', '/login'],
    ['menu-shams', '/r/shams?table=1'],
    ['kitchen', '/kitchen'],
    ['dashboard', '/dashboard'],
  ];
  const results = [];

  for (const [name, path] of pages) {
    const consoleErrors = [];
    const failedReqs = [];
    const onConsole = (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); };
    const onFail = (req) => failedReqs.push(`${req.url()} ${req.failure()?.errorText || ''}`);
    page.on('console', onConsole);
    page.on('requestfailed', onFail);
    let entry = { name, path, ok: false };
    try {
      const resp = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2000);
      const info = await page.evaluate(() => ({
        title: document.title,
        textLen: document.body?.innerText?.length || 0,
        hasRoot: !!document.querySelector('#root')?.children?.length,
      }));
      entry = {
        name,
        path,
        status: resp?.status(),
        ...info,
        consoleErrors: [...new Set(consoleErrors)].filter((e) => !e.includes('SW registration')).slice(0, 8),
        failedRequests: [...new Set(failedReqs)].slice(0, 8),
        ok: (resp?.status() || 0) < 400 && info.hasRoot && info.textLen > 30,
      };
    } catch (e) {
      entry.error = String(e);
    }
    page.off('console', onConsole);
    page.off('requestfailed', onFail);
    results.push(entry);
  }

  // Theme visual check — load menu after setting theme via API reload
  const themeResults = [];
  const THEMES = [
    'modern-indigo', 'classic-gold', 'emerald-fresh', 'rose-boutique', 'ocean-blue',
    'sunset-warm', 'midnight-lounge', 'minimal-mono', 'arabesque', 'coffee-roast',
  ];
  for (const theme of THEMES) {
    try {
      // public menu returns theme; page applies on load — we verify API first in page
      const api = await page.evaluate(async (tid) => {
        const r = await fetch('/api/v1/restaurants/shams/public_menu/', { headers: { 'X-Tenant-Slug': 'shams' } });
        return r.ok ? r.json() : null;
      }, theme);
      await page.goto(`${BASE}/r/shams?table=1&_t=${theme}`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2500);
      const vis = await page.evaluate(() => {
        const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
        return {
          primary: primary || '(empty)',
          textLen: document.body.innerText.length,
          layout: document.querySelector('[class*="menu"]') ? 'has-menu' : 'unknown',
        };
      });
      themeResults.push({
        theme,
        apiTheme: api?.menu_theme,
        ...vis,
        ok: vis.textLen > 100,
      });
    } catch (e) {
      themeResults.push({ theme, ok: false, error: String(e) });
    }
  }

  return {
    pages: results,
    themes: themeResults,
    summary: {
      pagesOk: results.filter((r) => r.ok).length,
      pagesTotal: results.length,
      themesOk: themeResults.filter((t) => t.ok).length,
      themesTotal: themeResults.length,
    },
  };
};
