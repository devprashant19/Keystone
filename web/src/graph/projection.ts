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

  // Sort intersections by longitude ascending
  const sorted = [...intersections].sort((a, b) => a.lon - b.lon);
  const total = sorted.length;

  // Derive column positions across the horizontal span
  const colCount = Math.max(3, Math.min(6, Math.ceil(Math.sqrt(total) * 1.5)));
  const colWidth = (bandRight - bandLeft) / (colCount + 1);

  // Partition sorted nodes into columns deterministically
  // For 13 nodes into 6 columns: columns distribute as [2, 2, 3, 2, 2, 2]
  const basePerCol = Math.floor(total / colCount);
  const remainder = total % colCount;
  const colSizes: number[] = [];
  for (let c = 0; c < colCount; c++) {
    // Put extra items in the center column
    const isCenter = c === Math.floor(colCount / 2);
    colSizes.push(basePerCol + (isCenter ? remainder : 0));
  }

  let offset = 0;
  for (let c = 0; c < colCount; c++) {
    const size = colSizes[c] || basePerCol;
    const colItems = sorted.slice(offset, offset + size);
    offset += size;

    // Within each column, sort descending by latitude (north on top)
    colItems.sort((a, b) => b.lat - a.lat);

    const colX = Math.round((bandLeft + (c + 1) * colWidth) / 10) * 10;
    const isEvenCol = c % 2 === 0;

    colItems.forEach((item, r) => {
      let nodeY: number;
      if (colItems.length === 1) {
        nodeY = bandTop + 125;
      } else if (colItems.length === 2) {
        nodeY = r === 0
          ? bandTop + (isEvenCol ? 45 : 75)
          : bandTop + (isEvenCol ? 190 : 225);
      } else {
        // 3 or more items
        const step = (bandBottom - bandTop - 60) / Math.max(colItems.length - 1, 1);
        nodeY = bandTop + 35 + r * step;
      }

      result[item.id] = {
        x: colX,
        y: Math.round(nodeY),
      };
    });
  }

  return result;
}


