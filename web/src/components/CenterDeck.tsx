import React, { useState } from 'react';

interface CenterDeckProps {
  viewMode: 'map' | 'topology';
  onToggleViewMode: (mode: 'map' | 'topology') => void;
  selectedCaseId: string;
  f1Corridor: string;
  f2Corridor: string;
  frameIndex: number;
  onSelectEntity: (entityId: string) => void;
  highlightSynthetic: boolean;
  onToggleSynthetic: () => void;
  highlightSevered: boolean;
  onToggleSevered: () => void;
}

// Normalized coordinate layout for Delhi arterial intersections
const INTERSECTION_POSITIONS: Record<string, { x: number; y: number; name: string }> = {
  int_chandgiram: { x: 340, y: 80, name: 'Chandgiram Akhara' },
  int_civil_lines: { x: 260, y: 120, name: 'Civil Lines' },
  int_sushruta: { x: 220, y: 160, name: 'Sushruta Trauma' },
  int_hindu_rao: { x: 180, y: 220, name: 'Hindu Rao' },
  int_kashmere_gate: { x: 400, y: 180, name: 'Kashmere Gate / ISBT' },
  int_monastery: { x: 440, y: 140, name: 'Monastery Market' },
  int_old_delhi_station: { x: 300, y: 280, name: 'Old Delhi Station' },
  int_red_fort: { x: 420, y: 270, name: 'Red Fort' },
  int_delhi_gate: { x: 420, y: 380, name: 'Delhi Gate' },
  int_connaught_place: { x: 280, y: 440, name: 'Connaught Place' },
  int_mandi_house: { x: 360, y: 470, name: 'Mandi House' },
  int_ito: { x: 460, y: 440, name: 'ITO Junction' },
  int_vikas_marg: { x: 540, y: 460, name: 'Vikas Marg / Yamuna' },
};

// Schematic layout for Topology mode
const TOPOLOGY_POSITIONS: Record<string, { x: number; y: number; name: string }> = {
  int_chandgiram: { x: 350, y: 50, name: 'Chandgiram' },
  int_civil_lines: { x: 200, y: 110, name: 'Civil Lines' },
  int_sushruta: { x: 140, y: 180, name: 'Sushruta' },
  int_hindu_rao: { x: 120, y: 270, name: 'Hindu Rao' },
  int_kashmere_gate: { x: 440, y: 150, name: 'Kashmere Gate' },
  int_monastery: { x: 520, y: 90, name: 'Monastery' },
  int_old_delhi_station: { x: 260, y: 260, name: 'Old Delhi Stn' },
  int_red_fort: { x: 460, y: 260, name: 'Red Fort' },
  int_delhi_gate: { x: 440, y: 370, name: 'Delhi Gate' },
  int_connaught_place: { x: 220, y: 420, name: 'Connaught Pl' },
  int_mandi_house: { x: 320, y: 480, name: 'Mandi House' },
  int_ito: { x: 480, y: 460, name: 'ITO' },
  int_vikas_marg: { x: 580, y: 480, name: 'Vikas Marg' },
};

