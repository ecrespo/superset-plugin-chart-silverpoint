// SUP-REQ-011 (SUP-T-02, SUP-T-07): in a Superset built with the preset registered, a silverpoint chart
// is created from the examples dataset, saved, drawn by Explore, and read by keyboard.
import { expect, test, type Page } from '@playwright/test';

const USER = process.env.SUPERSET_USER ?? 'admin';
const PASSWORD = process.env.SUPERSET_PASSWORD ?? 'admin';

async function login(page: Page): Promise<void> {
  await page.goto('login/');
  await page.locator('input[name="username"], #username').first().fill(USER);
  await page.locator('input[name="password"], #password').first().fill(PASSWORD);
  await page.keyboard.press('Enter');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

async function datasetId(page: Page, table: string): Promise<number> {
  const q = `(filters:!((col:table_name,opr:eq,value:${table})))`;
  const res = await page.request.get(`api/v1/dataset/?q=${encodeURIComponent(q)}`);
  expect(res.ok(), await res.text()).toBe(true);
  const body = await res.json();
  expect(body.count, `the examples dataset ${table}`).toBeGreaterThan(0);
  return body.result[0].id;
}

const metric = { expressionType: 'SIMPLE', column: { column_name: 'num' }, aggregate: 'SUM', label: 'SUM(num)' };

test('SUP-REQ-001 · the gallery lists the silverpoint viz types', async ({ page }) => {
  await login(page);
  const res = await page.request.get('api/v1/chart/viz_types');
  // Older APIs have no viz_types endpoint: the registry in the page is the source then.
  const keys: string[] = res.ok() ? (await res.json()).result ?? [] : [];
  if (keys.length > 0) expect(keys).toContain('silverpoint_bar_chart');
  await page.goto('chart/add');
  await page.getByPlaceholder(/search/i).first().fill('Silverpoint');
  await expect(page.getByText('Silverpoint Bar chart').first()).toBeVisible();
});

test('SUP-REQ-011 · a chart from the examples dataset, saved, drawn and read by keyboard', async ({ page }) => {
  await login(page);
  const id = await datasetId(page, 'birth_names');
  const params = {
    datasource: `${id}__table`, viz_type: 'silverpoint_bar_chart', role_x: ['name'], role_value: metric,
    adhoc_filters: [], row_limit: 10, order_desc: true, title: 'Births by name',
  };
  const csrf = (await (await page.request.get('api/v1/security/csrf_token/')).json()).result;
  const created = await page.request.post('api/v1/chart/', {
    headers: { 'X-CSRFToken': csrf, Referer: page.url() },
    data: { slice_name: 'silverpoint · births by name', viz_type: 'silverpoint_bar_chart', datasource_id: id, datasource_type: 'table', params: JSON.stringify(params) },
  });
  expect(created.ok(), await created.text()).toBe(true);
  const sliceId = (await created.json()).id;

  await page.goto(`explore/?slice_id=${sliceId}`);
  const svg = page.locator('.superset-plugin-chart-silverpoint svg.sp-chart');
  await expect(svg).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('group', { name: /Births by name/ })).toBeVisible();
  console.log(`chart ${sliceId}: ${await svg.getAttribute('width')}×${await svg.getAttribute('height')}, data-mode=${await svg.getAttribute('data-mode')}`);

  const root = page.locator('.superset-plugin-chart-silverpoint .sp-root');
  await root.focus();
  const live = page.locator('.superset-plugin-chart-silverpoint .sp-live');
  await expect(live).not.toHaveText('');
  const first = (await live.textContent()) ?? '';
  await page.keyboard.press('ArrowRight');
  await expect(live).not.toHaveText(first);
  console.log(`read by keyboard: "${first}" → "${await live.textContent()}"`);
});

// SUP-DD-03 (SUP-T-02): can a .supx contribute a chart type? Superset's extensions reach the host only
// through @apache-superset/core, built per extension from `window.superset`; @superset-ui/core (the
// chart registries) is not a shared module (developer_docs/extensions/architecture.md). On master
// 2026-11-22 that surface has no chart or viz namespace: no. This test fails, with a message to
// revisit the decision, the day one appears.
test('SUP-DD-03 · the extensions surface has no chart contribution (revisit when this fails)', async ({ page }) => {
  await login(page);
  await page.goto('chart/list/');
  await page.waitForFunction(() => 'superset' in window);
  const surface = await page.evaluate(() => Object.keys((window as unknown as { superset: object }).superset).sort());
  console.log(`window.superset: ${surface.join(', ')}`);
  expect(surface.length).toBeGreaterThan(0);
  expect(surface.filter((k) => /chart|viz|visuali[sz]ation|plugin/i.test(k)), 'Superset now offers a chart contribution: revisit SUP-DD-03 (a .supx artefact, as a delta)').toEqual([]);
});
