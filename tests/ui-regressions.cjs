const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { _electron: electron } = require('playwright');

const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaarnegar-ui-'));
const pdf = path.join(userDir, 'report.pdf');
const today = new Date();
const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
fs.writeFileSync(path.join(userDir, 'preferences.json'), JSON.stringify({ language: 'fa', theme: 'dark' }));
fs.writeFileSync(path.join(userDir, 'work-data.json'), JSON.stringify({ version: 1, name: '', rate: 100000, active: null, entries: [{ id: 'previous', title: 'طراحی صفحه', date, rate: 100000, durationMs: 3600000, source: 'manual', createdAt: Date.now() }] }));

(async () => {
  const env = { ...process.env, KAARNEGAR_DATA_DIR: userDir, KAARNEGAR_TEST_PDF: pdf };
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ args: [path.resolve('.')], env });
  try {
    const page = await app.firstWindow();
    await page.setViewportSize({ width: 430, height: 500 });
    await page.getByRole('heading', { name: 'زمان خود را ارزشمند کنید.' }).waitFor();
    assert.equal(await page.getByText('بدون نیاز به اینترنت').count(), 0);
    await page.getByRole('button', { name: 'ثبت دستی زمان' }).first().click();
    const modal = page.getByRole('dialog');
    await modal.getByRole('combobox', { name: 'عنوان ثبت دستی' }).waitFor();
    assert.equal(await modal.locator('.task-suggestions').count(), 0);
    await modal.getByRole('combobox', { name: 'عنوان ثبت دستی' }).click();
    await modal.locator('.task-suggestions').waitFor();
    await modal.getByRole('button', { name: 'تاریخ پایان' }).click();
    const bounds = await page.locator('.calendar').boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 430 && bounds.y + bounds.height <= 500, 'calendar stays within the window');
    await page.locator('.calendar').getByRole('button', { name: 'امروز' }).click();
    assert.equal(await page.locator('.calendar').count(), 0);
    await modal.getByRole('button', { name: 'انصراف' }).click();

    await page.setViewportSize({ width: 1280, height: 700 });
    await page.getByRole('button', { name: 'گزارش‌ها', exact: true }).click();
    await page.getByRole('button', { name: 'امروز', exact: true }).click();
    const fields = await page.locator('.report-filter-fields').evaluate(element => [...element.querySelectorAll('.assignment-fields select, .date-trigger, .search')].map(field => Math.round(field.getBoundingClientRect().bottom)));
    assert.equal(fields.length, 5);
    assert.ok(Math.max(...fields) - Math.min(...fields) < 8, 'report filters share one row');
    await page.getByRole('button', { name: 'دریافت گزارش PDF' }).click();
    await page.getByRole('status').filter({ hasText: 'گزارش PDF ذخیره شد.' }).waitFor();
    assert.equal(fs.readFileSync(pdf).subarray(0, 4).toString(), '%PDF');
    console.log('PASS: closed suggestions, modal calendar, single-row filters, removed copy, PDF export');
  } finally {
    await app.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