// Corridors connecting intersections
const CORRIDOR_EDGES: Array<{
  id: string;
  source: string;
  target: string;
  name: string;
  carriesFeeder?: boolean;
  carriesAlert?: boolean;
}> = [
  { id: 'road_ring_monastery_chandgiram', source: 'int_chandgiram', target: 'int_monastery', name: 'Ring Rd Chandgiram-Monastery', carriesFeeder: true, carriesAlert: true },
  { id: 'road_ring_kashmere_monastery', source: 'int_monastery', target: 'int_kashmere_gate', name: 'Ring Rd Monastery-Kashmere', carriesFeeder: true },
  { id: 'road_ring_kashmere_redfort', source: 'int_kashmere_gate', target: 'int_red_fort', name: 'Ring Rd Kashmere-Red Fort' },
  { id: 'road_ring_redfort_delhigate', source: 'int_red_fort', target: 'int_delhi_gate', name: 'Ring Rd Red Fort-Delhi Gate' },
  { id: 'road_ring_delhigate_ito', source: 'int_delhi_gate', target: 'int_ito', name: 'Ring Rd Delhi Gate-ITO' },
  { id: 'road_sham_nath_sushruta_kashmere', source: 'int_civil_lines', target: 'int_kashmere_gate', name: 'Sham Nath Marg' },
  { id: 'road_ridge_sushruta_hindurao', source: 'int_sushruta', target: 'int_hindu_rao', name: 'Ridge Road' },
  { id: 'road_rani_jhansi_hindurao_cp', source: 'int_hindu_rao', target: 'int_connaught_place', name: 'Rani Jhansi Marg' },
  { id: 'road_rani_jhansi_to_station', source: 'int_hindu_rao', target: 'int_old_delhi_station', name: 'Rani Jhansi to Station' },
  { id: 'road_chelmsford_cp_station', source: 'int_connaught_place', target: 'int_old_delhi_station', name: 'Chelmsford Rd' },
  { id: 'road_barakhamba_cp_mandihouse', source: 'int_connaught_place', target: 'int_mandi_house', name: 'Barakhamba Rd' },
  { id: 'road_delhigate_connector', source: 'int_mandi_house', target: 'int_delhi_gate', name: 'Delhi Gate Connector' },
  { id: 'road_jln_marg_delhigate_cp', source: 'int_delhi_gate', target: 'int_connaught_place', name: 'JLN Marg' },
  { id: 'road_vikas_marg_ito', source: 'int_ito', target: 'int_vikas_marg', name: 'Vikas Marg Yamuna Bridge' },
];

