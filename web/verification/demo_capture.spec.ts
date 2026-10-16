import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Route mocks are permitted ONLY to force states the live system cannot be made to
 * produce on demand -- 503, timeout, stale digest, partial run. Any artifact that
 * will be shown to a judge (demo scenes, README screenshots, video frames) MUST be
 * captured against the live API. Mock data must never contain an entity ID that
 * does not exist in data/.
 */
test.describe('Demo Scenes & Storyboard Capture (Live API)', () => {
  test.setTimeout(180000);
  const demoDir = path.resolve('verification/demo');

  test.beforeAll(() => {
    if (!fs.existsSync(demoDir)) {
      fs.mkdirSync(demoDir, { recursive: true });
    }
  });

  test('Capture Scene 1 (Golden Case), Scene 2 (Abstention), Scene 3 (Null Result) and Stills with ID validity', async ({ page }) => {
    // 0. Fetch real world summary to construct ground-truth entity ID catalog
    const summaryRes = await page.request.get('http://127.0.0.1:8000/api/world/summary');
    expect(summaryRes.ok()).toBe(true);
    const summary = await summaryRes.json();

    const validIds = new Set<string>();
    (summary.intersections || []).forEach((x: any) => validIds.add(x.id));
    (summary.corridors || []).forEach((x: any) => validIds.add(x.id));
    (summary.facilities || []).forEach((x: any) => validIds.add(x.id));
    (summary.depots || []).forEach((x: any) => validIds.add(x.id));
    (summary.towers || []).forEach((x: any) => validIds.add(x.id));
    (summary.hazard_zones || []).forEach((x: any) => validIds.add(x.id));
    (summary.power_feeders || []).forEach((x: any) => validIds.add(x.id));
    (summary.relays || []).forEach((x: any) => validIds.add(x.id));

    const checkVisibleIds = async (contextName: string) => {
      const pageText = await page.innerText('body');
      const matches = pageText.match(/\b(road_[a-z0-9_]+|hosp_[a-z0-9_]+|wtp_[a-z0-9_]+|tower_[a-z0-9_]+|depot_[a-z0-9_]+|int_[a-z0-9_]+|pf_[a-z0-9_]+)\b/g) || [];
      for (const entityId of matches) {
        expect(validIds.has(entityId), `Fabricated entity ID '${entityId}' found in ${contextName}`).toBe(true);
      }
    };

    await page.setViewportSize({ width: 1440, height: 900 });

    // --- Scene 1: The Golden Case (Live API) ---
    // Pick real f1 'road_ring_monastery_chandgiram' which produces BREACH cases
    await page.goto('/');
    await page.waitForSelector('.intersection-node', { timeout: 15000 });
    await page.locator('#corridor-select').selectOption('road_ring_monastery_chandgiram');
    await page.locator('#run-sweep-btn').click();
    await page.waitForSelector('.case-row', { timeout: 60000 });

    const breachRow = page.locator('.case-row:has-text("BREACH")').first();
    await expect(breachRow).toBeVisible();
    await breachRow.click();
    await page.locator('#frame-step-1').click();
    await page.waitForTimeout(400);

    await checkVisibleIds('Scene 1');
    await page.screenshot({ path: path.join(demoDir, 'scene1_golden_case.png') });

    // --- Scene 2: The Abstention (Live API) ---
    // Real run on road_ring_kashmere_monastery returns abstain=true, reason NO_PLAN_PRESERVES_ALL_CRITICAL_REQUIREMENTS
    await page.locator('#corridor-select').selectOption('road_ring_kashmere_monastery');
    await page.locator('#run-sweep-btn').click();
    await page.waitForSelector('text=ABSTAIN — NO ROBUST PLAN', { timeout: 60000 });

    // Fail loudly if abstention or required reason code is missing
    const reasonText = page.locator('text=NO_PLAN_PRESERVES_ALL_CRITICAL_REQUIREMENTS');
    await expect(reasonText, 'Expected live run to return NO_PLAN_PRESERVES_ALL_CRITICAL_REQUIREMENTS').toBeVisible();
    await expect(page.locator('#approve-action-btn')).toBeDisabled();
    // The right rail scrolls; the ABSTAIN body sits below the fold on first paint.
    // Bring the decision block into view so the still shows the full reasoning
    // rather than a sentence cut mid-clause. The component is not at fault -- the
    // capture was.
    await page.locator('#abstention-body-text').evaluate((el) =>
      el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(250);
    await checkVisibleIds('Scene 2');
    await page.screenshot({ path: path.join(demoDir, 'scene2_abstention.png') });

    // --- Scene 3: The Null-Result / Tie (Live Main Path) ---
    await page.goto('/');
    await page.waitForSelector('#null-result-panel', { timeout: 15000 });
    await expect(page.locator('#null-result-panel')).toBeVisible();
    await checkVisibleIds('Scene 3');
    await page.screenshot({ path: path.join(demoDir, 'scene3_null_result.png') });

    // --- Still: 503 Service Unavailable (Forced Mock State) ---
    await page.route('/api/health', async (route) => route.fulfill({ status: 503, json: { error: 'DATABASE_UNAVAILABLE' } }));
    await page.goto('/');
    await expect(page.locator('#db-unavailable-banner')).toBeVisible();
    await page.screenshot({ path: path.join(demoDir, 'still_503_unavailable.png') });
    await page.unroute('/api/health');

    // --- Still: Method & Architecture Provenance (Live API) ---
    await page.goto('/method');
    await page.waitForSelector('h1', { timeout: 15000 });
    await checkVisibleIds('Method View');
    await page.screenshot({ path: path.join(demoDir, 'still_method_provenance.png') });
  });
});
