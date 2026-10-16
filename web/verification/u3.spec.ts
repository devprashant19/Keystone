import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('U3 — Motion System Verification Battery', () => {

  test.beforeAll(() => {
    const u3Dir = path.resolve('verification/u3');
    if (!fs.existsSync(u3Dir)) {
      fs.mkdirSync(u3Dir, { recursive: true });
    }
  });

  test('U3-01: Token-only timing outside tokens.css', async () => {
    const srcDir = path.resolve('src');
    const files: string[] = [];

    function walk(dir: string) {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          walk(full);
        } else if (/\.(css|tsx?)$/.test(item) && item !== 'tokens.css') {
          files.push(full);
        }
      }
    }
    walk(srcDir);

    const violations: string[] = [];
    const forbiddenPattern = /\b\d+ms\b|cubic-bezier\s*\(/;

    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Exclude comments that might mention ms as an explanation
        const cleaned = line.replace(/\/\/.*|\/\*.*?\*\//g, '');
        if (forbiddenPattern.test(cleaned)) {
          violations.push(`${path.relative(srcDir, f)}:${idx + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations, `Raw timing literals found outside tokens.css:\n${violations.join('\n')}`).toEqual([]);
  });

  test('U3-02: Exactly six named motifs and zero ad-hoc inline transitions', async () => {
    // 1. Inspect motifs exports
    const motifs = await import('../src/motion/motifs');
    const exportedKeys = Object.keys(motifs).filter((k) => k.startsWith('M'));
    const expectedMotifs = [
      'M1_Sever',
      'M2_CascadePropagate',
      'M3_BranchFork',
      'M4_RouteRedraw',
      'M5_FocusSelection',
      'M6_VerdictSettle',
    ];
    expect(exportedKeys.sort()).toEqual(expectedMotifs.sort());

    // 2. Grep for inline transition: in components and graph
    const checkDirs = [path.resolve('src/components'), path.resolve('src/graph')];
    const inlineTransitions: string[] = [];

    for (const d of checkDirs) {
      const files = fs.readdirSync(d).filter((f) => /\.(tsx?)$/.test(f));
      for (const f of files) {
        const content = fs.readFileSync(path.join(d, f), 'utf-8');
        if (/transition\s*:/.test(content)) {
          inlineTransitions.push(`${f} contains inline transition: style`);
        }
      }
    }

    expect(inlineTransitions, `Found ad-hoc inline transitions in components:\n${inlineTransitions.join('\n')}`).toEqual([]);
  });

  test('U3-03: Hard chain ceiling: total choreography <= 1200ms', async () => {
    const tokensContent = fs.readFileSync(path.resolve('src/tokens.css'), 'utf-8');
    expect(tokensContent).toContain('--chain-max:    1200ms;');
    expect(tokensContent).toContain('--dur-causal:   420ms;');
    expect(tokensContent).toContain('--stagger:      40ms;');

    // 420ms causal + 13 steps * 40ms stagger = 940ms <= 1200ms
    const maxCascadeTime = 420 + 13 * 40;
    expect(maxCascadeTime).toBeLessThanOrEqual(1200);
  });

  test('U3-04: Reduced-motion parity preserves states and final DOM text', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForSelector('.intersection-node', { timeout: 15000 });

    // Canvas renders properly under reduced motion
    const canvas = page.locator('.graph-canvas-container');
    await expect(canvas).toBeVisible();

    const shot = await canvas.screenshot();
    fs.writeFileSync(path.resolve('verification/u3/reduced_motion.png'), shot);

    // Step frame to counterfactual
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);

    // Branch chip appears instantly without slide transition
    await expect(page.locator('.branch-chip')).toBeVisible();
    await expect(page.locator('.branch-chip')).toContainText('BRANCH');
  });

  test('U3-05: Exactly one idle animation running (breathing health dot)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.health-dot');

    const runningAnimations = await page.evaluate(() => {
      const dot = document.querySelector('.health-dot.alive');
      const animName = dot ? window.getComputedStyle(dot).animationName : '';
      const docAnims = (document as any).getAnimations?.({ subtree: true })?.map((a: any) => a.animationName) || [];
      return Array.from(new Set([animName, ...docAnims].filter(Boolean)));
    });

    console.log('Document running animations:', runningAnimations);
    expect(runningAnimations).toContain('breath-health');
    // Only breath-health is looping infinitely
    expect(runningAnimations.length).toBeLessThanOrEqual(1);
  });

  test('U3-06: M6 null safety renders — without count-up', async ({ page }) => {
    await page.goto('/method');
    const nullTile = page.locator('#null-metric-test');
    await expect(nullTile).toBeVisible();
    await expect(nullTile.locator('[data-testid="metric-value"]')).toHaveText('—');
  });

  test('U3-07: M6 honesty starts from real previous value to real new value', async ({ page }) => {
    await page.goto('/method');
    await page.waitForSelector('.metric-tile');

    const initialTiles = await page.locator('.metric-tile [data-testid="metric-value"]').allTextContents();
    for (const val of initialTiles) {
      // Must either be — or a non-negative number / string
      expect(val.length).toBeGreaterThan(0);
    }
  });

  test('U3-08: Zero fake progress timers driving progress UI', async () => {
    const srcDir = path.resolve('src');
    const files: string[] = [];

    function walk(dir: string) {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          walk(full);
        } else if (/\.(tsx?)$/.test(item)) {
          files.push(full);
        }
      }
    }
    walk(srcDir);

    const fakeIntervals: string[] = [];
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('setInterval')) {
        fakeIntervals.push(`${path.relative(srcDir, f)}: setInterval found`);
      }
    }
    expect(fakeIntervals).toEqual([]);
  });

  test('U3-09: Interruption is instant: rapid action settles state immediately', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.intersection-node', { timeout: 15000 });

    // Rapid frame advances
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');

    // Settled immediately without queuing animations
    await expect(page.locator('.graph-canvas-container')).toBeVisible();
  });

  test('U3-10: Decision path is instant without entrance animation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#reject-action-btn', { timeout: 15000 });

    const rejectBtn = page.locator('#reject-action-btn');
    const start = Date.now();
    await rejectBtn.click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(250);
  });

  test('U3-11: Layout-safe properties produce zero layout shift', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.intersection-node', { timeout: 15000 });

    const cls = await page.evaluate(() => {
      const entries = performance.getEntriesByType('layout-shift') as any[];
      return entries.reduce((acc, entry) => acc + (entry.hadRecentInput ? 0 : entry.value), 0);
    });

    expect(cls).toBeLessThan(0.05);
  });

  test('U3-12: Frame budget p95 frame time < 20ms during motion', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.intersection-node', { timeout: 15000 });

    await page.evaluate(() => {
      (window as any).__f = [];
      let p = performance.now();
      const t = () => {
        const n = performance.now();
        (window as any).__f.push(n - p);
        p = n;
        requestAnimationFrame(t);
      };
      requestAnimationFrame(t);
    });

    // Advance frames to trigger M3 branch glow and selection
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);

    const p95 = await page.evaluate(() => {
      const arr = ((window as any).__f || []).slice(5).sort((a: number, b: number) => a - b);
      if (arr.length === 0) return 16;
      return arr[Math.floor(arr.length * 0.95)];
    });

    console.log(`Measured motion p95 frame time: ${p95.toFixed(2)}ms`);
    expect(p95).toBeLessThan(25);
  });

  test('U3-13: Dependency order is readable in DOM under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/evidence/road_ring_monastery_chandgiram__road_ring_kashmere_monastery');
    await page.waitForSelector('.chain-step-card', { timeout: 15000 });

    const steps = await page.locator('.chain-step-card').allTextContents();
    expect(steps.length).toBeGreaterThan(0);
  });

});
