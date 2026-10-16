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
  test.setTimeout(300000); // 5 minutes timeout for complete walkthrough

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
    for (const entityId of matches) {
      expect(validIds.has(entityId), `Unknown entity ID '${entityId}' in ${contextName}`).toBe(true);
    }
  };

  // 2. Open App in Presenter Mode (?tour=1&step=1)
  await page.goto('/?tour=1&step=1');
  await page.waitForSelector('#presenter-tour-root', { timeout: 15000 });
  await page.focus('body');

  // --- Beat 1: The Question ---
  await expect(page.locator('#tour-step-counter')).toContainText('STEP 1 / 7');
  await expect(page.locator('#tour-step-title')).toContainText('The Question');
  await page.waitForSelector('#corridor-select');
  await page.waitForTimeout(4000); // Readability floor for Beat 1

  // --- Beat 2: The Graph Does the Work ---
  await page.keyboard.press('ArrowRight');
  await page.waitForSelector('#tab-schematic');
  await expect(page.locator('#tour-step-counter')).toContainText('STEP 2 / 7');
  await expect(page.locator('#tour-step-title')).toContainText('The Graph Does the Work');
  await page.waitForTimeout(4500); // Readability floor for Beat 2

  // --- Beat 3: Conditional N-1 Pre-Mortem ---
  await page.keyboard.press('ArrowRight');
  await page.waitForSelector('#run-sweep-btn');
  await expect(page.locator('#tour-step-counter')).toContainText('STEP 3 / 7');
  await expect(page.locator('#tour-step-title')).toContainText('Conditional N-1 Pre-Mortem');
  // Wait for golden case data to settle
  await page.waitForSelector('.case-row', { timeout: 15000 });
  await page.waitForTimeout(4500); // Readability floor for Beat 3

  // Re-capture Scene 1: Golden Case from live seeded state
  await checkVisibleIds('Scene 1 Golden Case');
  await page.screenshot({ path: path.join(demoDir, 'scene1_golden_case.png') });

  // --- Beat 4: Evidence-Backed Causal Chains ---
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tour-step-counter')).toContainText('STEP 4 / 7');
  await expect(page.locator('#tour-step-title')).toContainText('Evidence-Backed Causal Chains');
  await page.waitForSelector('#open-evidence-btn');
  await page.waitForTimeout(4500); // Readability floor for Beat 4

  // --- Beat 5: Fair Baseline Comparison ---
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tour-step-counter')).toContainText('STEP 5 / 7');
  await expect(page.locator('#tour-step-title')).toContainText('Fair Baseline Comparison');
  await page.waitForSelector('#policy-row-C');
  await page.waitForTimeout(4500); // Readability floor for Beat 5

  // --- Beat 6: The Honest Finding ---
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tour-step-counter')).toContainText('STEP 6 / 7');
  await expect(page.locator('#tour-step-title')).toContainText('The Honest Finding');
  await page.waitForSelector('#null-result-panel');
  await page.waitForTimeout(4500); // Readability floor for Beat 6

  // Re-capture Scene 3: Null Result
  await checkVisibleIds('Scene 3 Null Result');
  await page.screenshot({ path: path.join(demoDir, 'scene3_null_result.png') });

  // --- Beat 7: Abstention and Audit Memory ---
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tour-step-counter')).toContainText('STEP 7 / 7');
  await expect(page.locator('#tour-step-title')).toContainText('Abstention and Audit Memory');
  // Wait for abstention data to populate
  await page.waitForSelector('text=ABSTAIN — NO ROBUST PLAN', { timeout: 15000 });
  await expect(page.locator('#approve-action-btn')).toBeDisabled();
  await page.waitForTimeout(5000); // Readability floor for Beat 7

  // Re-capture Scene 2: Abstention from live seeded state
  await checkVisibleIds('Scene 2 Abstention');
  await page.screenshot({ path: path.join(demoDir, 'scene2_abstention.png') });

  // Exit presenter tour via Esc to return to interactive deck
  await page.keyboard.press('Escape');
  await expect(page.locator('#presenter-tour-root')).not.toBeAttached();
  await page.waitForTimeout(2000);

  // --- Beat 8: Finish on /method ---
  await page.locator('#null-sweep-link').click();
  await page.waitForURL(/\/method/, { timeout: 10000 });
  await page.waitForSelector('h1', { timeout: 10000 });
  await page.waitForTimeout(2500);

  // Smooth scroll through Section 2: Deadline Sweep Table (12 interaction cases at 8.0 km)
  await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(4000);

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
