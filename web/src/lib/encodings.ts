/**
 * encodings.ts - Single source of truth for all visual and semantic encodings in Jaal Pre-Mortem.
 * Enforces U1 section 4 specifications.
 */

export type StatusVerdict = 'OK' | 'DEGRADED' | 'BREACH' | 'SEVERED' | 'UNREACHABLE' | 'EXCLUDED' | 'SYNTHETIC' | 'ASSUMED' | 'REFERENCE';

export interface EncodingStyle {
  concept: string;
  colorVar: string;
  washVar?: string;
  badgeText: string;
  strokeWidth: number;
  strokeDasharray?: string;
  shape: 'solid-1.5' | 'dashed-4-3' | 'solid-2' | 'dotted-1-4-x' | 'no-stroke-x' | 'dashed-2-2' | 'dashed-caret' | 'strikethrough' | 'branch-boundary' | 'solid-1';
  iconGlyph: 'filled-dot' | 'half-dot' | 'hollow-ring' | 'cross' | 'cross-square' | 'none' | 'caret' | 'strikethrough' | 'fork';
  label: string;
}

export function getStatusEncoding(status: string): EncodingStyle {
  const norm = (status || '').toUpperCase().trim();

  switch (norm) {
    case 'OK':
    case 'WITHIN_DEADLINE':
    case 'PASSABLE':
    case 'PASSABLE_SAFE':
      return {
        concept: 'Within deadline',
        colorVar: 'var(--ok)',
        washVar: 'var(--ok-wash)',
        badgeText: 'OK',
        strokeWidth: 1.5,
        shape: 'solid-1.5',
        iconGlyph: 'filled-dot',
        label: 'Within response deadline'
      };

    case 'DEGRADED':
    case 'THREATENED':
      return {
        concept: 'Degraded',
        colorVar: 'var(--warn)',
        washVar: 'var(--warn-wash)',
        badgeText: 'DEGRADED',
        strokeWidth: 1.5,
        strokeDasharray: '4 3',
        shape: 'dashed-4-3',
        iconGlyph: 'half-dot',
        label: 'Travel time degraded; deadline preserved'
      };

    case 'BREACH':
    case 'SLA_BREACH':
    case 'BLOCKED':
    case 'SUBMERGED':
      return {
        concept: 'SLA breach',
        colorVar: 'var(--fail)',
        washVar: 'var(--fail-wash)',
        badgeText: 'BREACH',
        strokeWidth: 2,
        shape: 'solid-2',
        iconGlyph: 'hollow-ring',
        label: 'Deadline breached'
      };

    case 'SEVERED':
    case 'CARRIED_ALERT_BACKHAUL_SEVERED':
    case 'CARRIED_FEEDER_SEVERED':
      return {
        concept: 'Severed relationship',
        colorVar: 'var(--fail)',
        washVar: 'var(--fail-wash)',
        badgeText: 'SEVERED',
        strokeWidth: 2,
        strokeDasharray: '1 4',
        shape: 'dotted-1-4-x',
        iconGlyph: 'cross',
        label: 'Physical dependency severed by corridor cascade'
      };

    case 'UNREACHABLE':
    case 'TOWER_UNPOWERED':
      return {
        concept: 'Unreachable',
        colorVar: 'var(--fail)',
        washVar: 'var(--fail-wash)',
        badgeText: 'UNREACHABLE',
        strokeWidth: 0,
        shape: 'no-stroke-x',
        iconGlyph: 'cross-square',
        label: 'Endpoint unreachable by any road / relay path'
      };

    case 'SYNTHETIC':
      return {
        concept: 'Synthetic provenance',
        colorVar: 'var(--synthetic)',
        washVar: 'var(--synthetic-wash)',
        badgeText: 'SYNTHETIC',
        strokeWidth: 1,
        strokeDasharray: '2 2',
        shape: 'dashed-2-2',
        iconGlyph: 'none',
        label: 'Synthetic layered spec entity'
      };

    case 'ASSUMED':
      return {
        concept: 'Assumed adjacency',
        colorVar: 'var(--synthetic)',
        washVar: 'var(--synthetic-wash)',
        badgeText: 'ASSUMED',
        strokeWidth: 1,
        strokeDasharray: '2 2',
        shape: 'dashed-caret',
        iconGlyph: 'caret',
        label: 'Synthetic centroid-to-intersection attachment'
      };

    case 'EXCLUDED':
      return {
        concept: 'Excluded from metrics',
        colorVar: 'var(--ink-lo)',
        badgeText: 'EXCLUDED',
        strokeWidth: 1,
        shape: 'strikethrough',
        iconGlyph: 'strikethrough',
        label: 'Documented exclusion (e.g. WTP Wazirabad)'
      };

    case 'REFERENCE':
    case 'REFERENCE_DERIVED':
      return {
        concept: 'Reference-derived data',
        colorVar: 'var(--ink-mid)',
        badgeText: 'REFERENCE',
        strokeWidth: 1.5,
        shape: 'solid-1',
        iconGlyph: 'none',
        label: 'Delhi OSM / CityGraph derived entity'
      };

    default:
      return {
        concept: 'Standard / Neutral',
        colorVar: 'var(--ink-mid)',
        badgeText: norm || 'UNKNOWN',
        strokeWidth: 1,
        shape: 'solid-1',
        iconGlyph: 'none',
        label: norm || 'Unclassified'
      };
  }
}

export function getBranchEncoding(branchId: string): EncodingStyle {
  return {
    concept: 'Counterfactual branch',
    colorVar: 'var(--branch)',
    washVar: 'var(--branch-wash)',
    badgeText: `BRANCH ${branchId}`,
    strokeWidth: 1,
    shape: 'branch-boundary',
    iconGlyph: 'fork',
    label: `Counterfactual branch state ${branchId}`
  };
}

export const ALL_ENCODING_CONCEPTS: { id: string; status: string; label: string }[] = [
  { id: 'ok', status: 'OK', label: 'Within deadline' },
  { id: 'degraded', status: 'DEGRADED', label: 'Degraded' },
  { id: 'breach', status: 'BREACH', label: 'SLA breach' },
  { id: 'severed', status: 'SEVERED', label: 'Severed relationship' },
  { id: 'unreachable', status: 'UNREACHABLE', label: 'Unreachable' },
  { id: 'synthetic', status: 'SYNTHETIC', label: 'Synthetic provenance' },
  { id: 'assumed', status: 'ASSUMED', label: 'Assumed adjacency' },
  { id: 'excluded', status: 'EXCLUDED', label: 'Excluded from metrics' },
  { id: 'reference', status: 'REFERENCE', label: 'Reference-derived data' }
];
