/**
 * make-icons.mjs - Rasterises public/logo.svg into the PNG icon sizes browsers need.
 *
 * The source SVG is hand-authored geometry (see public/logo.svg): a keystone wedge and a
 * three-node dependency chain. Nothing here is generated, traced or stock art, and this
 * script makes that auditable - the PNGs are a deterministic render of a file in the repo.
 *
 *   node scripts/make-icons.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('public');
const SVG = fs.readFileSync(path.join(PUBLIC_DIR, 'logo.svg'), 'utf-8');
const SIZES = [
  ['favicon-32.png', 32],
  ['favicon-192.png', 192],
  ['apple-touch-icon.png', 180],
  ['icon-512.png', 512],
];

const browser = await chromium.launch();
try {
  for (const [name, size] of SIZES) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<!doctype html><meta charset="utf-8">` +
        `<style>html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden}` +
        `svg{display:block;width:${size}px;height:${size}px}</style>${SVG}`
    );
    await page.waitForTimeout(80);
    await page.screenshot({ path: path.join(PUBLIC_DIR, name), omitBackground: false });
    await page.close();
    console.log(`wrote public/${name} (${size}x${size})`);
  }
} finally {
  await browser.close();
}
