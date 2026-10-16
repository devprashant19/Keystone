import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Presenter Mode & Walkthrough Verification Battery (Steps D-2 & D-3)', () => {
  const screenshotsDir = path.resolve('verification/presenter');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('Presenter Tour: Enter from Header button and deep-link verification', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('#start-tour-btn');

    // Click "Guided tour" button in Header
    await page.click('#start-tour-btn');
    await expect(page.locator('#presenter-tour-root')).toBeVisible();
    await expect(page.locator('#tour-step-counter')).toContainText('STEP 1 / 7');
    await expect(page).toHaveURL(/\?tour=1&step=1/);

    // Deep link to step 4
    await page.goto('/?tour=1&step=4');
    await expect(page.locator('#presenter-tour-root')).toBeVisible();
    await expect(page.locator('#tour-step-counter')).toContainText('STEP 4 / 7');
    await expect(page.locator('#tour-step-title')).toContainText('Evidence-Backed Causal Chains');
  });

  test('Presenter Tour: Keyboard-only navigation across all 7 steps at 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?tour=1&step=1');
    await page.waitForSelector('#presenter-tour-root');
    await page.focus('body');

    const expectedTitles = [
      'The Question',
      'The Graph Does the Work',
      'Conditional N-1 Pre-Mortem',
      'Evidence-Backed Causal Chains',
      'Fair Baseline Comparison',
      'The Honest Finding',
      'Abstention and Audit Memory',
    ];

    for (let step = 1; step <= 7; step++) {
      // Assert step counter
      await expect(page.locator('#tour-step-counter')).toContainText(`STEP ${step} / 7`);

      // Assert title & narration present
      await expect(page.locator('#tour-step-title')).toContainText(expectedTitles[step - 1]);
      const narrationText = await page.locator('#tour-step-narration').textContent();
      expect(narrationText && narrationText.length > 20).toBeTruthy();

      // Assert card is visible and anchored
      await expect(page.locator('#tour-narration-card')).toBeVisible();

      // Assert spotlight mask is rendering
      await expect(page.locator('#tour-spotlight-mask')).toBeAttached();

      // Capture verified step screenshot
      await page.screenshot({ path: path.join(screenshotsDir, `step_${step}.png`) });

      // Navigate to next step using keyboard ArrowRight (or exit if at step 7)
      if (step < 7) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200); // Allow M7 step transition to settle
      }
    }

    // Press Escape to exit tour
    await page.keyboard.press('Escape');
    await expect(page.locator('#presenter-tour-root')).not.toBeAttached();

    // Verify deck is fully usable after exiting
    await expect(page.locator('#corridor-select')).toBeEnabled();
  });

  test('Presenter Tour: Reduced-motion parity preserves states and final text', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?tour=1&step=1');
    await page.waitForSelector('#presenter-tour-root');
    await page.focus('body');

    // Verify CSS transitions are disabled under reduced motion
    const cardTransition = await page.$eval('#tour-narration-card', (el) => {
      return window.getComputedStyle(el).transition;
    });
    expect(cardTransition === 'none' || cardTransition.includes('none')).toBeTruthy();

    for (let step = 1; step <= 7; step++) {
      await expect(page.locator('#tour-step-counter')).toContainText(`STEP ${step} / 7`);
      await page.screenshot({ path: path.join(screenshotsDir, `reduced_motion_step_${step}.png`) });
      if (step < 7) {
        await page.keyboard.press('ArrowRight');
      }
    }

    await page.keyboard.press('Escape');
    await expect(page.locator('#presenter-tour-root')).not.toBeAttached();
  });

  test('Presenter Tour: M7 frame budget p95 frame time < 20ms during step transition', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?tour=1&step=1');
    await page.waitForSelector('#presenter-tour-root');
    await page.waitForSelector('.intersection-node', { timeout: 15000 });

    // Measure requestAnimationFrame delta times during M7 transitions
    const frameTimes: number[] = await page.evaluate(async () => {
      const deltas: number[] = [];
      let lastTime = performance.now();
      let collecting = true;

      const loop = (time: number) => {
        if (!collecting) return;
        deltas.push(time - lastTime);
        lastTime = time;
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);

      // Trigger 3 transitions
      const nextBtn = document.querySelector('#tour-next-btn') as HTMLButtonElement | null;
      for (let i = 0; i < 3; i++) {
        if (nextBtn) nextBtn.click();
        await new Promise((r) => setTimeout(r, 200));
      }

      collecting = false;
      return deltas;
    });

    const validFrames = frameTimes.slice(5).sort((a, b) => a - b);
    expect(validFrames.length).toBeGreaterThan(15);
    const p95 = validFrames[Math.floor(validFrames.length * 0.95)];
    console.log(`Measured M7 p95 frame time: ${p95.toFixed(2)}ms`);
    expect(p95).toBeLessThan(20);
  });
});
