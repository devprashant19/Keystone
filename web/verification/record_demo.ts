import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.use({
  video: {
    mode: 'on',
    size: { width: 1440, height: 900 },
  },
  viewport: { width: 1440, height: 900 },
});

test('Record Primary Demo Video in One Take (1440x900, ~90s)', async ({ page }) => {
  test.setTimeout(240000); // 4 minutes timeout for live sweeps + deliberate pacing
  const demoDir = path.resolve('verification/demo');
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true });
  }

  // 1. Start at / in the idle state (3 seconds)
  await page.goto('/');
  await page.waitForSelector('.intersection-node', { timeout: 15000 });
  await page.waitForTimeout(3000);

  // 2. Select corridor road_ring_monastery_chandgiram and click RUN SWEEP (watch progress)
  await page.locator('#corridor-select').selectOption('road_ring_monastery_chandgiram');
  await page.waitForTimeout(1000);
  await page.locator('#run-sweep-btn').click();

  // Watch real progress advance and cases populate
  await page.waitForSelector('.case-row', { timeout: 70000 });
  await page.waitForTimeout(2000);

  // 3. Sweep completes: inspect Policy C result (0 breaches, cost 1.0)
  await page.locator('#policy-row-C').click();
  await page.waitForTimeout(3500);

  // 4. Click through to inspect the worst breached case under Policy A (step through frames 0, 1, 2)
  await page.locator('#policy-row-A').click();
  await page.waitForTimeout(1500);
  const breachRow = page.locator('.case-row:has-text("BREACH")').first();
  await breachRow.click();
  await page.waitForTimeout(2000);

  await page.locator('#frame-step-1').click();
  await page.waitForTimeout(2500);

  await page.locator('#frame-step-2').click();
  await page.waitForTimeout(2500);

  // 5. Open evidence drill-through to show causal chain
  await page.locator('#open-evidence-btn').click();
  await page.waitForURL(/\/evidence\//, { timeout: 15000 });
  await page.waitForTimeout(5000);

  // 6. Return to /
  await page.goto('/');
  await page.waitForSelector('.intersection-node', { timeout: 15000 });
  await page.waitForTimeout(2500);

  // 7. Select corridor road_ring_kashmere_monastery and click RUN SWEEP
  await page.locator('#corridor-select').selectOption('road_ring_kashmere_monastery');
  await page.waitForTimeout(1000);
  await page.locator('#run-sweep-btn').click();

  // 8. Sweep completes: observe ABSTAIN -- NO ROBUST PLAN, read exposed cases, observe APPROVE is disabled
  await page.waitForSelector('text=ABSTAIN — NO ROBUST PLAN', { timeout: 70000 });
  await page.waitForSelector('text=NO_PLAN_PRESERVES_ALL_CRITICAL_REQUIREMENTS', { timeout: 10000 });
  await expect(page.locator('#approve-action-btn')).toBeDisabled();
  await page.waitForTimeout(4000);

  // 9. Observe null-result panel on the main path (0 interaction-only cases, 104/48/30 split)
  const nullPanel = page.locator('#null-result-panel');
  await expect(nullPanel).toBeVisible();
  await page.waitForTimeout(4000);

  // 10. Click the /method link to show method provenance, engine version, and 8.0km threshold comparison
  await page.locator('#null-sweep-link').click();
  await page.waitForURL(/\/method/, { timeout: 15000 });
  await page.waitForTimeout(2500);

  // Smooth scroll to provenance mix and threshold comparison
  await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(4000);

  // Finish video capture
  const video = page.video();
  await page.close();
  if (video) {
    const rawPath = await video.path();
    const destPath = path.join(demoDir, 'demo_1440x900.webm');
    fs.copyFileSync(rawPath, destPath);
    console.log(`Demo video recorded successfully to ${destPath}`);
    const stat = fs.statSync(destPath);
    console.log(`Video size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
    expect(stat.size).toBeGreaterThan(2 * 1024 * 1024);
    expect(stat.size).toBeLessThan(50 * 1024 * 1024);
  } else {
    throw new Error('Video recording failed: page.video() returned null');
  }
});
