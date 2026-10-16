import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Suite (axe-core)', () => {
  const routes = [
    { path: '/', name: 'Incident Command Deck' },
    { path: '/evidence/road_ring_monastery_chandgiram__road_ring_kashmere_monastery', name: 'Evidence Route' },
    { path: '/method', name: 'Method & Architecture View' },
  ];

  for (const { path: routePath, name } of routes) {
    test(`axe-core zero serious/critical violations on ${name} (${routePath})`, async ({ page }) => {
      await page.goto(routePath);
      await page.waitForTimeout(600);
      const results = await new AxeBuilder({ page }).analyze();
      const violations = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(violations, `Violations on ${routePath}: ${JSON.stringify(violations, null, 2)}`).toEqual([]);
    });
  }
});
