// SUP-REQ-005..009, H-5 (SUP-T-07): a chart drawn by Superset's SuperChart from the built package.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('SUP-REQ-005 · SUP-REQ-009 · draws with the stylesheet and EB Garamond, no request elsewhere', async ({ page, baseURL }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('index.html');
  const svg = page.locator('svg.sp-chart');
  await expect(svg).toHaveCount(1);
  await expect(page.getByRole('group', { name: /Births by name/ })).toBeVisible();
  const ink = await svg.evaluate((el) => getComputedStyle(el).getPropertyValue('--sp-ink').trim());
  expect(ink).not.toBe('');
  expect(await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].some((f) => f.family.includes('EB Garamond')); })).toBe(true);
  expect(requests.filter((u) => !u.startsWith(baseURL!) && !u.startsWith('data:'))).toEqual([]);
});

test('SUP-REQ-006 · fills the width and height Superset gives', async ({ page }) => {
  await page.goto('index.html?width=420');
  await expect(page.locator('svg.sp-chart')).toHaveAttribute('width', '420');
  await expect(page.locator('svg.sp-chart')).toHaveAttribute('height', '320');
});

test('H-5 · reads by keyboard', async ({ page }) => {
  await page.goto('index.html');
  const root = page.locator('.sp-root');
  await root.focus();
  const live = page.locator('.sp-live');
  await expect(live).not.toHaveText('');
  const first = await live.textContent();
  await page.keyboard.press('ArrowRight');
  await expect(live).not.toHaveText(first ?? '');
  expect((await new AxeBuilder({ page } as never).include('.superset-plugin-chart-silverpoint').analyze()).violations).toEqual([]);
});

test('H-5 · the browser\'s high contrast switches the chart to precision', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('index.html');
  await expect(page.locator('svg.sp-chart')).toHaveAttribute('data-mode', 'precision');
});

test('H-5 · without high contrast the chart is inked', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'none', contrast: 'no-preference' });
  await page.goto('index.html');
  await expect(page.locator('svg.sp-chart')).toHaveAttribute('data-mode', 'ink');
});

test('SUP-REQ-007 · a binding error is shown by Superset\'s chart error boundary', async ({ page }) => {
  await page.goto('index.html?metric=missing');
  await expect(page.getByText(/no column "SUM\(other\)"/)).toBeVisible();
});