export const CenterDeck: React.FC<CenterDeckProps> = ({
  viewMode,
  onToggleViewMode,
  selectedCaseId,
  f1Corridor,
  f2Corridor,
  frameIndex,
  onSelectEntity,
  highlightSynthetic,
  onToggleSynthetic,
  highlightSevered,
  onToggleSevered,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showEntityList, setShowEntityList] = useState<boolean>(false);

  const coords = viewMode === 'map' ? INTERSECTION_POSITIONS : TOPOLOGY_POSITIONS;

  // Determine severed corridors based on frame index
  // Frame 0: None severed (baseline)
  // Frame 1: f1 severed
  // Frame 2: f1 severed + preventive action
  // Frame 3: f1 + f2 severed
  // Frame 4: outcome
  const isF1Severed = frameIndex >= 1 && Boolean(f1Corridor);
  const isF2Severed = frameIndex >= 3 && Boolean(f2Corridor);

  const severedCorridors = new Set<string>();
  if (isF1Severed) severedCorridors.add(f1Corridor);
  if (isF2Severed) severedCorridors.add(f2Corridor);

  return (
    <main
      style={{
        flex: 1,
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
      role="main"
      aria-label=" Delhi Road Network and Infrastructure Topology"
    >
      {/* Top toolbar */}
      <div
        style={{
          height: '44px',
          borderBottom: '1px solid var(--line)',
          backgroundColor: 'var(--panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        {/* View Mode Toggle: Map vs Topology */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onToggleViewMode('map')}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid var(--line)',
              backgroundColor: viewMode === 'map' ? 'var(--panel-2)' : 'transparent',
              color: viewMode === 'map' ? 'var(--accent)' : 'var(--text-3)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Geographic Map
          </button>
          <button
            onClick={() => onToggleViewMode('topology')}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid var(--line)',
              backgroundColor: viewMode === 'topology' ? 'var(--panel-2)' : 'transparent',
              color: viewMode === 'topology' ? 'var(--accent)' : 'var(--text-3)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Schematic Topology
          </button>
        </div>

        {/* Legend buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onToggleSynthetic}
            style={{
              fontSize: '11px',
              background: highlightSynthetic ? 'rgba(124, 140, 163, 0.3)' : 'transparent',
              border: '1px dashed var(--synthetic)',
              color: 'var(--text-2)',
              padding: '2px 8px',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            title="Toggle synthetic telecom/power overlay"
          >
            SYNTHETIC LAYERS
          </button>

          <button
            onClick={onToggleSevered}
            style={{
              fontSize: '11px',
              background: highlightSevered ? 'rgba(229, 84, 75, 0.3)' : 'transparent',
              border: '1px solid var(--fail)',
              color: 'var(--fail)',
              padding: '2px 8px',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            title="Toggle severed corridors highlight"
          >
            SEVERED ARCS
          </button>

          <button
            onClick={() => setShowEntityList(!showEntityList)}
            style={{
              fontSize: '11px',
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              color: 'var(--text-3)',
              padding: '2px 8px',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            title="Accessible screen-reader entity table (AX-07)"
          >
            {showEntityList ? 'Hide Entity List' : 'Accessible Entity List'}
          </button>

          {/* Zoom controls */}
          <div style={{ display: 'flex', gap: '2px', marginLeft: '8px' }}>
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 2.0))}
              style={{ padding: '2px 8px', background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)', cursor: 'pointer', borderRadius: '2px' }}
            >
              +
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
              style={{ padding: '2px 8px', background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)', cursor: 'pointer', borderRadius: '2px' }}
            >
              −
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              style={{ padding: '2px 8px', background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)', cursor: 'pointer', borderRadius: '2px' }}
            >
              0
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg
          viewBox="0 0 700 550"
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center',
            transition: 'transform 150ms ease-out',
          }}
          role="img"
          aria-label="Delhi Arterial Road Network Graph"
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--line)" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>
          <rect width="700" height="550" fill="url(#grid)" />

          {/* Yamuna River schematic curve */}
          <path
            d="M 370 20 Q 420 100 460 200 T 490 400 T 560 540"
            fill="none"
            stroke="#1B3854"
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.5"
          />
          <text x="500" y="320" fill="#2D5A85" fontSize="10" fontFamily="var(--font-mono)">
            YAMUNA RIVER
          </text>

          {/* Corridors (Road Arcs) */}
          {CORRIDOR_EDGES.map((edge) => {
            const p1 = coords[edge.source];
            const p2 = coords[edge.target];
            if (!p1 || !p2) return null;

            const isSevered = severedCorridors.has(edge.id);

            let strokeColor = 'var(--text-3)';
            let strokeWidth = 2.5;
            let strokeDasharray = 'none';

            if (isSevered) {
              strokeColor = 'var(--fail)';
              strokeWidth = 3;
              strokeDasharray = '4 4';
            } else if (frameIndex >= 2 && !isSevered) {
              // Counterfactual branch state: purple hint
              strokeColor = '#5C7494';
            }

            return (
              <g key={edge.id} onClick={() => onSelectEntity(edge.id)} style={{ cursor: 'pointer' }}>
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
                  <circle
                    cx={(p1.x + p2.x) / 2}
                    cy={(p1.y + p2.y) / 2}
                    r="8"
                    fill="var(--fail)"
                  />
                )}
                {isSevered && (
                  <text
                    x={(p1.x + p2.x) / 2}
                    y={(p1.y + p2.y) / 2 + 3}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="9"
                    fontWeight="700"
                  >
                    ✕
                  </text>
                )}
              </g>
            );
          })}

          {/* Intersections */}
          {Object.entries(coords).map(([id, pos]) => (
            <g key={id} onClick={() => onSelectEntity(id)} style={{ cursor: 'pointer' }}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="5"
                fill="var(--panel-2)"
                stroke="var(--line)"
                strokeWidth="2"
              />
              <text
                x={pos.x}
                y={pos.y - 8}
                textAnchor="middle"
                fill="var(--text-2)"
                fontSize="10"
                fontFamily="var(--font-sans)"
              >
                {pos.name}
              </text>
            </g>
          ))}

          {/* Facilities: LNJP Hospital & Sushruta Trauma Centre */}
          {/* LNJP attached to Delhi Gate */}
          <g transform={`translate(${coords.int_delhi_gate.x + 25}, ${coords.int_delhi_gate.y + 10})`}>
            <rect width="14" height="14" rx="2" fill="var(--panel-2)" stroke="var(--ok)" strokeWidth="1.5" />
            <text x="7" y="11" textAnchor="middle" fill="var(--ok)" fontSize="10" fontWeight="700">H</text>
            <text x="20" y="11" fill="var(--text)" fontSize="10" fontWeight="600">LNJP Hospital</text>
            <line x1="-5" y1="7" x2="-25" y2="-10" stroke="var(--text-3)" strokeDasharray="2 2" />
          </g>

          {/* Sushruta attached to Civil Lines */}
          <g transform={`translate(${coords.int_civil_lines.x - 90}, ${coords.int_civil_lines.y - 20})`}>
            <rect width="14" height="14" rx="2" fill="var(--panel-2)" stroke="var(--ok)" strokeWidth="1.5" />
            <text x="7" y="11" textAnchor="middle" fill="var(--ok)" fontSize="10" fontWeight="700">H</text>
            <text x="20" y="11" fill="var(--text)" fontSize="10" fontWeight="600">Sushruta Trauma</text>
            <line x1="14" y1="7" x2="90" y2="20" stroke="var(--text-3)" strokeDasharray="2 2" />
          </g>

          {/* Depots */}
          {/* North Depot at Civil Lines */}
          <g transform={`translate(${coords.int_civil_lines.x - 20}, ${coords.int_civil_lines.y + 15})`}>
            <polygon points="6,0 12,12 0,12" fill="var(--accent)" />
            <text x="16" y="10" fill="var(--accent)" fontSize="9" fontFamily="var(--font-mono)">Depot North</text>
          </g>

          {/* South Depot at Delhi Gate */}
          <g transform={`translate(${coords.int_delhi_gate.x - 30}, ${coords.int_delhi_gate.y + 20})`}>
            <polygon points="6,0 12,12 0,12" fill="var(--accent)" />
            <text x="16" y="10" fill="var(--accent)" fontSize="9" fontFamily="var(--font-mono)">Depot South</text>
          </g>

          {/* Synthetic Telecom Towers (shown if highlightSynthetic is true) */}
          {highlightSynthetic && (
            <>
              {/* North Ridge Tower */}
              <g transform={`translate(${coords.int_chandgiram.x + 30}, ${coords.int_chandgiram.y - 20})`}>
                <circle cx="6" cy="6" r="6" fill="var(--panel)" stroke="var(--synthetic)" strokeDasharray="2 2" />
                <text x="16" y="9" fill="var(--synthetic)" fontSize="9">🗼 Tower Ridge (HQ)</text>
              </g>
              {/* ISBT Relay Tower */}
              <g transform={`translate(${coords.int_kashmere_gate.x + 20}, ${coords.int_kashmere_gate.y - 10})`}>
                <circle cx="6" cy="6" r="6" fill="var(--panel)" stroke="var(--synthetic)" strokeDasharray="2 2" />
                <text x="16" y="9" fill="var(--synthetic)" fontSize="9">🗼 Tower ISBT</text>
              </g>
            </>
          )}
        </svg>

        {/* Counterfactual Branch banner watermark when in frame 2, 3, or 4 */}
        {frameIndex >= 2 && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              backgroundColor: 'rgba(176, 124, 255, 0.15)',
              border: '1px solid var(--branch)',
              color: 'var(--branch)',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>COUNTERFACTUAL BRANCH ACTIVE</span>
            <span style={{ color: 'var(--text-3)' }}>•</span>
            <span className="mono">jaal_branch_{selectedCaseId || 'preview'}</span>
          </div>
        )}
      </div>

      {/* Accessible Entity List Overlay (AX-07) */}
      {showEntityList && (
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            maxHeight: '220px',
            backgroundColor: 'var(--panel)',
            borderTop: '1px solid var(--line)',
            padding: '12px 16px',
            overflowY: 'auto',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <strong style={{ fontSize: '12px' }}>Network Entity Table (Screen-Reader Equivalent)</strong>
            <button onClick={() => setShowEntityList(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>Close ✕</button>
          </div>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                <th style={{ padding: '4px' }}>Entity ID</th>
                <th style={{ padding: '4px' }}>Type</th>
                <th style={{ padding: '4px' }}>Status</th>
                <th style={{ padding: '4px' }}>Provenance</th>
              </tr>
            </thead>
            <tbody>
              {CORRIDOR_EDGES.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(36,48,64,0.4)' }}>
                  <td className="mono" style={{ padding: '4px' }}>{c.id}</td>
                  <td style={{ padding: '4px' }}>Road Corridor</td>
                  <td style={{ padding: '4px' }}>{severedCorridors.has(c.id) ? 'SEVERED' : 'OPERATIONAL'}</td>
                  <td style={{ padding: '4px' }}>reference_derived</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};
