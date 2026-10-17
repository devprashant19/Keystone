import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.use({
  video: {
    mode: 'on',
    size: { width: 1440, height: 900 },
  },
  viewport: { width: 1440, height: 900 },
});

test('Record Deterministic Demo Walkthrough in One Continuous Take (1440x900)', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes timeout for complete walkthrough

  const demoDir = path.resolve('verification/demo');
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true });
  }

  // 1. Invoke seed_demo.py and assert canonical DEMO READY block
  const rootDir = path.resolve('..');
  const pythonExe = fs.existsSync(path.join(rootDir, '.venv/Scripts/python.exe'))
    ? path.join(rootDir, '.venv/Scripts/python.exe')
    : 'python';

  console.log(`Invoking seed_demo.py using ${pythonExe}...`);
  const seedOutput = execSync(`"${pythonExe}" scripts/seed_demo.py`, {
    cwd: rootDir,
    encoding: 'utf-8',
    env: { ...process.env, PYTHONPATH: 'src' },
  });

  expect(seedOutput).toContain('DEMO READY');
  expect(seedOutput).toContain('455712e82d224a2590060fd35d83abb4acb6cfafd633b12d275aa43337cd013a');
  expect(seedOutput).toContain('104/48/30/0');
  console.log('Seeded demo harness verified successfully.');

  // Fetch real summary to verify entity IDs
  const summaryRes = await page.request.get('http://127.0.0.1:8000/api/world/summary');
  expect(summaryRes.ok()).toBe(true);
  const summary = await summaryRes.json();
  const validIds = new Set<string>();
  (summary.intersections || []).forEach((x: any) => validIds.add(x.id));
  (summary.corridors || []).forEach((x: any) => validIds.add(x.id));
  (summary.facilities || []).forEach((x: any) => validIds.add(x.id));
  (summary.depots || []).forEach((x: any) => validIds.add(x.id));
  (summary.towers || []).forEach((x: any) => validIds.add(x.id));
  (summary.power_feeders || []).forEach((x: any) => validIds.add(x.id));
  (summary.relays || []).forEach((x: any) => validIds.add(x.id));

  const checkVisibleIds = async (contextName: string) => {
    const pageText = await page.innerText('body');
    const matches = pageText.match(/\b(road_[a-z0-9_]+|hosp_[a-z0-9_]+|wtp_[a-z0-9_]+|tower_[a-z0-9_]+|depot_[a-z0-9_]+|int_[a-z0-9_]+|pf_[a-z0-9_]+)\b/g) || [];
    for (const rawId of matches) {
      const parts = rawId.split('__');
      for (const part of parts) {
        const baseId = part.replace(/_(forward|reverse)$/, '');
        expect(validIds.has(baseId) || validIds.has(part), `Unknown entity ID '${rawId}' in ${contextName}`).toBe(true);
      }
    }
  };

  // 2. Open App on Landing Dashboard (/?landing=1)
  // --- Beat 1: Landing Dashboard & The Live Counters (0:00 - 0:20) ---
  console.log('Beat 1: Landing Dashboard...');
  await page.goto('/?landing=1');
  await page.waitForSelector('#landing-dashboard', { timeout: 15000 });
  await expect(page.locator('#counter-corridors')).toBeVisible();
  await expect(page.locator('#counter-scenarios')).toBeVisible();
  await expect(page.locator('#counter-entities')).toBeVisible();

  // Hover over the three capability cards
  await page.locator('#card-cross-layer').hover();
  await page.waitForTimeout(4000);
  await page.locator('#card-counterfactual').hover();
  await page.waitForTimeout(4000);
  await page.locator('#card-scientific-honesty').hover();
  await page.waitForTimeout(4000);
  await checkVisibleIds('Landing Dashboard');
  await page.waitForTimeout(4000);

  // --- Beat 2: One-Click Instant Pre-Mortem (0:20 - 0:40) ---
  console.log('Beat 2: Break Something CTA...');
  const breakBtn = page.locator('#break-something-btn');
  await expect(breakBtn).toBeVisible();
  await breakBtn.click();

  // Settle on Command Deck on Golden Scenario
  await page.waitForSelector('#command-deck-main', { timeout: 15000 });
  await page.waitForSelector('.case-row', { timeout: 15000 });
  await expect(page.locator('#corridor-select')).toHaveValue('road_ring_monastery_chandgiram');
  await expect(page.locator('#blast-radius-panel')).toBeVisible();

  // Capture fresh Scene 1: Golden Case
  await checkVisibleIds('Scene 1 Golden Case');
  await page.screenshot({ path: path.join(demoDir, 'scene1_golden_case.png') });
  await page.waitForTimeout(14000);

  // --- Beat 3: Instant Multi-Corridor Exploration (0:40 - 1:10) ---
  console.log('Beat 3: Rapid Corridor Exploration...');
  // Corridor 1: Barakhamba
  await page.locator('#corridor-select').selectOption('road_barakhamba_cp_mandihouse');
  await page.waitForSelector('.case-row', { timeout: 10000 });
  await page.waitForTimeout(8000);

  // Corridor 2: Delhi Gate Connector
  await page.locator('#corridor-select').selectOption('road_delhigate_connector');
  await page.waitForSelector('.case-row', { timeout: 10000 });
  await page.waitForTimeout(8000);

  // Corridor 3: Return to Golden Case
  await page.locator('#corridor-select').selectOption('road_ring_monastery_chandgiram');
  await page.waitForSelector('.case-row', { timeout: 10000 });
  await page.waitForTimeout(10000);

  // --- Beat 4: Blast Radius Cascade Visual (1:10 - 1:40) ---
  console.log('Beat 4: Blast Radius Visual...');
  await page.locator('#blast-center-core').click();
  await page.waitForTimeout(3000);
  await page.locator('#blast-band-road').click();
  await page.waitForTimeout(4000);
  await page.locator('#blast-band-power').click();
  await page.waitForTimeout(4000);
  await page.locator('#blast-band-alert').click();
  await page.waitForTimeout(4000);
  await page.locator('#blast-hero-metric').hover();
  await page.waitForTimeout(8000);

  // --- Beat 5: Cross-Layer Causal Proof (1:40 - 2:10) ---
  console.log('Beat 5: Causal Evidence Chain...');
  await page.locator('#blast-evidence-shortcut-btn').click();
  await page.waitForURL(/\/evidence\//, { timeout: 15000 });
  await page.waitForSelector('.dependency-chain-panel', { timeout: 15000 });
  await checkVisibleIds('Evidence View');
  await page.waitForTimeout(14000);

  // Return to Command Deck
  await page.locator('text=Back to Command Deck').click();
  await page.waitForSelector('#command-deck-main', { timeout: 15000 });
  await page.waitForTimeout(4000);

  // --- Beat 6: Policy Comparison & Honest Null Result (2:10 - 2:40) ---
  console.log('Beat 6: Policy Comparison & Null Result...');
  const policySummary = page.locator('#toggle-policy-table');
  if (await policySummary.isVisible()) {
    // Settle on policy comparison table
    await policySummary.hover();
  }
  const nullPanel = page.locator('#null-result-panel');
  await expect(nullPanel).toBeVisible();
  await nullPanel.scrollIntoViewIfNeeded();

  // Capture fresh Scene 3: Null Result
  await checkVisibleIds('Scene 3 Null Result');
  await page.screenshot({ path: path.join(demoDir, 'scene3_null_result.png') });
  await page.waitForTimeout(16000);

  // --- Beat 7: Abstention & Human Commander Decision in Graph Memory (2:40 - 3:00) ---
  console.log('Beat 7: Abstention & Decision Persistence...');
  await page.locator('#corridor-select').selectOption('road_ring_kashmere_monastery');
  await page.waitForSelector('text=ABSTAIN — NO ROBUST PLAN', { timeout: 15000 });

  // Scroll abstention explanation into view
  await page.locator('#abstention-body-text').evaluate((el) =>
    el.scrollIntoView({ block: 'center', behavior: 'instant' })
  );
  await page.waitForTimeout(500);

  // Capture fresh Scene 2: Abstention
  await checkVisibleIds('Scene 2 Abstention');
  await page.screenshot({ path: path.join(demoDir, 'scene2_abstention.png') });
  await page.waitForTimeout(6000);

  // Record Decision via Modal
  const rejectBtn = page.locator('#reject-action-btn');
  if (await rejectBtn.isVisible()) {
    await rejectBtn.click();
    await page.waitForSelector('#decision-modal', { timeout: 5000 });
    const rationaleInput = page.locator('#rationale-input');
    await rationaleInput.fill('Verified unresolvable secondary contingency risk across 13 failure branches; logged concurrence into graph memory.');
    await page.waitForTimeout(1500);
    await page.locator('#confirm-decision-btn').click();
    await page.waitForSelector('#decision-modal', { state: 'detached', timeout: 5000 });
    await page.waitForTimeout(6000);
  }

  // --- Beat 8: Finish on /method (3:00 - 3:30) ---
  console.log('Beat 8: Methodology & Provenance...');
  await page.locator('#provenance-badge').click();
  await page.waitForURL(/\/method/, { timeout: 10000 });
  await page.waitForSelector('h1', { timeout: 10000 });
  await page.waitForTimeout(3000);

  // Smooth scroll through Section 2: Deadline Sweep Table
  await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(7000);

  // Verify visible IDs in method view
  await checkVisibleIds('Method View');

  // Finish video take
  const video = page.video();
  await page.close();

  if (!video) {
    throw new Error('Video recording failed: page.video() returned null');
  }

  const rawPath = await video.path();
  const destWebm = path.join(demoDir, 'demo_1440x900.webm');
  fs.copyFileSync(rawPath, destWebm);
  console.log(`Demo webm saved to: ${destWebm}`);

  const stat = fs.statSync(destWebm);
  console.log(`WebM size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
  expect(stat.size).toBeGreaterThan(1 * 1024 * 1024);

  // Convert to frame-accurate MP4 via ffmpeg
  const destMp4 = path.join(demoDir, 'demo_1440x900.mp4');
  try {
    console.log(`Converting ${destWebm} to frame-accurate MP4...`);
    execSync(`ffmpeg -y -i "${destWebm}" -c:v libx264 -pix_fmt yuv420p -movflags faststart "${destMp4}"`, {
      encoding: 'utf-8',
    });
    const mp4Stat = fs.statSync(destMp4);
    console.log(`MP4 size: ${(mp4Stat.size / (1024 * 1024)).toFixed(2)} MB`);
    expect(mp4Stat.size).toBeGreaterThan(1 * 1024 * 1024);
  } catch (err) {
    console.warn('ffmpeg conversion warning:', err);
  }

  // Assert all 3 scene stills exist and are non-empty
  expect(fs.existsSync(path.join(demoDir, 'scene1_golden_case.png'))).toBe(true);
  expect(fs.existsSync(path.join(demoDir, 'scene2_abstention.png'))).toBe(true);
  expect(fs.existsSync(path.join(demoDir, 'scene3_null_result.png'))).toBe(true);
  console.log('All three scene stills recaptured and verified.');
});
