import { BBox, IntersectionNode } from './types';

export interface Point {
  x: number;
  y: number;
}

/**
 * Equirectangular geographic projection fitted to bounding box with padding
 * and aspect correction factor cos(meanLat).
 */
export function projectGeo(
  lon: number,
  lat: number,
  bbox: BBox,
  width: number,
  height: number,
  padding: number = 48
): Point {
  const minLon = bbox.min_lon;
  const maxLon = bbox.max_lon;
  const minLat = bbox.min_lat;
  const maxLat = bbox.max_lat;

  const lonSpan = maxLon - minLon || 0.01;
  const latSpan = maxLat - minLat || 0.01;

  const meanLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const cosFactor = Math.cos(meanLatRad);

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  // Geographic aspect ratio in corrected pixels
  const geoAspect = (lonSpan * cosFactor) / latSpan;
  const boxAspect = innerW / innerH;

  let plotW = innerW;
  let plotH = innerH;
  let offsetX = padding;
  let offsetY = padding;

  if (geoAspect > boxAspect) {
    plotH = innerW / geoAspect;
    offsetY = padding + (innerH - plotH) / 2;
  } else {
    plotW = innerH * geoAspect;
    offsetX = padding + (innerW - plotW) / 2;
  }

  const normX = (lon - minLon) / lonSpan;
  const normY = (lat - minLat) / latSpan;

  const x = offsetX + normX * plotW;
  const y = offsetY + (1 - normY) * plotH;

  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

/**
 * Deterministic schematic layout for the Road band.
 * Orders intersections by longitude into columns, and by latitude within columns.
 * Snaps to a 24px grid.
 */
export function computeSchematicRoadLayout(
  intersections: IntersectionNode[],
  bandLeft: number,
  bandRight: number,
  bandTop: number,
  bandBottom: number
): Record<string, Point> {
  const result: Record<string, Point> = {};
  if (!intersections || intersections.length === 0) return result;

  // Sort by longitude ascending
  const sorted = [...intersections].sort((a, b) => a.lon - b.lon);

  // Group into columns dynamically based on number of nodes
  const total = sorted.length;
  const colCount = Math.max(3, Math.min(6, Math.ceil(Math.sqrt(total) * 1.5)));
  const itemsPerCol = Math.ceil(total / colCount);

  const colWidth = (bandRight - bandLeft) / (colCount + 1);
  const rowHeight = (bandBottom - bandTop) / (itemsPerCol + 1);

  for (let c = 0; c < colCount; c++) {
    const colItems = sorted.slice(c * itemsPerCol, (c + 1) * itemsPerCol);
    // Sort descending by latitude (north on top)
    colItems.sort((a, b) => b.lat - a.lat);

    colItems.forEach((item, r) => {
      const rawX = bandLeft + (c + 1) * colWidth;
      const rawY = bandTop + (r + 1) * rowHeight;
      // Nudge to 24px grid
      const grid = 24;
      const snapX = Math.round(rawX / grid) * grid;
      const snapY = Math.round(rawY / grid) * grid;
      result[item.id] = { x: snapX, y: snapY };
    });
  }

  return result;
}
