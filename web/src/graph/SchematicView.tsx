import React, { useState, useMemo } from 'react';
import { WorldSummary } from './types';
import { computeSchematicRoadLayout, Point } from './projection';

interface SchematicViewProps {
  world: WorldSummary;
  selectedEntityId?: string;
  onSelectEntity: (id: string, kind: string) => void;
  hoveredEntityId?: string;
  onHoverEntity: (id: string | null, meta?: any) => void;
  severedCorridorIds?: Set<string>;
  degradedCorridorIds?: Set<string>;
  selectedRouteCorridorIds?: Set<string>;
}

export const SchematicView: React.FC<SchematicViewProps> = ({
  world,
  selectedEntityId,
  onSelectEntity,
  hoveredEntityId,
  onHoverEntity,
  severedCorridorIds = new Set(),
  degradedCorridorIds = new Set(),
  selectedRouteCorridorIds = new Set(),
}) => {
  const width = 1000;

  // Band collapse state
  const [collapsedBands, setCollapsedBands] = useState<Record<string, boolean>>({
    ALERT: false,
    POWER: false,
    ROAD: false,
  });

  const toggleBand = (band: string) => {
    setCollapsedBands((prev) => ({ ...prev, [band]: !prev[band] }));
  };

  // Dynamic band heights & tops
  const alertH = collapsedBands.ALERT ? 40 : 185;
  const powerH = collapsedBands.POWER ? 40 : 155;
  const roadH = collapsedBands.ROAD ? 40 : 320;

  const alertTop = 15;
  const powerTop = alertTop + alertH + 15;
  const roadTop = powerTop + powerH + 15;
  const totalH = roadTop + roadH + 20;

  // 1. ROAD BAND LAYOUT
  const roadPositions = useMemo(() => {
    return computeSchematicRoadLayout(
      world.intersections || [],
      120,
      width - 60,
      roadTop,
      roadTop + roadH
    );
  }, [world.intersections, roadTop, roadH]);

  // Label offsets for road intersections (above if upper half of band, below if lower half)
  const roadLabelOffsets = useMemo<Record<string, number>>(() => {
    const offsets: Record<string, number> = {};
    const midY = roadTop + roadH / 2;
    for (const [id, pt] of Object.entries(roadPositions)) {
      offsets[id] = (pt as Point).y < midY ? -10 : 18;
    }
    return offsets;
  }, [roadPositions, roadTop, roadH]);

  // 2. POWER BAND LAYOUT
  // 3 distinct Y tiers in POWER band so horizontal separation is huge and labels never collide
  const feederPositions = useMemo<Record<string, Point>>(() => {
    const pts: Record<string, Point> = {};
    const feeders = world.power_feeders || [];

    const defaultPowerMap: Record<string, { x: number; tier: 1 | 2 | 3 }> = {
      pf_ridge:      { x: 210, tier: 1 },
      pf_chandrawal: { x: 490, tier: 1 },
      pf_redfort:    { x: 670, tier: 1 },
      pf_kashmere:   { x: 350, tier: 2 },
      pf_monastery:  { x: 560, tier: 2 },
      pf_ito:        { x: 770, tier: 2 },
      pf_cp:         { x: 450, tier: 3 },
    };

    feeders.forEach((f, idx) => {
      if (defaultPowerMap[f.id]) {
        const tier = defaultPowerMap[f.id].tier;
        const yRel = tier === 1 ? 25 : tier === 2 ? 75 : 125;
        pts[f.id] = {
          x: defaultPowerMap[f.id].x,
          y: powerTop + (collapsedBands.POWER ? 20 : yRel),
        };
      } else {
        const step = (width - 240) / Math.max(feeders.length, 1);
        pts[f.id] = {
          x: 180 + idx * step,
          y: powerTop + (collapsedBands.POWER ? 20 : 65),
        };
      }
    });

    return pts;
  }, [world.power_feeders, powerTop, collapsedBands.POWER, width]);

  // 3. ALERT BAND LAYOUT
  // Towers on 2 distinct tiers (Y=25 and Y=55), Relays on 3 distinct tiers (Y=85, Y=120, Y=155)
  // This guarantees that adjacent X items have different Y with Delta Y >= 30, preventing any overlap
  const alertPositions = useMemo<Record<string, Point & { labelOffset: number }>>(() => {
    const pts: Record<string, Point & { labelOffset: number }> = {};
    const towers = world.towers || [];
    const relays = world.relays || [];

    const towerMap: Record<string, { x: number; yRel: number; labelOffset: number }> = {
      tower_hindurao:    { x: 150, yRel: 25, labelOffset: -10 },
      tower_chandgiram:  { x: 390, yRel: 25, labelOffset: -10 },
      tower_monastery:   { x: 625, yRel: 25, labelOffset: -10 },
      tower_cp:          { x: 830, yRel: 25, labelOffset: -10 },
      tower_civil_lines: { x: 270, yRel: 55, labelOffset: 16 },
      tower_kashmere:    { x: 510, yRel: 55, labelOffset: 16 },
      tower_redfort:     { x: 730, yRel: 55, labelOffset: 16 },
      tower_ito:         { x: 920, yRel: 55, labelOffset: 16 },
    };

    const relayMap: Record<string, { x: number; yRel: number; labelOffset: number }> = {
      relay_hindurao:         { x: 130, yRel: 85,  labelOffset: 15 },
      relay_sushruta:         { x: 270, yRel: 85,  labelOffset: 15 },
      relay_monastery_backup: { x: 600, yRel: 85,  labelOffset: 15 },
      relay_dfs:              { x: 815, yRel: 85,  labelOffset: 15 },
      relay_station_backup:   { x: 975, yRel: 85,  labelOffset: 15 },
      relay_roopnagar:        { x: 195, yRel: 120, labelOffset: 15 },
      relay_kgfire:           { x: 490, yRel: 120, labelOffset: 15 },
      relay_gbpant:           { x: 750, yRel: 120, labelOffset: 15 },
      relay_drain12:          { x: 930, yRel: 120, labelOffset: 15 },
      relay_chandrawal:       { x: 370, yRel: 155, labelOffset: 15 },
      relay_lnjp:             { x: 680, yRel: 155, labelOffset: 15 },
      relay_ito_backup:       { x: 875, yRel: 155, labelOffset: 15 },
    };

    towers.forEach((t, idx) => {
      if (towerMap[t.id]) {
        pts[t.id] = {
          x: towerMap[t.id].x,
          y: alertTop + (collapsedBands.ALERT ? 20 : towerMap[t.id].yRel),
          labelOffset: towerMap[t.id].labelOffset,
        };
      } else {
        const step = (width - 240) / Math.max(towers.length, 1);
        pts[t.id] = {
          x: 150 + idx * step,
          y: alertTop + (collapsedBands.ALERT ? 20 : 45),
          labelOffset: -10,
        };
      }
    });

    relays.forEach((r, idx) => {
      if (relayMap[r.id]) {
        pts[r.id] = {
          x: relayMap[r.id].x,
          y: alertTop + (collapsedBands.ALERT ? 20 : relayMap[r.id].yRel),
          labelOffset: relayMap[r.id].labelOffset,
        };
      } else {
        const step = (width - 240) / Math.max(relays.length, 1);
        pts[r.id] = {
          x: 130 + idx * step,
          y: alertTop + (collapsedBands.ALERT ? 20 : 115),
          labelOffset: 15,
        };
      }
    });

    return pts;
  }, [world.towers, world.relays, alertTop, collapsedBands.ALERT, width]);

  // 4. CROSS-BAND CARRIER CONNECTORS & DEDUPLICATED BADGES
  const carrierLinks = useMemo(() => {
    const rawLinks: Array<{
      corridorId: string;
      targetId: string;
      kind: 'feeder' | 'alert';
      pRoad: Point;
      pTarget: Point;
      length: number;
      isVertical: boolean;
      badgePt: Point;
      showBadge: boolean;
    }> = [];

    (world.corridors || []).forEach((c) => {
      const p1 = roadPositions[c.source];
      const p2 = roadPositions[c.target];
      if (!p1 || !p2) return;
      const pRoad = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      // Carried feeders
      (c.carries_feeder_ids || []).forEach((fid) => {
        const pF = feederPositions[fid];
        if (pF) {
          const length = Math.hypot(pF.x - pRoad.x, pRoad.y - pF.y);
          const isVertical = Math.abs(pF.x - pRoad.x) <= 25;
          const badgePt = {
            x: isVertical ? pF.x : (pRoad.x + pF.x) / 2,
            y: (pRoad.y + pF.y) / 2,
          };
          rawLinks.push({
            corridorId: c.id,
            targetId: fid,
            kind: 'feeder',
            pRoad,
            pTarget: pF,
            length,
            isVertical,
            badgePt,
            showBadge: length >= 40,
          });
        }
      });

      // Carried alert links
      (c.carries_alert_link_ids || []).forEach((alid) => {
        const alertLink = (world.alert_links || []).find((al) => al.id === alid);
        if (alertLink) {
          const pT = alertPositions[alertLink.to] || alertPositions[alertLink.from];
          if (pT) {
            const length = Math.hypot(pT.x - pRoad.x, pRoad.y - pT.y);
            const isVertical = Math.abs(pT.x - pRoad.x) <= 25;
            const badgePt = {
              x: (pRoad.x + pT.x) / 2,
              y: (pRoad.y + pT.y) / 2,
            };
            rawLinks.push({
              corridorId: c.id,
              targetId: alid,
              kind: 'alert',
              pRoad,
              pTarget: pT,
              length,
              isVertical,
              badgePt,
              showBadge: length >= 40,
            });
          }
        }
      });
    });

    // Deduplicate badges within 35px
    const placedBadges: Point[] = [];
    return rawLinks.map((link) => {
      if (!link.showBadge) return link;
      const tooClose = placedBadges.some(
        (b) => Math.hypot(b.x - link.badgePt.x, b.y - link.badgePt.y) < 35
      );
      if (tooClose) {
        return { ...link, showBadge: false };
      }
      placedBadges.push(link.badgePt);
      return link;
    });
  }, [world.corridors, world.alert_links, roadPositions, feederPositions, alertPositions]);

  return (
    <svg
      viewBox={`0 0 ${width} ${totalH}`}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-sunken)',
        border: '1px solid var(--line-hair)',
        boxSizing: 'border-box',
      }}
      role="region"
      aria-label="Schematic topological network view"
    >
      {/* Band 1: ALERT (Absolute Coordinates, NO nested translate) */}
      <g className="band-alert">
        <rect
          x="0"
          y={alertTop}
          width={width}
          height={alertH}
          fill="var(--bg-panel)"
          opacity="0.3"
        />
        <line
          x1="0"
          y1={alertTop + alertH}
          x2={width}
          y2={alertTop + alertH}
          stroke="var(--line-firm)"
          strokeWidth="1.5"
        />

        {/* Band Header Button */}
        <g
          onClick={() => toggleBand('ALERT')}
          style={{ cursor: 'pointer' }}
          className="band-header"
        >
          <rect
            x="10"
            y={alertTop + 10}
            width="90"
            height="20"
            rx="3"
            fill="var(--bg-raised)"
            stroke="var(--line-hair)"
          />
          <text
            x="20"
            y={alertTop + 24}
            fill="var(--ink-hi)"
            fontSize="var(--fs-micro)"
            fontWeight="700"
          >
            {collapsedBands.ALERT ? '▶ ALERT' : '▼ ALERT'}
          </text>
        </g>

        {collapsedBands.ALERT ? (
          <text
            x="120"
            y={alertTop + 24}
            fill="var(--ink-lo)"
            fontSize="var(--fs-micro)"
            fontFamily="var(--font-mono)"
          >
            ALERT — {world.towers?.length || 0} towers, {world.relays?.length || 0} relays (collapsed)
          </text>
        ) : (
          <>
            {/* Alert Arcs */}
            {(world.alert_links || []).map((al) => {
              const p1 = alertPositions[al.from];
              const p2 = alertPositions[al.to];
              if (!p1 || !p2) return null;
              return (
                <line
                  key={al.id}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="var(--synthetic)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* Towers */}
            {(world.towers || []).map((t) => {
              const pt = alertPositions[t.id];
              if (!pt) return null;
              const isSelected = selectedEntityId === t.id;
              const labelY = pt.labelOffset < 0 ? pt.y - 12 : pt.y + 16;
              return (
                <g
                  key={t.id}
                  onClick={() => onSelectEntity(t.id, 'Tower')}
                  style={{ cursor: 'pointer' }}
                >
                  <g transform={`translate(${pt.x}, ${pt.y})`}>
                    <polygon
                      points="0,-8 7,8 -7,8"
                      fill="var(--bg-raised)"
                      stroke={isSelected ? 'var(--accent)' : 'var(--synthetic)'}
                      strokeWidth="1.5"
                    />
                    <circle cx="0" cy="-8" r="2" fill="var(--synthetic)" />
                  </g>
                  <text
                    x={pt.x}
                    y={labelY}
                    textAnchor="middle"
                    fill="var(--ink-hi)"
                    fontSize="var(--fs-micro)"
                    fontFamily="var(--font-sans)"
                    className="map-label-text"
                    data-label-id={t.id}
                    style={{ textShadow: '0 0 2px var(--bg-panel)' }}
                  >
                    {t.name}
                  </text>
                </g>
              );
            })}

            {/* Relays */}
            {(world.relays || []).map((r) => {
              const pt = alertPositions[r.id];
              if (!pt) return null;
              const isSelected = selectedEntityId === r.id;
              const labelY = pt.labelOffset < 0 ? pt.y - 10 : pt.y + 16;
              return (
                <g
                  key={r.id}
                  onClick={() => onSelectEntity(r.id, 'RelayContact')}
                  style={{ cursor: 'pointer' }}
                >
                  <g transform={`translate(${pt.x}, ${pt.y})`}>
                    <polygon
                      points="0,-6 6,-3 6,3 0,6 -6,3 -6,-3"
                      fill="var(--bg-raised)"
                      stroke={isSelected ? 'var(--accent)' : 'var(--synthetic)'}
                      strokeWidth="1.5"
                    />
                    {r.is_required_target && (
                      <polygon
                        points="0,-8 8,-4 8,4 0,8 -8,4 -8,-4"
                        fill="none"
                        stroke="var(--ok)"
                        strokeWidth="1"
                      />
                    )}
                  </g>
                  <text
                    x={pt.x}
                    y={labelY}
                    textAnchor="middle"
                    fill="var(--ink-mid)"
                    fontSize="var(--fs-micro)"
                    fontFamily="var(--font-sans)"
                    className="map-label-text"
                    data-label-id={r.id}
                    style={{ textShadow: '0 0 2px var(--bg-panel)' }}
                  >
                    {r.name}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </g>

      {/* Band 2: POWER (Absolute Coordinates) */}
      <g className="band-power">
        <rect
          x="0"
          y={powerTop}
          width={width}
          height={powerH}
          fill="var(--bg-panel)"
          opacity="0.2"
        />
        <line
          x1="0"
          y1={powerTop + powerH}
          x2={width}
          y2={powerTop + powerH}
          stroke="var(--line-firm)"
          strokeWidth="1.5"
        />

        {/* Band Header Button */}
        <g
          onClick={() => toggleBand('POWER')}
          style={{ cursor: 'pointer' }}
          className="band-header"
        >
          <rect
            x="10"
            y={powerTop + 10}
            width="90"
            height="20"
            rx="3"
            fill="var(--bg-raised)"
            stroke="var(--line-hair)"
          />
          <text
            x="20"
            y={powerTop + 24}
            fill="var(--ink-hi)"
            fontSize="var(--fs-micro)"
            fontWeight="700"
          >
            {collapsedBands.POWER ? '▶ POWER' : '▼ POWER'}
          </text>
        </g>

        {collapsedBands.POWER ? (
          <text
            x="120"
            y={powerTop + 24}
            fill="var(--ink-lo)"
            fontSize="var(--fs-micro)"
            fontFamily="var(--font-mono)"
          >
            POWER — {world.power_feeders?.length || 0} feeders (collapsed)
          </text>
        ) : (
          <>
            {(world.power_feeders || []).map((f) => {
              const pt = feederPositions[f.id];
              if (!pt) return null;
              const isSelected = selectedEntityId === f.id;
              return (
                <g
                  key={f.id}
                  onClick={() => onSelectEntity(f.id, 'PowerFeeder')}
                  style={{ cursor: 'pointer' }}
                >
                  <g transform={`translate(${pt.x}, ${pt.y})`}>
                    <circle
                      r="8"
                      fill="var(--bg-raised)"
                      stroke={isSelected ? 'var(--accent)' : 'var(--warn)'}
                      strokeWidth="1.5"
                    />
                    <path d="M -2 -4 L 1 -1 L -1 0 L 2 4" stroke="var(--warn)" strokeWidth="1.5" fill="none" />
                  </g>
                  <text
                    x={pt.x}
                    y={pt.y + 18}
                    textAnchor="middle"
                    fill="var(--ink-hi)"
                    fontSize="var(--fs-micro)"
                    fontFamily="var(--font-sans)"
                    className="map-label-text"
                    data-label-id={f.id}
                    style={{ textShadow: '0 0 2px var(--bg-panel)' }}
                  >
                    {f.name}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </g>

      {/* Band 3: ROAD (Absolute Coordinates) */}
      <g className="band-road">
        <rect
          x="0"
          y={roadTop}
          width={width}
          height={roadH}
          fill="var(--bg-panel)"
          opacity="0.1"
        />

        {/* Band Header Button */}
        <g
          onClick={() => toggleBand('ROAD')}
          style={{ cursor: 'pointer' }}
          className="band-header"
        >
          <rect
            x="10"
            y={roadTop + 10}
            width="90"
            height="20"
            rx="3"
            fill="var(--bg-raised)"
            stroke="var(--line-hair)"
          />
          <text
            x="20"
            y={roadTop + 24}
            fill="var(--ink-hi)"
            fontSize="var(--fs-micro)"
            fontWeight="700"
          >
            {collapsedBands.ROAD ? '▶ ROAD' : '▼ ROAD'}
          </text>
        </g>

        {collapsedBands.ROAD ? (
          <text
            x="120"
            y={roadTop + 24}
            fill="var(--ink-lo)"
            fontSize="var(--fs-micro)"
            fontFamily="var(--font-mono)"
          >
            ROAD — {world.intersections?.length || 0} intersections, {world.corridors?.length || 0} corridors (collapsed)
          </text>
        ) : (
          <>
            {/* Corridor Arcs */}
            {(world.corridors || []).map((c) => {
              const p1 = roadPositions[c.source];
              const p2 = roadPositions[c.target];
              if (!p1 || !p2) return null;

              const isSevered = severedCorridorIds.has(c.id);
              const isDegraded = degradedCorridorIds.has(c.id);
              const isOnRoute = selectedRouteCorridorIds.has(c.id);
              const isSelected = selectedEntityId === c.id;
              const isHovered = hoveredEntityId === c.id;

              let strokeColor = 'var(--line-firm)';
              let strokeWidth = isSelected || isHovered ? 4.0 : 2.5;
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
              }

              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g
                  key={c.id}
                  className={`corridor-group ${isSevered ? 'severed' : ''}`}
                  onClick={() => onSelectEntity(c.id, 'Corridor')}
                  onMouseEnter={() => onHoverEntity(c.id, { type: 'Corridor', status: isSevered ? 'SEVERED' : c.status })}
                  onMouseLeave={() => onHoverEntity(null)}
                  style={{ cursor: 'pointer' }}
                >
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
                  {isSevered && (
                    <g className="severed-marker" transform={`translate(${midX}, ${midY})`}>
                      <circle r="7" fill="var(--bg-void)" stroke="var(--fail)" strokeWidth="1.5" />
                      <line x1="-3" y1="-3" x2="3" y2="3" stroke="var(--fail)" strokeWidth="1.5" />
                      <line x1="3" y1="-3" x2="-3" y2="3" stroke="var(--fail)" strokeWidth="1.5" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Intersections */}
            {(world.intersections || []).map((item) => {
              const pt = roadPositions[item.id];
              if (!pt) return null;
              const isSelected = selectedEntityId === item.id;
              const offset = roadLabelOffsets[item.id] ?? -10;
              const labelY = offset < 0 ? pt.y - 10 : pt.y + 18;

              return (
                <g
                  key={item.id}
                  onClick={() => onSelectEntity(item.id, 'Intersection')}
                  style={{ cursor: 'pointer' }}
                >
                  <g transform={`translate(${pt.x}, ${pt.y})`}>
                    <rect
                      x="-5"
                      y="-5"
                      width="10"
                      height="10"
                      fill="var(--bg-raised)"
                      stroke={isSelected ? 'var(--accent)' : 'var(--line-hair)'}
                      strokeWidth="1.5"
                      rx="1"
                    />
                  </g>
                  <text
                    x={pt.x}
                    y={labelY}
                    textAnchor="middle"
                    fill="var(--ink-mid)"
                    fontSize="var(--fs-micro)"
                    fontFamily="var(--font-sans)"
                    className="map-label-text"
                    data-label-id={item.id}
                    style={{ textShadow: '0 0 2px var(--bg-panel)' }}
                  >
                    {item.name}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </g>

      {/* CROSS-BAND CARRIER LINKS: Visible across collapsed/uncollapsed bands */}
      <g role="group" className="carrier-connectors" aria-label="Carrier Connectors">
        {carrierLinks.map((link, idx) => {
          let pathD = '';
          if (link.isVertical) {
            pathD = `M ${link.pTarget.x} ${link.pRoad.y} L ${link.pTarget.x} ${link.pTarget.y}`;
          } else {
            const cornerY = link.pTarget.y + 12;
            pathD = `M ${link.pRoad.x} ${link.pRoad.y} L ${link.pRoad.x} ${cornerY} Q ${link.pRoad.x} ${link.pTarget.y} ${link.pTarget.x > link.pRoad.x ? link.pRoad.x + 6 : link.pRoad.x - 6} ${link.pTarget.y} L ${link.pTarget.x} ${link.pTarget.y}`;
          }

          return (
            <g key={`carrier-${link.corridorId}-${link.targetId}-${idx}`} className="carrier-link">
              <path
                d={pathD}
                fill="none"
                stroke="var(--synthetic)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Badge Label 'carries': Deduplicated and suppressed if <40px */}
              {link.showBadge && (
                <g transform={`translate(${link.badgePt.x - 18}, ${link.badgePt.y - 7})`}>
                  <rect
                    width="36"
                    height="12"
                    rx="2"
                    fill="var(--bg-panel)"
                    stroke="var(--synthetic)"
                    strokeWidth="0.8"
                  />
                  <text
                    x="18"
                    y="10.5"
                    textAnchor="middle"
                    fill="var(--synthetic)"
                    fontSize="var(--fs-micro)"
                    fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                  >
                    carries
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};
