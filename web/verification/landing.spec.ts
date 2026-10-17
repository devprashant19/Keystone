import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Landing Page — Z1 & Z2 Verification Battery', () => {
  const landingDir = path.resolve('verification/landing');

  test.beforeAll(() => {
    if (!fs.existsSync(landingDir)) {
      fs.mkdirSync(landingDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Mask navigator.webdriver so the app renders the landing page on '/' by default
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
  });

  test('Z1-01: Viewport fit & zero scrollbar on first paint at 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('#landing-dashboard', { timeout: 15000 });
    await expect(page.locator('#landing-dashboard')).toBeVisible();
    await expect(page.locator('#landing-provenance-strip')).toBeVisible();

    // Verify no vertical scrollbar on first paint at 1440x900
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight, 'Landing page should fit 1440x900 without vertical scrollbar').toBeLessThanOrEqual(clientHeight);

    await page.screenshot({ path: path.join(landingDir, 'landing-1440x900.png') });
  });

  test('Z1-02: Viewport fit & visual capture at 1280x800 and 1920x1080', async ({ page }) => {
    // 1280x800
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForSelector('#landing-dashboard', { timeout: 15000 });
    await page.screenshot({ path: path.join(landingDir, 'landing-1280x800.png') });

    // 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('#landing-dashboard', { timeout: 15000 });
    await page.screenshot({ path: path.join(landingDir, 'landing-1920x1080.png') });
  });

  test('Z2-01: Headline, live API counters, capability cards, and provenance strip', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('#landing-dashboard', { timeout: 15000 });

    // 1. Headline
    const headline = page.locator('#landing-dashboard h1');
    await expect(headline).toBeVisible();
    await expect(headline).toHaveText('Find what breaks before it breaks you.');

    // 2. Fetch live summary from API to assert live wiring
    const summaryRes = await page.request.get('http://127.0.0.1:8000/api/world/summary');
    expect(summaryRes.ok()).toBe(true);
    const summary = await summaryRes.json();

    const expectedCorridors = (summary.corridors || []).length.toString();
    const expectedTopology = `${summary.node_count || 60} / ${summary.edge_count || 100}`;

    await expect(page.locator('#counter-corridors .mono')).toHaveText(expectedCorridors);
    await expect(page.locator('#counter-scenarios .mono')).toHaveText('182');
    await expect(page.locator('#counter-entities .mono')).toHaveText(expectedTopology);

    // 3. Three Capability Cards
    await expect(page.locator('#card-cross-layer')).toBeVisible();
    await expect(page.locator('#card-counterfactual')).toBeVisible();
    await expect(page.locator('#card-scientific-honesty')).toBeVisible();

    // 4. Single Honest Provenance Strip
    const strip = page.locator('#landing-provenance-strip');
    await expect(strip).toBeVisible();
    await expect(strip).toContainText('Real Delhi arterial geometry, MIT-licensed. Power and telecom layers synthetic and labelled.');
    await expect(strip).toContainText('FalkorDB 6.0.2');
    await expect(strip).toContainText('DIGEST:');
  });

  test('Z2-02: BREAK SOMETHING launches Command Deck on golden scenario', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('#break-something-btn', { timeout: 15000 });

    await page.locator('#break-something-btn').click();
    await page.waitForSelector('#command-deck-main', { timeout: 15000 });
    await page.waitForSelector('.case-row', { timeout: 15000 });

    // Assert golden scenario is loaded
    await expect(page.locator('#corridor-select')).toHaveValue('road_ring_monastery_chandgiram');
    await expect(page.locator('#blast-radius-panel')).toBeVisible();
  });

  test('Z2-03: axe-core accessibility audit on landing route (zero serious/critical)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('#landing-dashboard', { timeout: 15000 });

    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical, `axe violations found: ${JSON.stringify(seriousOrCritical, null, 2)}`).toEqual([]);
  });
});
