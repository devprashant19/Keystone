import React, { useMemo } from 'react';
import { WorldSummary } from './types';
import { projectGeo, Point } from './projection';

interface GeographicViewProps {
  world: WorldSummary;
  selectedEntityId?: string;
  onSelectEntity: (id: string, kind: string) => void;
  hoveredEntityId?: string;
  onHoverEntity: (id: string | null, meta?: any) => void;
  severedCorridorIds?: Set<string>;
  degradedCorridorIds?: Set<string>;
  selectedRouteCorridorIds?: Set<string>;
  showSyntheticOverlay?: boolean;
  highlightSevered?: boolean;
}

export const GeographicView: React.FC<GeographicViewProps> = ({
  world,
  selectedEntityId,
  onSelectEntity,
  hoveredEntityId,
  onHoverEntity,
  severedCorridorIds = new Set(),
  degradedCorridorIds = new Set(),
  selectedRouteCorridorIds = new Set(),
  showSyntheticOverlay = false,
  highlightSevered = false,
}) => {
  const width = 800;
  const height = 650;
  const padding = 48;

  // Project intersections
  const intersectionPoints = useMemo(() => {
    const pts: Record<string, Point> = {};
    if (!world.intersections || !world.bbox) return pts;
    for (const item of world.intersections) {
      pts[item.id] = projectGeo(item.lon, item.lat, world.bbox, width, height, padding);
    }
    return pts;
  }, [world.intersections, world.bbox]);

  // Project facilities
  const facilityPoints = useMemo(() => {
    const pts: Record<string, Point> = {};
    if (!world.facilities || !world.bbox) return pts;
    for (const item of world.facilities) {
      if (item.lon && item.lat) {
        pts[item.id] = projectGeo(item.lon, item.lat, world.bbox, width, height, padding);
      } else if (item.access_intersection && intersectionPoints[item.access_intersection]) {
        // Fallback offset slightly if lon/lat not provided
        const parent = intersectionPoints[item.access_intersection];
        pts[item.id] = { x: parent.x + 20, y: parent.y + 15 };
      }
    }
    return pts;
  }, [world.facilities, world.bbox, intersectionPoints]);

  // Project hazard polygons
  const projectedHazards = useMemo(() => {
    if (!world.hazard_zones || !world.bbox) return [];
    return world.hazard_zones.map((zone) => {
      const rings = zone.geometry.coordinates.map((ring) =>
        ring.map((coord) => projectGeo(coord[0], coord[1], world.bbox, width, height, padding))
      );
      return {
        ...zone,
        projectedRings: rings,
      };
    });
  }, [world.hazard_zones, world.bbox]);

  // Scale bar calculation (approx Delhi latitude km per degree)
  const scaleBarKm = 2; // 2 km scale bar
  const scaleBarPx = useMemo(() => {
    if (!world.bbox) return 60;
    const kmPerDegLon = 111.32 * Math.cos(((world.bbox.min_lat + world.bbox.max_lat) / 2) * (Math.PI / 180));
    const lonSpan = world.bbox.max_lon - world.bbox.min_lon || 0.05;
    const pxPerLon = (width - padding * 2) / lonSpan;
    const pxPerKm = pxPerLon / kmPerDegLon;
    return Math.max(30, Math.round(scaleBarKm * pxPerKm));
  }, [world.bbox]);

  // Deterministic Label Collision Avoidance (R-4)
  const labelPlacements = useMemo(() => {
    interface Candidate {
      id: string;
      name: string;
      priority: number; // 1: critical facilities, 2: depots, 3: non-critical facilities, 4: intersections
      isCritical: boolean;
      pt: Point;
      type: 'facility' | 'depot' | 'intersection';
    }

    const list: Candidate[] = [];

    // 1. Facilities
    for (const fac of world.facilities || []) {
      const pt = facilityPoints[fac.id];
      if (!pt || fac.excluded_from_metrics) continue;
      list.push({
        id: `fac_${fac.id}`,
        name: fac.name,
        priority: fac.is_critical ? 1 : 3,
        isCritical: Boolean(fac.is_critical),
        pt,
        type: 'facility',
      });
    }

    // 2. Depots
    for (const depot of world.depots || []) {
      const accPt = depot.intersection ? intersectionPoints[depot.intersection] : null;
      if (!accPt) continue;
      const pt = { x: accPt.x - 18, y: accPt.y + 12 };
      list.push({
        id: `depot_${depot.id}`,
        name: depot.name,
        priority: 2,
        isCritical: false,
        pt,
        type: 'depot',
      });
    }

    // 3. Intersections
    for (const int of world.intersections || []) {
      const pt = intersectionPoints[int.id];
      if (!pt) continue;
      list.push({
        id: `int_${int.id}`,
        name: int.name,
        priority: 4,
        isCritical: false,
        pt,
        type: 'intersection',
      });
    }

    // Deterministic sort: priority ascending, tie-breaker alphabetical
    list.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.id.localeCompare(b.id);
    });

    const placedBoxes: Array<{ x: number; y: number; w: number; h: number }> = [];
    const placements: Record<string, { relX: number; relY: number; textAnchor: 'start' | 'end' | 'middle'; visible: boolean; hasLeader: boolean }> = {};

    const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => {
      const margin = 2;
      return (
        a.x < b.x + b.w + margin &&
        a.x + a.w + margin > b.x &&
        a.y < b.y + b.h + margin &&
        a.y + a.h + margin > b.y
      );
    };

    const computeBox = (
      pt: Point,
      relX: number,
      relY: number,
      textAnchor: 'start' | 'end' | 'middle',
      w: number,
      h: number
    ) => {
      let x = pt.x + relX;
      if (textAnchor === 'end') x -= w;
      else if (textAnchor === 'middle') x -= w / 2;
      const y = pt.y + relY - h + 2; // SVG baseline to top
      return { x, y, w, h };
    };

    // Multi-tier candidate offsets (14px, 26px, 42px, 62px, 82px)
    const tiers = [14, 26, 42, 62, 82];

    for (const item of list) {
      const textWidth = Math.max(34, item.name.length * 7.2 + 8);
      const textHeight = 13;

      // Build directional candidates across distance tiers
      const candidates: Array<{ relX: number; relY: number; textAnchor: 'start' | 'end' | 'middle'; hasLeader: boolean }> = [];
      for (const d of tiers) {
        const hasLeader = d >= 24;
        candidates.push(
          { relX: d, relY: 4, textAnchor: 'start', hasLeader },                      // East
          { relX: -d, relY: 4, textAnchor: 'end', hasLeader },                       // West
          { relX: 0, relY: -d, textAnchor: 'middle', hasLeader },                    // North
          { relX: 0, relY: d + 4, textAnchor: 'middle', hasLeader },                 // South
          { relX: Math.round(d * 0.8), relY: -Math.round(d * 0.7), textAnchor: 'start', hasLeader }, // NE
          { relX: -Math.round(d * 0.8), relY: -Math.round(d * 0.7), textAnchor: 'end', hasLeader },  // NW
          { relX: Math.round(d * 0.8), relY: Math.round(d * 0.8), textAnchor: 'start', hasLeader },  // SE
          { relX: -Math.round(d * 0.8), relY: Math.round(d * 0.8), textAnchor: 'end', hasLeader }   // SW
        );
      }

      const offsets = candidates.map((c) => ({
        ...c,
        box: computeBox(item.pt, c.relX, c.relY, c.textAnchor, textWidth, textHeight),
      }));

      let placed = false;

      if (item.isCritical) {
        // Critical facilities are NEVER suppressed. Find the first collision-free candidate.
        for (const opt of offsets) {
          const inBounds =
            opt.box.x >= 12 &&
            opt.box.x + opt.box.w <= width - 12 &&
            opt.box.y >= 12 &&
            opt.box.y + opt.box.h <= height - 12;

          if (inBounds && !placedBoxes.some((b) => overlaps(opt.box, b))) {
            placedBoxes.push(opt.box);
            placements[item.id] = {
              relX: opt.relX,
              relY: opt.relY,
              textAnchor: opt.textAnchor,
              visible: true,
              hasLeader: opt.hasLeader,
            };
            placed = true;
            break;
          }
        }

        if (!placed) {
          // If perfectly within bounds was tight, choose first non-overlapping offset
          for (const opt of offsets) {
            if (!placedBoxes.some((b) => overlaps(opt.box, b))) {
              placedBoxes.push(opt.box);
              placements[item.id] = {
                relX: opt.relX,
                relY: opt.relY,
                textAnchor: opt.textAnchor,
                visible: true,
                hasLeader: opt.hasLeader,
              };
              placed = true;
              break;
            }
          }
        }

        if (!placed) {
          // Guaranteed safe offset with leader
          const fallback = offsets[0];
          placedBoxes.push(fallback.box);
          placements[item.id] = { relX: fallback.relX, relY: fallback.relY, textAnchor: fallback.textAnchor, visible: true, hasLeader: true };
        }
      } else if (item.type === 'depot') {
        // Non-critical depot: show standing label ONLY if tier 1 or tier 2 candidate has zero collision
        for (let i = 0; i < Math.min(16, offsets.length); i++) {
          const opt = offsets[i];
          const inBounds =
            opt.box.x >= 12 &&
            opt.box.x + opt.box.w <= width - 12 &&
            opt.box.y >= 12 &&
            opt.box.y + opt.box.h <= height - 12;

          if (inBounds && !placedBoxes.some((b) => overlaps(opt.box, b))) {
            placedBoxes.push(opt.box);
            placements[item.id] = {
              relX: opt.relX,
              relY: opt.relY,
              textAnchor: opt.textAnchor,
              visible: true,
              hasLeader: opt.hasLeader,
            };
            placed = true;
            break;
          }
        }

        if (!placed) {
          // Hover-only for non-critical label when crowded
          const fallback = offsets[0];
          placements[item.id] = { relX: fallback.relX, relY: fallback.relY, textAnchor: fallback.textAnchor, visible: false, hasLeader: false };
        }
      } else {
        // Intersections and non-critical facilities: hover-only to prevent visual clutter
        const fallback = offsets[0];
        placements[item.id] = { relX: fallback.relX, relY: fallback.relY, textAnchor: fallback.textAnchor, visible: false, hasLeader: false };
      }
    }

    return placements;
  }, [world.facilities, world.depots, world.intersections, facilityPoints, intersectionPoints, width, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-sunken)',
        border: '1px solid var(--line-hair)',
        boxSizing: 'border-box',
      }}
      role="region"
      aria-label="Geographic network view"
    >
      <defs>
        {/* 32px Survey Grid */}
        <pattern id="geo-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="var(--line-hair)" strokeOpacity="0.3" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width={width} height={height} fill="url(#geo-grid)" style={{ pointerEvents: 'none' }} />

      {/* Layer 1: Hazard Polygons */}
      <g role="group" className="hazard-zones" aria-label="Hazard Zones">
        {projectedHazards.map((zone) => {
          const pathData = zone.projectedRings
            .map((ring) => ring.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') + ' Z')
            .join(' ');
          const isSelected = selectedEntityId === zone.id;
          return (
            <path
              key={zone.id}
              d={pathData}
              fill="var(--fail-wash)"
              stroke="var(--fail)"
              strokeWidth={isSelected ? '2' : '1'}
              strokeDasharray="4 3"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectEntity(zone.id, 'HazardZone')}
              onMouseEnter={() =>
                onHoverEntity(zone.id, {
                  type: 'HazardZone',
                  water_level: `${zone.water_level_m}m`,
                  severity: zone.severity,
                  data_origin: zone.data_origin,
                })
              }
              onMouseLeave={() => onHoverEntity(null)}
            >
              <title>{`${zone.id} (${zone.flood_stage}) — ${zone.water_level_m}m`}</title>
            </path>
          );
        })}
      </g>

      {/* Layer 2: Corridor Ribbons */}
      <g role="group" className="corridors" aria-label="Corridors">
        {(world.corridors || []).map((corridor) => {
          const p1 = intersectionPoints[corridor.source];
          const p2 = intersectionPoints[corridor.target];
          if (!p1 || !p2) return null;

          const isSevered = severedCorridorIds.has(corridor.id);
          const isDegraded = degradedCorridorIds.has(corridor.id);
          const isOnRoute = selectedRouteCorridorIds.has(corridor.id);
          const isSelected = selectedEntityId === corridor.id;
          const isHovered = hoveredEntityId === corridor.id;

          let strokeColor = 'var(--line-firm)';
          let strokeWidth = 2.5;
          let strokeDasharray = 'none';

          if (isSevered) {
            strokeColor = 'var(--fail)';
            strokeDasharray = '1 4';
          } else if (isDegraded) {
            strokeColor = 'var(--warn)';
            strokeDasharray = '4 3';
          } else if (isOnRoute) {
            strokeColor = 'var(--accent)';
            strokeWidth = 3.5;
          } else if (highlightSevered) {
            strokeColor = 'var(--line-hair)';
          }

          if (isHovered || isSelected) {
            strokeWidth *= 1.5;
          }

          // Chevrons at 35% and 65%
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const perpX = -uy;
          const perpY = ux;

          const c1x = p1.x + dx * 0.35;
          const c1y = p1.y + dy * 0.35;
          const c2x = p1.x + dx * 0.65;
          const c2y = p1.y + dy * 0.65;

          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          const carriesElements =
            (corridor.carries_feeder_ids && corridor.carries_feeder_ids.length > 0) ||
            (corridor.carries_alert_link_ids && corridor.carries_alert_link_ids.length > 0);

          return (
            <g
              key={corridor.id}
              className={`corridor-group ${isSevered ? 'severed' : ''}`}
              onClick={() => onSelectEntity(corridor.id, 'Corridor')}
              onMouseEnter={() =>
                onHoverEntity(corridor.id, {
                  type: 'Corridor',
                  name: corridor.name,
                  breach_count: corridor.breach_count ?? 0,
                  length_km: corridor.length_km,
                  travel_cost_min: corridor.travel_cost_min,
                  status: isSevered ? 'SEVERED' : isDegraded ? 'DEGRADED' : corridor.status,
                  carries_feeders: corridor.carries_feeder_ids?.length || 0,
                  carries_alerts: corridor.carries_alert_link_ids?.length || 0,
                  data_origin: corridor.data_origin,
                })
              }
              onMouseLeave={() => onHoverEntity(null)}
              style={{ cursor: 'pointer' }}
            >
              <title>{`${corridor.name} (${corridor.id}) — ${corridor.breach_count ?? 0} breach cases (click to run sweep)`}</title>
              {/* Invisible 12px hit stroke for hit target rule */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="transparent"
                strokeWidth="12"
              />

              {/* Selected Route Underlay */}
              {isOnRoute && (
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="var(--accent-wash)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              )}

              {/* Main Ribbon */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
              />

              {/* Chevrons showing bidirectional capability */}
              {!isSevered && len > 30 && (
                <>
                  <polygon
                    points={`${c1x + ux * 3},${c1y + uy * 3} ${c1x - ux * 3 + perpX * 2.5},${c1y - uy * 3 + perpY * 2.5} ${c1x - ux * 3 - perpX * 2.5},${c1y - uy * 3 - perpY * 2.5}`}
                    fill={strokeColor}
                  />
                  <polygon
                    points={`${c2x - ux * 3},${c2y - uy * 3} ${c2x + ux * 3 + perpX * 2.5},${c2y + uy * 3 + perpY * 2.5} ${c2x + ux * 3 - perpX * 2.5},${c2y + uy * 3 - perpY * 2.5}`}
                    fill={strokeColor}
                  />
                </>
              )}

              {/* Severed ✕ marker at midpoint */}
              {isSevered && (
                <g className="severed-marker" transform={`translate(${midX}, ${midY})`}>
                  <circle r="7" fill="var(--bg-void)" stroke="var(--fail)" strokeWidth="1.5" />
                  <line x1="-3" y1="-3" x2="3" y2="3" stroke="var(--fail)" strokeWidth="1.5" />
                  <line x1="3" y1="-3" x2="-3" y2="3" stroke="var(--fail)" strokeWidth="1.5" />
                </g>
              )}

              {/* Carrier annotation glyph (bolt / antenna) at 20% along path */}
              {carriesElements && !isSevered && (
                <g transform={`translate(${p1.x + dx * 0.2}, ${p1.y + dy * 0.2})`}>
                  <circle r="5" fill="var(--bg-panel)" stroke="var(--synthetic)" strokeWidth="1" />
                  <path d="M -1 -3 L 1 -1 L -1 0 L 1 3" stroke="var(--synthetic)" strokeWidth="1" fill="none" />
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Layer 3: Intersection Nodes */}
      <g role="group" className="intersections" aria-label="Intersections">
        {(world.intersections || []).map((intersection) => {
          const pt = intersectionPoints[intersection.id];
          if (!pt) return null;
          const isSelected = selectedEntityId === intersection.id;
          const isHovered = hoveredEntityId === intersection.id;

          return (
            <g
              key={intersection.id}
              className="intersection-node"
              transform={`translate(${pt.x}, ${pt.y})`}
              onClick={() => onSelectEntity(intersection.id, 'Intersection')}
              onMouseEnter={() =>
                onHoverEntity(intersection.id, {
                  type: 'Intersection',
                  name: intersection.name,
                  lon: intersection.lon,
                  lat: intersection.lat,
                  data_origin: intersection.data_origin,
                })
              }
              onMouseLeave={() => onHoverEntity(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Invisible 16px hit target */}
              <rect x="-8" y="-8" width="16" height="16" fill="transparent" />

              {/* Square glyph, 10px, 1.5px stroke */}
              <rect
                x="-5"
                y="-5"
                width="10"
                height="10"
                fill="var(--bg-raised)"
                stroke={isSelected ? 'var(--accent)' : isHovered ? 'var(--ink-hi)' : 'var(--line-hair)'}
                strokeWidth="1.5"
                rx="1"
              />

              {/* Label with deterministic collision placement */}
              {(() => {
                const labelP = labelPlacements[`int_${intersection.id}`];
                const isVisible = labelP && (labelP.visible || isHovered);
                if (!labelP || !isVisible) return null;
                return (
                  <text
                    x={labelP.relX}
                    y={labelP.relY}
                    textAnchor={labelP.textAnchor}
                    fill="var(--ink-lo)"
                    fontSize="var(--fs-micro)"
                    fontFamily="var(--font-sans)"
                    className="map-label-text"
                    data-label-id={`int_${intersection.id}`}
                    style={{
                      textShadow: '0 0 2px var(--bg-panel), 0 0 2px var(--bg-panel)',
                      pointerEvents: 'none',
                    }}
                  >
                    {intersection.name}
                  </text>
                );
              })()}
            </g>
          );
        })}
      </g>

      {/* Layer 4: Facilities & Leader Lines */}
      <g role="group" className="facilities" aria-label="Facilities">
        {(world.facilities || []).map((fac) => {
          const pt = facilityPoints[fac.id];
          const accPt = fac.access_intersection ? intersectionPoints[fac.access_intersection] : null;
          if (!pt) return null;

          const isExcluded = fac.excluded_from_metrics;
          const isSelected = selectedEntityId === fac.id;
          const isCritical = fac.is_critical;

          return (
            <g
              key={fac.id}
              className={`facility-node ${isExcluded ? 'excluded' : ''}`}
              opacity={isExcluded ? 0.4 : 1.0}
              onClick={() => onSelectEntity(fac.id, 'Facility')}
              onMouseEnter={() =>
                onHoverEntity(fac.id, {
                  type: 'Facility',
                  name: fac.name,
                  facility_type: fac.type,
                  offset_km: fac.offset_km,
                  is_critical: fac.is_critical,
                  excluded: isExcluded,
                  exclusion_reason: fac.exclusion_reason,
                  data_origin: fac.data_origin,
                })
              }
              onMouseLeave={() => onHoverEntity(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Leader line to access intersection (Omitted for excluded facilities) */}
              {!isExcluded && accPt && (
                <line
                  x1={pt.x}
                  y1={pt.y}
                  x2={accPt.x}
                  y2={accPt.y}
                  stroke="var(--ink-lo)"
                  strokeWidth="1"
                  strokeDasharray={fac.is_assumed ? '2 2' : 'none'}
                />
              )}

              {/* Facility glyph: rounded rect 22x16 */}
              <g transform={`translate(${pt.x - 11}, ${pt.y - 8})`}>
                <rect
                  width="22"
                  height="16"
                  rx="3"
                  fill="var(--bg-raised)"
                  stroke={isSelected ? 'var(--accent)' : isCritical ? 'var(--ok)' : 'var(--line-firm)'}
                  strokeWidth="1.5"
                />
                <text
                  x="11"
                  y="12"
                  textAnchor="middle"
                  fill={isCritical ? 'var(--ok)' : 'var(--ink-hi)'}
                  fontSize="var(--fs-micro)"
                  fontWeight="700"
                >
                  {fac.type === 'hospital' ? 'H' : 'W'}
                </text>
              </g>

              {/* Excluded chip or label with deterministic collision placement */}
              {isExcluded ? (
                <g transform={`translate(${pt.x + 15}, ${pt.y - 5})`}>
                  <rect width="52" height="13" rx="2" fill="var(--bg-panel)" stroke="var(--ink-lo)" strokeWidth="0.8" />
                  <text x="26" y="9.5" textAnchor="middle" fill="var(--ink-lo)" fontSize="var(--fs-micro)" fontWeight="600">
                    EXCLUDED
                  </text>
                </g>
              ) : (() => {
                const labelP = labelPlacements[`fac_${fac.id}`];
                const isHovered = hoveredEntityId === fac.id;
                const isVisible = labelP && (labelP.visible || isHovered);
                if (!labelP || !isVisible) return null;
                return (
                  <g>
                    {labelP.hasLeader && (
                      <line
                        x1={pt.x}
                        y1={pt.y}
                        x2={pt.x + (labelP.textAnchor === 'end' ? labelP.relX : labelP.textAnchor === 'start' ? labelP.relX : labelP.relX)}
                        y2={pt.y + labelP.relY - 3}
                        stroke="var(--line-firm)"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    )}
                    <text
                      x={pt.x + labelP.relX}
                      y={pt.y + labelP.relY}
                      textAnchor={labelP.textAnchor}
                      fill="var(--ink-hi)"
                      fontSize="var(--fs-micro)"
                      fontWeight={isCritical ? '600' : '400'}
                      className="map-label-text"
                      data-label-id={`fac_${fac.id}`}
                      style={{
                        textShadow: '0 0 2px var(--bg-panel), 0 0 2px var(--bg-panel)',
                        pointerEvents: 'none',
                      }}
                    >
                      {fac.name}
                    </text>
                  </g>
                );
              })()}
            </g>
          );
        })}
      </g>

      {/* Layer 5: Depots & Responders */}
      <g role="group" className="depots" aria-label="Depots">
        {(world.depots || []).map((depot) => {
          const accPt = depot.intersection ? intersectionPoints[depot.intersection] : null;
          if (!accPt) return null;
          const pt = { x: accPt.x - 18, y: accPt.y + 12 };
          const isSelected = selectedEntityId === depot.id;
          const isHovered = hoveredEntityId === depot.id;
          const labelP = labelPlacements[`depot_${depot.id}`];
          const isVisible = labelP && (labelP.visible || isHovered);

          return (
            <g
              key={depot.id}
              className="depot-node"
              transform={`translate(${pt.x}, ${pt.y})`}
              onClick={() => onSelectEntity(depot.id, 'Depot')}
              onMouseEnter={() =>
                onHoverEntity(depot.id, {
                  type: 'Depot',
                  name: depot.name,
                  delay_min: depot.delay_min,
                  data_origin: depot.data_origin,
                })
              }
              onMouseLeave={() => onHoverEntity(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Chevron in circle */}
              <circle
                r="7"
                fill="var(--bg-raised)"
                stroke={isSelected ? 'var(--accent)' : 'var(--accent)'}
                strokeWidth="1.5"
              />
              <path d="M -3 -2 L 0 2 L 3 -2" fill="none" stroke="var(--accent)" strokeWidth="1.5" />

              {/* Responder count dot cluster superscript */}
              <circle cx="5" cy="-6" r="2.5" fill="var(--accent)" />
              <circle cx="9" cy="-6" r="2.5" fill="var(--accent)" />

              {isVisible && labelP && (
                <g>
                  {labelP.hasLeader && (
                    <line
                      x1={0}
                      y1={0}
                      x2={labelP.relX}
                      y2={labelP.relY - 3}
                      stroke="var(--accent)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                  <text
                    x={labelP.relX}
                    y={labelP.relY}
                    textAnchor={labelP.textAnchor}
                    fill="var(--accent)"
                    fontSize="var(--fs-micro)"
                    fontFamily="var(--font-mono)"
                    className="map-label-text"
                    data-label-id={`depot_${depot.id}`}
                    style={{ textShadow: '0 0 2px var(--bg-panel)' }}
                  >
                    {depot.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Layer 6: Alert / Power Synthetic Overlay (dimmed by default) */}
      {showSyntheticOverlay && (
        <g className="synthetic-overlay" opacity="0.85">
          {(world.towers || []).map((tower, idx) => {
            const baseX = 200 + idx * 80;
            const baseY = 80 + (idx % 2) * 40;
            return (
              <g key={tower.id} transform={`translate(${baseX}, ${baseY})`}>
                <polygon points="0,-7 6,7 -6,7" fill="none" stroke="var(--synthetic)" strokeWidth="1.2" />
                <circle cx="0" cy="-7" r="1.5" fill="var(--synthetic)" />
                <text x="8" y="2" fill="var(--synthetic)" fontSize="var(--fs-micro)">
                  {tower.name}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Layer 7: North Arrow + Scale Bar (Bottom-Left) */}
      <g className="map-legend-controls" transform={`translate(${padding}, ${height - padding + 10})`}>
        {/* North Arrow */}
        <g transform="translate(0, -10)">
          <line x1="0" y1="12" x2="0" y2="-8" stroke="var(--ink-mid)" strokeWidth="1.5" />
          <polygon points="0,-12 -3,-5 3,-5" fill="var(--ink-mid)" />
          <text x="6" y="-6" fill="var(--ink-mid)" fontSize="var(--fs-micro)" fontWeight="700">
            N
          </text>
        </g>

        {/* Scale Bar */}
        <g transform="translate(36, 0)">
          <line x1="0" y1="0" x2={scaleBarPx} y2="0" stroke="var(--ink-mid)" strokeWidth="2" />
          <line x1="0" y1="-3" x2="0" y2="3" stroke="var(--ink-mid)" strokeWidth="2" />
          <line x1={scaleBarPx} y1="-3" x2={scaleBarPx} y2="3" stroke="var(--ink-mid)" strokeWidth="2" />
          <text x={scaleBarPx / 2} y="-5" textAnchor="middle" fill="var(--ink-lo)" fontSize="var(--fs-micro)" fontFamily="var(--font-mono)">
            {scaleBarKm} km
          </text>
        </g>
      </g>
    </svg>
  );
};
