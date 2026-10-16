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
  const width = 800;
  const height = 650;

  // Band collapse state
  const [collapsedBands, setCollapsedBands] = useState<Record<string, boolean>>({
    ALERT: false,
    POWER: false,
    ROAD: false,
  });

  const toggleBand = (band: string) => {
    setCollapsedBands((prev) => ({ ...prev, [band]: !prev[band] }));
  };

  // Dynamic band heights
  const alertH = collapsedBands.ALERT ? 40 : 160;
  const powerH = collapsedBands.POWER ? 40 : 130;
  const roadH = collapsedBands.ROAD ? 40 : 320;

  const alertTop = 10;
  const powerTop = alertTop + alertH;
  const roadTop = powerTop + powerH;

  // Layout road intersections
  const roadPositions = useMemo(() => {
    return computeSchematicRoadLayout(
      world.intersections || [],
      120,
      width - 60,
      roadTop + 30,
      roadTop + roadH - 30
    );
  }, [world.intersections, roadTop, roadH]);

  // Layout power feeders in POWER band
  const feederPositions = useMemo(() => {
    const pts: Record<string, Point> = {};
    const feeders = world.power_feeders || [];
    const count = feeders.length || 1;
    const step = (width - 240) / Math.max(count, 1);
    feeders.forEach((f, idx) => {
      pts[f.id] = {
        x: 180 + idx * step,
        y: powerTop + (collapsedBands.POWER ? 20 : 65),
      };
    });
    return pts;
  }, [world.power_feeders, powerTop, collapsedBands.POWER]);

  // Layout towers and relays in ALERT band
  const alertPositions = useMemo(() => {
    const pts: Record<string, Point> = {};
    const towers = world.towers || [];
    const relays = world.relays || [];
    const total = towers.length + relays.length || 1;
    const step = (width - 240) / Math.max(total, 1);

    towers.forEach((t, idx) => {
      pts[t.id] = {
        x: 180 + idx * step,
        y: alertTop + (collapsedBands.ALERT ? 20 : 50),
      };
    });

    relays.forEach((r, idx) => {
      pts[r.id] = {
        x: 180 + (towers.length + idx) * step,
        y: alertTop + (collapsedBands.ALERT ? 20 : 110),
      };
    });

    return pts;
  }, [world.towers, world.relays, alertTop, collapsedBands.ALERT]);

  // Carrier corridors cross-band links
  const carrierLinks = useMemo(() => {
    const links: Array<{
      corridorId: string;
      targetId: string;
      kind: 'feeder' | 'alert';
      pRoad: Point;
      pTarget: Point;
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
          links.push({ corridorId: c.id, targetId: fid, kind: 'feeder', pRoad, pTarget: pF });
        }
      });

      // Carried alert links
      (c.carries_alert_link_ids || []).forEach((alid) => {
        // Link to matching tower or relay
        const alertLink = (world.alert_links || []).find((al) => al.id === alid);
        if (alertLink) {
          const pT = alertPositions[alertLink.to] || alertPositions[alertLink.from];
          if (pT) {
            links.push({ corridorId: c.id, targetId: alid, kind: 'alert', pRoad, pTarget: pT });
          }
        }
      });
    });

    return links;
  }, [world.corridors, world.alert_links, roadPositions, feederPositions, alertPositions]);

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
      aria-label="Schematic topological network view"
    >
      {/* Three Horizontal Layer Bands */}
      {/* Band 1: ALERT */}
      <g className="band-alert" transform={`translate(0, ${alertTop})`}>
        <rect
          x="0"
          y="0"
          width={width}
          height={alertH}
          fill="var(--bg-panel)"
          opacity="0.3"
        />
        <line x1="0" y1={alertH} x2={width} y2={alertH} stroke="var(--line-firm)" strokeWidth="1.5" />

        {/* Band Label Button */}
        <g
          onClick={() => toggleBand('ALERT')}
          style={{ cursor: 'pointer' }}
          className="band-header"
        >
          <rect x="10" y="10" width="90" height="20" rx="3" fill="var(--bg-raised)" stroke="var(--line-hair)" />
          <text x="20" y="24" fill="var(--ink-hi)" fontSize="var(--fs-micro)" fontWeight="700">
            {collapsedBands.ALERT ? '▶ ALERT' : '▼ ALERT'}
          </text>
        </g>

        {collapsedBands.ALERT ? (
          <text x="120" y="24" fill="var(--ink-lo)" fontSize="var(--fs-micro)" fontFamily="var(--font-mono)">
            ALERT — {world.towers?.length || 0} towers, {world.relays?.length || 0} relays, {world.alert_links?.length || 0} links (collapsed)
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
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              );
            })}

            {/* Towers */}
            {(world.towers || []).map((t) => {
              const pt = alertPositions[t.id];
              if (!pt) return null;
              const isSelected = selectedEntityId === t.id;
              return (
                <g
                  key={t.id}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={() => onSelectEntity(t.id, 'Tower')}
                  style={{ cursor: 'pointer' }}
                >
                  <polygon
                    points="0,-8 7,8 -7,8"
                    fill="var(--bg-raised)"
                    stroke={isSelected ? 'var(--accent)' : 'var(--synthetic)'}
                    strokeWidth="1.5"
                  />
                  <circle cx="0" cy="-8" r="2" fill="var(--synthetic)" />
                  <text x="10" y="3" fill="var(--ink-hi)" fontSize="var(--fs-micro)">
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
              return (
                <g
                  key={r.id}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={() => onSelectEntity(r.id, 'RelayContact')}
                  style={{ cursor: 'pointer' }}
                >
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
                  <text x="10" y="3" fill="var(--ink-mid)" fontSize="var(--fs-micro)">
                    {r.name}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </g>

      {/* Band 2: POWER */}
      <g className="band-power" transform={`translate(0, ${powerTop})`}>
        <rect
          x="0"
          y="0"
          width={width}
          height={powerH}
          fill="var(--bg-panel)"
          opacity="0.2"
        />
        <line x1="0" y1={powerH} x2={width} y2={powerH} stroke="var(--line-firm)" strokeWidth="1.5" />

        {/* Band Label Button */}
        <g
          onClick={() => toggleBand('POWER')}
          style={{ cursor: 'pointer' }}
          className="band-header"
        >
          <rect x="10" y="10" width="90" height="20" rx="3" fill="var(--bg-raised)" stroke="var(--line-hair)" />
          <text x="20" y="24" fill="var(--ink-hi)" fontSize="var(--fs-micro)" fontWeight="700">
            {collapsedBands.POWER ? '▶ POWER' : '▼ POWER'}
          </text>
        </g>

        {collapsedBands.POWER ? (
          <text x="120" y="24" fill="var(--ink-lo)" fontSize="var(--fs-micro)" fontFamily="var(--font-mono)">
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
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={() => onSelectEntity(f.id, 'PowerFeeder')}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    r="8"
                    fill="var(--bg-raised)"
                    stroke={isSelected ? 'var(--accent)' : 'var(--warn)'}
                    strokeWidth="1.5"
                  />
                  <path d="M -2 -4 L 1 -1 L -1 0 L 2 4" stroke="var(--warn)" strokeWidth="1.5" fill="none" />
                  <text x="12" y="3" fill="var(--ink-hi)" fontSize="var(--fs-micro)">
                    {f.name}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </g>

      {/* Band 3: ROAD */}
      <g className="band-road" transform={`translate(0, ${roadTop})`}>
        <rect
          x="0"
          y="0"
          width={width}
          height={roadH}
          fill="var(--bg-panel)"
          opacity="0.1"
        />

        {/* Band Label Button */}
        <g
          onClick={() => toggleBand('ROAD')}
          style={{ cursor: 'pointer' }}
          className="band-header"
        >
          <rect x="10" y="10" width="90" height="20" rx="3" fill="var(--bg-raised)" stroke="var(--line-hair)" />
          <text x="20" y="24" fill="var(--ink-hi)" fontSize="var(--fs-micro)" fontWeight="700">
            {collapsedBands.ROAD ? '▶ ROAD' : '▼ ROAD'}
          </text>
        </g>

        {collapsedBands.ROAD ? (
          <text x="120" y="24" fill="var(--ink-lo)" fontSize="var(--fs-micro)" fontFamily="var(--font-mono)">
            ROAD — {world.intersections?.length || 0} intersections, {world.corridors?.length || 0} corridors (collapsed)
          </text>
        ) : (
          <>
            {/* Corridor Ribbons in Road Band */}
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
                    <g transform={`translate(${midX}, ${midY})`}>
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
              return (
                <g
                  key={item.id}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={() => onSelectEntity(item.id, 'Intersection')}
                  style={{ cursor: 'pointer' }}
                >
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
                  <text
                    x="0"
                    y="-8"
                    textAnchor="middle"
                    fill="var(--ink-mid)"
                    fontSize="var(--fs-micro)"
                    fontFamily="var(--font-sans)"
                  >
                    {item.name}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </g>

      {/* CROSS-BAND CARRIER LINKS: Visible even when bands are collapsed */}
      <g className="carrier-connectors" aria-label="Carrier Connectors">
        {carrierLinks.map((link, idx) => {
          // Orthogonal routing with rounded corner from road up to target
          const cornerY = link.pTarget.y + 12;
          const pathD = `M ${link.pRoad.x} ${link.pRoad.y} L ${link.pRoad.x} ${cornerY} Q ${link.pRoad.x} ${link.pTarget.y} ${link.pTarget.x > link.pRoad.x ? link.pRoad.x + 6 : link.pRoad.x - 6} ${link.pTarget.y} L ${link.pTarget.x} ${link.pTarget.y}`;

          return (
            <g key={`carrier-${idx}`} className="carrier-link">
              <path
                d={pathD}
                fill="none"
                stroke="var(--synthetic)"
                strokeWidth="2"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
              {/* Badge Label 'carries' */}
              <g transform={`translate(${link.pRoad.x - 18}, ${(link.pRoad.y + link.pTarget.y) / 2 - 8})`}>
                <rect width="36" height="12" rx="2" fill="var(--bg-panel)" stroke="var(--synthetic)" strokeWidth="0.8" />
                <text x="18" y="9" textAnchor="middle" fill="var(--synthetic)" fontSize="8px" fontWeight="700">
                  carries
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
