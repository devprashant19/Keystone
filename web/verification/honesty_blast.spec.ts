/**
 * honesty_blast.spec.ts - Regression guard against fabricated blast-radius entities.
 *
 * 7 of the 14 corridors carry no power feeder. Until 2026-10-17 BlastRadius.tsx fell back
 * to `severedFeeders.length || 1` and a hard-coded
 *   { id: 'pf_chandrawal', name: 'Chandrawal Grid Feeder' }
 * so selecting any of those corridors rendered "1 / 7 feeders dark" beside a named feeder
 * that was not severed - inventing analysis the graph did not support. Equivalent
 * fallbacks existed for towers and relays.
 *
 * This asserts, at source level, that those fallbacks stay gone. Source level is
 * deliberate: it is deterministic, it names the exact defect, and it cannot be masked by
 * whichever scenario happens to be loaded in a browser run.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BLAST = path.resolve('src/components/BlastRadius.tsx');

test.describe('Blast radius honesty', () => {
  test('HON-01: no fabricated fallback entities or inflated minimum counts', async () => {
    const src = fs.readFileSync(BLAST, 'utf-8');

    // Fabricated entity names must never be hard-coded as display fallbacks.
    for (const name of ['Chandrawal Grid Feeder', 'Chandgiram Akhara Tower', 'Chandrawal WTP Relay', 'DFS HQ Relay']) {
      expect(src, `fabricated fallback entity reintroduced: ${name}`).not.toContain(name);
    }

    // Severity counts must report the real length, never a non-zero floor.
    for (const pattern of [
      /severedFeeders\.length\s*\|\|\s*\d/,
      /unpoweredTowers\.length\s*\|\|\s*\d/,
      /isolatedRelays\.length\s*\|\|\s*\d/,
    ]) {
      expect(src, `inflated minimum count reintroduced: ${pattern}`).not.toMatch(pattern);
    }

    // The honest zero state must be present for each layer.
    expect(src).toMatch(/severedFeeders\.length === 0/);
    expect(src).toMatch(/unpoweredTowers\.length === 0/);
    expect(src).toMatch(/isolatedRelays\.length === 0/);
  });

  test('HON-02: 7 corridors genuinely carry no feeder, so the zero state is reachable', async ({ request }) => {
    const res = await request.get('http://localhost:8000/api/world/summary');
    expect(res.ok()).toBeTruthy();
    const world = await res.json();

    const zeroFeeder = world.corridors.filter((c: any) => (c.carries_feeder_ids ?? []).length === 0);

    // If this count changes the fixture changed; revisit the demo script, which tells the
    // presenter which corridors show a cross-layer cascade and which honestly show none.
    expect(zeroFeeder.length).toBe(7);
    expect(world.corridors.length).toBe(14);
  });
});
