import { test } from '@playwright/test';
test('dbg', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForSelector('#corridor-select');
  await page.selectOption('#corridor-select', 'road_delhigate_connector');
  await page.waitForTimeout(2500);
  console.log('POWER:', JSON.stringify(await page.locator('#blast-band-power').innerText()));
  console.log('ALERT:', JSON.stringify(await page.locator('#blast-band-alert').innerText()));
});
