/** QA browser script — tests pages + all menu themes */
export default async (page, ui) => {
  const BASE = 'http://localhost:5173';
  const results = { pages: [], themes: [], errors: [] };

  const checkPage = async (name, url, waitMs = 2000) => {
    const consoleErrors = [];
    const failedRequests = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('requestfailed', (req) => {
      failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
    });
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(waitMs);
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) || '');
      const hasRoot = await page.evaluate(() => !!document.getElementById('root')?.childElementCount);
      results.pages.push({
        name,
        url,
        status: resp?.status() ?? 0,
        title,
        hasContent: hasRoot && bodyText.length > 20,
        consoleErrors: [...new Set(consoleErrors)].slice(0, 5),
        failedRequests: [...new Set(failedRequests)].slice(0, 5),
      });
    } catch (e) {
      results.errors.push({ name, url, error: String(e) });
    }
  };

  await checkPage('landing', `${BASE}/`);
  await checkPage('login', `${BASE}/login`);
  await checkPage('menu-shams', `${BASE}/r/shams?table=1`, 3500);
  await checkPage('kitchen', `${BASE}/kitchen`, 2000);

  // Fetch themes from API via page context
  const themes = await page.evaluate(async () => {
    try {
      const r = await fetch('/api/v1/restaurants/shams/public_menu/', {
        headers: { 'X-Tenant-Slug': 'shams' },
      });
      if (!r.ok) return { error: r.status };
      const data = await r.json();
      return { current: data.menu_theme, slug: data.slug };
    } catch (e) {
      return { error: String(e) };
    }
  });

  const THEME_IDS = [
    'modern-indigo', 'classic-gold', 'emerald-fresh', 'rose-boutique', 'ocean-blue',
    'sunset-warm', 'midnight-lounge', 'minimal-mono', 'arabesque', 'coffee-roast',
  ];

  for (const themeId of THEME_IDS) {
    try {
      await page.goto(`${BASE}/r/shams?table=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      const applied = await page.evaluate((tid) => {
        document.documentElement.setAttribute('data-menu-theme', tid);
        localStorage.setItem('emenu-theme-override', tid);
        window.dispatchEvent(new CustomEvent('emenu-theme-preview', { detail: tid }));
        const root = document.documentElement;
        const primary = getComputedStyle(root).getPropertyValue('--color-primary').trim();
        const hasMenu = document.body.innerText.length > 50;
        return { primary: primary || 'unset', hasMenu, themeAttr: root.getAttribute('data-theme') };
      }, themeId);
      // Reload to pick theme from mocked restaurant if store reads it
      await page.evaluate((tid) => {
        const store = window.__EMENU_QA_THEME__;
        if (store) store(tid);
      }, themeId).catch(() => {});
      const screenshot = `qa-theme-${themeId}.png`;
      await page.screenshot({ path: screenshot, fullPage: false });
      results.themes.push({
        id: themeId,
        ...applied,
        screenshot,
        ok: applied.hasMenu,
      });
    } catch (e) {
      results.themes.push({ id: themeId, ok: false, error: String(e) });
    }
  }

  results.apiMenu = themes;
  const failedPages = results.pages.filter((p) => p.status >= 400 || !p.hasContent || p.consoleErrors.length);
  const failedThemes = results.themes.filter((t) => !t.ok);
  results.summary = {
    pagesTotal: results.pages.length,
    pagesFailed: failedPages.length,
    themesTotal: results.themes.length,
    themesFailed: failedThemes.length,
    pass: failedPages.length === 0 && failedThemes.length === 0 && results.errors.length === 0,
  };
  return results;
};
