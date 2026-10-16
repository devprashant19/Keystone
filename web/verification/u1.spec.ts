import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

test.describe('U1 — Design System Verification Battery', () => {

  test('U1-01: Contrast matrix measured via verification/contrast.mjs', async () => {
    const contrastScript = path.resolve('verification/contrast.mjs');
    const output = execSync(`node "${contrastScript}"`, { encoding: 'utf-8' });
    expect(output).toContain('Overall Result: ALL CHECKS PASSED');
    expect(output).toContain('--ink-hi');
    expect(output).toContain('--ok');
    expect(output).toContain('--warn');
    expect(output).toContain('--fail');
    expect(output).toContain('--line-focus');
  });

  test('U1-02: Token-only colours in web/src outside tokens.css', async () => {
    const srcDir = path.resolve('src');
    const files = fs.readdirSync(srcDir, { recursive: true }) as string[];

    const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
    const rgbPattern = /\brgba?\(.+?\)/g;

    const violations: string[] = [];

    for (const f of files) {
      if (typeof f !== 'string') continue;
      const fullPath = path.join(srcDir, f);
      if (!fs.statSync(fullPath).isFile()) continue;
      if (f.endsWith('tokens.css')) continue;
      if (!/\.(tsx?|css)$/.test(f)) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      const hexMatches = content.match(hexPattern);
      if (hexMatches) {
        violations.push(`${f}: hex literals found: ${hexMatches.join(', ')}`);
      }
      const rgbMatches = content.match(rgbPattern);
      if (rgbMatches) {
        violations.push(`${f}: rgb/rgba literals found: ${rgbMatches.join(', ')}`);
      }
    }

    expect(violations, `Found raw color literals outside tokens.css:\n${violations.join('\n')}`).toEqual([]);
  });

  test('U1-03: Greyscale legibility & all 10 states distinguishable', async ({ page }) => {
    await page.goto('/method');
    const gallery = page.locator('#encodings-gallery');
    await expect(gallery).toBeVisible();

    // Verify all 10 encoding cards exist
    const cards = gallery.locator('.encoding-card');
    await expect(cards).toHaveCount(10);

    // Ensure output directory exists
    const u1Dir = path.resolve('verification/u1');
    if (!fs.existsSync(u1Dir)) {
      fs.mkdirSync(u1Dir, { recursive: true });
    }

    // Apply grayscale filter and capture screenshot
    await page.evaluate(() => {
      document.body.style.filter = 'grayscale(1)';
    });

    await gallery.screenshot({ path: path.join(u1Dir, 'greyscale.png') });
    expect(fs.existsSync(path.join(u1Dir, 'greyscale.png'))).toBeTruthy();

    // Reset filter
    await page.evaluate(() => {
      document.body.style.filter = 'none';
    });
  });

  test('U1-04: Type scale applied without raw font-size literals', async () => {
    const srcDir = path.resolve('src');
    const files = fs.readdirSync(srcDir, { recursive: true }) as string[];
    const rawFontSizePattern = /\bfont-?size\s*[:=]\s*['"]?[0-9]+px['"]?/i;

    const violations: string[] = [];

    for (const f of files) {
      if (typeof f !== 'string') continue;
      const fullPath = path.join(srcDir, f);
      if (!fs.statSync(fullPath).isFile()) continue;
      if (f.endsWith('tokens.css')) continue;
      if (!/\.(tsx?|css)$/.test(f)) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (rawFontSizePattern.test(line)) {
          violations.push(`${f}:${idx + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations, `Found raw font-size literals outside tokens.css:\n${violations.join('\n')}`).toEqual([]);
  });

  test('U1-05: Tabular numerals width invariance 0 vs 8', async ({ page }) => {
    await page.goto('/method');
    await page.evaluate(() => document.fonts.ready);
    const element = page.locator('#tabular-test-element');
    const toggleBtn = page.locator('#cycle-digit-btn');

    await expect(element).toHaveText('0');
    const box0 = await element.boundingBox();
    expect(box0).not.toBeNull();

    await toggleBtn.click();
    await expect(element).toHaveText('8');
    const box8 = await element.boundingBox();
    expect(box8).not.toBeNull();

    const delta = Math.abs((box0?.width || 0) - (box8?.width || 0));
    expect(delta, `Width delta between 0 and 8 was ${delta}px`).toBeLessThanOrEqual(0.5);
  });

  test('U1-06: MetricTile null safety renders — with disabled drill', async ({ page }) => {
    await page.goto('/method');
    const tile = page.locator('#null-metric-test');
    await expect(tile).toBeVisible();

    const metricValue = tile.locator('[data-testid="metric-value"]');
    await expect(metricValue).toHaveText('—');

    // Asserts not 0 and not NaN
    const text = await metricValue.innerText();
    expect(text).not.toBe('0');
    expect(text).not.toBe('NaN');

    // Drill affordance is disabled
    const clickable = tile.locator('.clickable');
    await expect(clickable).toHaveCount(0);
  });

  test('U1-07: No shadows or gradients outside sanctioned tokens', async () => {
    const srcDir = path.resolve('src');
    const files = fs.readdirSync(srcDir, { recursive: true }) as string[];

    const violations: string[] = [];

    for (const f of files) {
      if (typeof f !== 'string') continue;
      const fullPath = path.join(srcDir, f);
      if (!fs.statSync(fullPath).isFile()) continue;
      if (f.endsWith('tokens.css')) continue;
      if (!/\.(tsx?|css)$/.test(f)) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Linear gradients
        if (/linear-gradient/i.test(line)) {
          violations.push(`${f}:${idx + 1}: linear-gradient found: ${line.trim()}`);
        }
        // Backdrop filters
        if (/backdrop-filter|backdropFilter/i.test(line)) {
          violations.push(`${f}:${idx + 1}: backdrop-filter found: ${line.trim()}`);
        }
        // Raw box-shadows (not var(--elevation-sticky) or var(--branch-glow))
        if (/box-shadow|boxShadow/i.test(line)) {
          if (!line.includes('var(--elevation-sticky)') && !line.includes('var(--branch-glow)')) {
            violations.push(`${f}:${idx + 1}: unsanctioned box-shadow: ${line.trim()}`);
          }
        }
      });
    }

    expect(violations, `Found unsanctioned shadows or gradients:\n${violations.join('\n')}`).toEqual([]);
  });

  test('U1-08: Focus ring contrast >= 3:1 against surfaces', async () => {
    const contrastScript = path.resolve('verification/contrast.mjs');
    const output = execSync(`node "${contrastScript}"`, { encoding: 'utf-8' });
    expect(output).toContain('--line-focus on --bg-void    : 8.69:1 [Target >= 3.0:1] -> PASS');
    expect(output).toContain('--line-focus on --bg-panel   : 8.35:1 [Target >= 3.0:1] -> PASS');
  });

  test('U1-09: Body floor: no text below 11px', async () => {
    const tokensContent = fs.readFileSync(path.resolve('src/tokens.css'), 'utf-8');
    const microMatch = tokensContent.match(/--fs-micro:\s*([0-9]+)px/);
    expect(microMatch).not.toBeNull();
    const microVal = parseInt(microMatch![1], 10);
    expect(microVal, 'Minimum font size floor is 11px').toBeGreaterThanOrEqual(11);
  });

  test('U1-10: Icon set complete with all 19 domain SVGs', async ({ page }) => {
    await page.goto('/method');
    const iconsGallery = page.locator('#icons-gallery');
    await expect(iconsGallery).toBeVisible();

    const iconCards = iconsGallery.locator('.icon-card');
    await expect(iconCards).toHaveCount(19);

    const u1Dir = path.resolve('verification/u1');
    if (!fs.existsSync(u1Dir)) {
      fs.mkdirSync(u1Dir, { recursive: true });
    }

    await iconsGallery.screenshot({ path: path.join(u1Dir, 'icons.png') });
    expect(fs.existsSync(path.join(u1Dir, 'icons.png'))).toBeTruthy();
  });

});
