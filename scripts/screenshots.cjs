const { _electron: electron } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaarnegar-screenshots-'));
const now = new Date();
const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
const state = {
  version: 1, name: 'Meysam Shams', rate: 50,
  organizations: [{ id: 'studio', name: 'Shams Studio', rate: 50, currency: 'USD' }],
  projects: [{ id: 'website', organizationId: 'studio', name: 'Website redesign', rate: 75 }],
  entries: [
    { id: 'design', title: 'Design dashboard components', date: today, durationMs: 5400000, rate: 75, currency: 'USD', organizationId: 'studio', projectId: 'website', source: 'timer', createdAt: now.getTime() - 7200000 },
    { id: 'review', title: 'Review project requirements', date: today, durationMs: 2700000, rate: 75, currency: 'USD', organizationId: 'studio', projectId: 'website', source: 'manual', createdAt: now.getTime() - 3600000 }
  ],
  active: { id: 'active', title: 'Build the project overview', rate: 75, currency: 'USD', organizationId: 'studio', projectId: 'website', segments: [{ start: now.getTime() - 2700000, end: now.getTime() }], runningSince: null }
};
fs.writeFileSync(path.join(userDir, 'work-data.json'), JSON.stringify(state));
fs.writeFileSync(path.join(userDir, 'preferences.json'), JSON.stringify({ language: 'en', theme: 'light' }));

(async () => {
  let app;
  try {
    const env = { ...process.env, KAARNEGAR_DATA_DIR: userDir };
    delete env.ELECTRON_RUN_AS_NODE;
    app = await electron.launch({ args: [root], env });
    const page = await app.firstWindow();
    await page.locator('.sidebar').waitFor();
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1440, 1080));
    await page.evaluate(() => document.fonts.ready);
    const capture = async (filename, compact = false) => {
      if (!compact) {
        await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1440, 1080));
        const height = await page.evaluate(() => Math.max(1080, document.documentElement.scrollHeight));
        await app.evaluate(({ BrowserWindow }, height) => BrowserWindow.getAllWindows()[0].setContentSize(1440, height), height);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(250);
      if (!compact) {
        assert.equal(await page.locator('.profile strong').innerText(), 'Meysam Shams');
        assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), true, 'The entire page must fit in the captured viewport');
        assert.equal(await page.evaluate(() => {
          const sidebar = document.querySelector('.sidebar').getBoundingClientRect();
          const profile = document.querySelector('.profile').getBoundingClientRect();
          return Math.abs(sidebar.bottom - innerHeight) <= 1 && profile.bottom <= innerHeight && innerHeight - profile.bottom < 50;
        }), true, 'The sidebar profile must sit at the bottom of the captured viewport');
      }
      await page.screenshot({ path: path.join(root, 'docs', filename), style: '.toast{visibility:hidden}', animations: 'disabled' });
    };
    await capture('dashboard.png');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.locator('#theme').selectOption('dark');
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await page.getByRole('button', { name: 'Track time', exact: true }).click();
    await capture('dark-dashboard.png');
    await page.getByRole('button', { name: 'Reports', exact: true }).click();
    await page.getByRole('button', { name: 'Today', exact: true }).click();
    await capture('english-reports.png');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.locator('#theme').selectOption('light');
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    await capture('settings.png');
    await page.locator('#theme').selectOption('dark');
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await page.getByRole('button', { name: 'Track time', exact: true }).click();
    await page.getByRole('button', { name: 'Compact widget', exact: true }).click();
    await page.locator('.compact').waitFor();
    await capture('widget-dark.png', true);
    console.log('README screenshots saved with the complete sidebar and Meysam Shams profile.');
  } finally {
    if (app) await app.close();
    fs.rmSync(userDir, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
