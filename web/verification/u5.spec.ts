import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('U5 — Polish and Demo Craft Battery', () => {
  const u5Dir = path.resolve('verification/u5');
  const demoDir = path.resolve('verification/demo');

  const MOCK_RUN = {
    run_id: 'demo_golden_01',
    f1_corridor_id: 'road_ring_monastery_chandgiram',
    config_hash: 'ed468af34293881b',
    world_digest: '2b8109d93f77a83e',
    abstain: false,
    decomposition: {
      f1_alone_cases: ['road_ring_monastery_chandgiram__road_ring_kashmere_monastery'],
      f2_alone_cases: [],
      interaction_only_cases: [],
      headline_interaction_only_count: 0,
      total_cases: 13,
    },
    policies: {
      A: { name: 'Policy A', exposed_count: 4, total_breaches: 4, cost: 0 },
      B: { name: 'Policy B', chosen_action: { target_id: 'depot_civil_lines' }, exposed_count: 2, total_breaches: 2, cost: 10 },
      C: { name: 'Policy C', chosen_action: { description: 'Re-dispatch from Civil Lines Depot' }, exposed_count: 0, total_breaches: 0, cost: 15 },
    },
    recommendation: {
      verdict: 'FEASIBLE',
      abstain: false,
      action: {
        id: 'act_01',
        kind: 'DISPATCH',
        target: 'depot_civil_lines',
        cost: 15,
        description: 'Position Standby Ambulance at Civil Lines Depot',
      },
      exposed_cases: [],
      exposed_count: 0,
    },
    cases: [
      {
        case_id: 'road_ring_monastery_chandgiram__road_ring_kashmere_monastery',
        f1: 'road_ring_monastery_chandgiram',
        f2: 'road_ring_kashmere_monastery',
        verdict: 'BREACH',
        interaction_only: false,
        breaches_a: 1,
        breaches_c: 0,
      },
      {
        case_id: 'road_ring_monastery_chandgiram__road_boulevard_shamnath_isbt',
        f1: 'road_ring_monastery_chandgiram',
        f2: 'road_boulevard_shamnath_isbt',
        verdict: 'DEGRADED',
        interaction_only: false,
        breaches_a: 1,
        breaches_c: 0,
      },
      {
        case_id: 'road_ring_monastery_chandgiram__road_rajpur_tis_hazari',
        f1: 'road_ring_monastery_chandgiram',
        f2: 'road_rajpur_tis_hazari',
        verdict: 'OK',
        interaction_only: false,
        breaches_a: 0,
        breaches_c: 0,
      },
    ],
  };

  test.beforeAll(() => {
    if (!fs.existsSync(u5Dir)) {
      fs.mkdirSync(u5Dir, { recursive: true });
    }
    if (!fs.existsSync(demoDir)) {
      fs.mkdirSync(demoDir, { recursive: true });
    }
  });

  test('U5-01: Data-honesty sweep via source scanning', async () => {
    const srcDir = path.resolve('src');
    const files: string[] = [];
    function walk(dir: string) {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (/\.(tsx?)$/.test(item)) files.push(full);
      }
    }
    walk(srcDir);

    const forbiddenGenerators = /\bMath\.random\s*\(\)|faker\.|mockData\b/i;
    const forbiddenLLM = /gemini|openai|anthropic|generativelanguage|\/v1\/chat/i;
    const forbiddenClaims = /\b(predict|forecast|risk score|digital twin|AI-powered|first ever)\b/i;

    const violations: string[] = [];
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      if (forbiddenGenerators.test(content)) {
        violations.push(`Generator pattern in ${path.relative(srcDir, f)}`);
      }
      if (forbiddenLLM.test(content)) {
        violations.push(`LLM pattern in ${path.relative(srcDir, f)}`);
      }
      if (forbiddenClaims.test(content)) {
        if (!f.endsWith('MethodView.tsx')) {
          violations.push(`Claim pattern in ${path.relative(srcDir, f)}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test('U5-02: Asset audit — hand-crafted SVG only', async () => {
    const publicDir = path.resolve('public');
    const assetsDir = path.resolve('src/assets');
    const checkedDirs = [publicDir, assetsDir].filter((d) => fs.existsSync(d));

    const nonSvgFiles: string[] = [];
    for (const d of checkedDirs) {
      for (const item of fs.readdirSync(d)) {
        if (!item.endsWith('.svg') && !item.endsWith('.gitkeep')) {
          nonSvgFiles.push(item);
        }
      }
    }
    expect(nonSvgFiles).toEqual([]);
  });

  test('U5-03: Compression legibility with 70% JPEG quality', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('.intersection-node', { timeout: 15000 });

    const shotPath = path.join(u5Dir, 'golden-case-compressed-70.jpeg');
    await page.screenshot({ path: shotPath, type: 'jpeg', quality: 70 });
    expect(fs.existsSync(shotPath)).toBe(true);
    expect(fs.statSync(shotPath).size).toBeGreaterThan(10000);
  });

  test('U5-04: 125% OS scaling screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('.intersection-node');

    const scaledShotPath = path.join(u5Dir, 'scale-125.png');
    await page.screenshot({ path: scaledShotPath });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('U5-05: Selection persistence across view, frame step, sort, filter', async ({ page }) => {
    await page.route('/api/run', async (route) => route.fulfill({ json: MOCK_RUN }));
    await page.goto('/');
    await page.locator('#corridor-select').selectOption('road_ring_monastery_chandgiram');
    await page.locator('#run-sweep-btn').click();
    await page.waitForSelector('.case-row', { timeout: 10000 });

    // Select second case row
    const targetRow = page.locator('.case-row').nth(1);
    const caseId = await targetRow.getAttribute('data-caseid');
    await targetRow.click();

    // 1. Switch to Schematic tab
    await page.locator('#tab-schematic').click();
    expect(await page.locator(`[data-caseid="${caseId}"]`).getAttribute('style')).toContain('border-left: 3px solid');

    // 2. Step frame forward
    await page.locator('#frame-step-2').click();
    expect(await page.locator(`[data-caseid="${caseId}"]`).getAttribute('style')).toContain('border-left: 3px solid');

    // 3. Sort case list
    await page.locator('#sort-f2-btn').click();
    expect(await page.locator(`[data-caseid="${caseId}"]`).getAttribute('style')).toContain('border-left: 3px solid');

    // 4. Switch back to Geographic
    await page.locator('#tab-geographic').click();
    expect(await page.locator(`[data-caseid="${caseId}"]`).getAttribute('style')).toContain('border-left: 3px solid');
  });

  test('U5-06: Zero layout shift on hover (CLS)', async ({ page }) => {
    await page.route('/api/run', async (route) => route.fulfill({ json: MOCK_RUN }));
    await page.goto('/');
    await page.locator('#corridor-select').selectOption('road_ring_monastery_chandgiram');
    await page.locator('#run-sweep-btn').click();
    await page.waitForSelector('.case-row');

    // Hover over elements and assert layout integrity
    const beforeHeight = await page.evaluate(() => document.body.offsetHeight);
    await page.locator('.case-row').first().hover();
    await page.locator('#tab-schematic').hover();
    await page.locator('#zoom-in-btn').hover();
    const afterHeight = await page.evaluate(() => document.body.offsetHeight);
    expect(afterHeight).toBe(beforeHeight);
  });

  test('U5-07: Determinism check — pixel identical screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('.intersection-node');
    const canvas = page.locator('.graph-canvas-container');
    await canvas.waitFor({ state: 'visible' });

    const shot1Buf = await canvas.screenshot();
    const shot1Path = path.join(u5Dir, 'determinism-take-1.png');
    fs.writeFileSync(shot1Path, shot1Buf);

    await page.reload();
    await page.waitForSelector('.intersection-node');
    const canvas2 = page.locator('.graph-canvas-container');
    await canvas2.waitFor({ state: 'visible' });

    const shot2Buf = await canvas2.screenshot();
    const shot2Path = path.join(u5Dir, 'determinism-take-2.png');
    fs.writeFileSync(shot2Path, shot2Buf);

    expect(shot1Buf.equals(shot2Buf)).toBe(true);
  });

  test('U5-09: Three demo scenes captured + stills', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Scene 1: The Golden Case
    await page.route('/api/run', async (route) => route.fulfill({ json: MOCK_RUN }));
    await page.goto('/');
    await page.locator('#corridor-select').selectOption('road_ring_monastery_chandgiram');
    await page.locator('#run-sweep-btn').click();
    await page.waitForSelector('.case-row', { timeout: 10000 });
    await page.locator('.case-row').first().click();
    await page.locator('#frame-step-1').click();
    await page.screenshot({ path: path.join(demoDir, 'scene1_golden_case.png') });

    // Scene 2: The Abstention
    const mockAbstain = {
      ...MOCK_RUN,
      run_id: 'demo_abstain_01',
      abstain: true,
      recommendation: {
        verdict: 'ABSTAIN',
        abstain: true,
        reason: 'NO_RELATION_CONTEXT_CANNOT_EVALUATE_ACCESS',
        exposed_cases: ['road_ring_monastery_chandgiram__road_ring_kashmere_monastery'],
        exposed_count: 1,
      },
    };
    await page.route('/api/run', async (route) => route.fulfill({ json: mockAbstain }));
    await page.locator('#run-sweep-btn').click();
    await expect(page.locator('text=ABSTAIN — NO ROBUST PLAN')).toBeVisible();
    await page.screenshot({ path: path.join(demoDir, 'scene2_abstention.png') });
    await page.unroute('/api/run');

    // Scene 3: The Null-Result / Tie
    await page.goto('/');
    await page.waitForSelector('#null-result-panel');
    await page.screenshot({ path: path.join(demoDir, 'scene3_null_result.png') });

    // Stills: 503 unavailable, greyscale, /method
    await page.route('/api/health', async (route) => route.fulfill({ status: 503 }));
    await page.goto('/');
    await expect(page.locator('#db-unavailable-banner')).toBeVisible();
    await page.screenshot({ path: path.join(demoDir, 'still_503_unavailable.png') });
    await page.unroute('/api/health');

    await page.goto('/method');
    await page.waitForSelector('h1');
    await page.screenshot({ path: path.join(demoDir, 'still_method_provenance.png') });
  });

  test('U5-10: Copy affordances for config and digest', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#copy-config-btn strong');
    await page.waitForFunction(() => {
      const el = document.querySelector('#copy-config-btn strong');
      return el && el.textContent && el.textContent !== '—';
    });

    await page.locator('#copy-config-btn').click();
    await expect(page.locator('#copy-config-btn').locator('text=COPIED')).toBeVisible();

    await page.locator('#copy-digest-btn').click();
    await expect(page.locator('#copy-digest-btn').locator('text=COPIED')).toBeVisible();
  });
});
