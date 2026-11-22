// SUP-REQ-012, H-4: the conformance kit in Chromium, the runtime the plugin ships in, through the
// module entries the plugin resolves. Fails on any difference.
import { expect, test } from '@playwright/test';

test('SUP-REQ-012 · H-4 · the conformance kit passes in the browser, every case', async ({ page }) => {
  await page.goto('conformance.html');
  await expect(page.locator('#result')).not.toHaveText('running', { timeout: 30_000 });
  const result = JSON.parse((await page.locator('#result').textContent())!);
  console.log(`conformance ${result.cases} (@silverpoint/embed ${result.version}, Chromium): ${result.passed} passed, ${result.failed?.length} failed`);
  expect(result.error).toBeUndefined();
  expect(result.version).toBe(result.cases);
  expect(result.failed).toEqual([]);
  expect(result.passed).toBeGreaterThan(0);
});
