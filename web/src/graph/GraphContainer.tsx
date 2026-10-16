import React, { useState, useRef } from 'react';
import { WorldSummary } from './types';
import { GeographicView } from './GeographicView';
import { SchematicView } from './SchematicView';
import { EntityList } from './EntityList';

interface GraphContainerProps {
  world: WorldSummary;
  viewMode: 'map' | 'topology';
  onToggleViewMode: (mode: 'map' | 'topology') => void;
  selectedEntityId?: string;
  onSelectEntity: (id: string, kind: string) => void;
  branchId?: string | null;
  severedCorridorIds?: Set<string>;
  degradedCorridorIds?: Set<string>;
  selectedRouteCorridorIds?: Set<string>;
  showSyntheticOverlay?: boolean;
  onToggleSynthetic?: () => void;
  highlightSevered?: boolean;
  onToggleSevered?: () => void;
  onOpenEvidence?: (caseId: string) => void;
  selectedCaseId?: string;
}

export const GraphContainer: React.FC<GraphContainerProps> = ({
  world,
  viewMode,
  onToggleViewMode,
  selectedEntityId,
  onSelectEntity,
  branchId,
  severedCorridorIds = new Set(),
  degradedCorridorIds = new Set(),
  selectedRouteCorridorIds = new Set(),
  showSyntheticOverlay = false,
  onToggleSynthetic,
  highlightSevered = false,
  onToggleSevered,
  onOpenEvidence,
  selectedCaseId,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showEntityList, setShowEntityList] = useState<boolean>(false);

  // Tooltip state
  const [tooltipMeta, setTooltipMeta] = useState<{ id: string; meta: any } | null>(null);
  const tooltipTimerRef = useRef<any>(null);

  const handleHover = (id: string | null, meta?: any) => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    if (!id) {
      setTooltipMeta(null);
      return;
    }
    tooltipTimerRef.current = setTimeout(() => {
      setTooltipMeta({ id, meta });
    }, 400);
  };

  const isCounterfactual = Boolean(branchId);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'map') return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || viewMode !== 'map') return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div
      className={`graph-canvas-container ${isCounterfactual ? 'has-branch' : 'base-world'}`}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'var(--bg-void)',
        overflow: 'hidden',
        border: isCounterfactual ? '1px solid var(--branch)' : 'none',
        boxShadow: isCounterfactual ? 'var(--branch-glow)' : 'none',
      }}
      role="region"
      aria-label="Interactive Graph Canvas"
    >
      {/* Top Controls Toolbar */}
      <div
        style={{
          height: '44px',
          borderBottom: '1px solid var(--line-hair)',
          backgroundColor: 'var(--bg-panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--s4)',
          zIndex: 10,
        }}
      >
        {/* View Mode Toggle: Map vs Schematic */}
        <div style={{ display: 'flex', gap: 'var(--s1)' }} className="view-mode-toggles">
          <button
            onClick={() => onToggleViewMode('map')}
            className={`tab-geographic ${viewMode === 'map' ? 'active' : ''}`}
            style={{
              padding: 'var(--s1) var(--s3)',
              borderRadius: 'var(--r-ctl)',
              border: '1px solid var(--line-hair)',
              backgroundColor: viewMode === 'map' ? 'var(--bg-raised)' : 'transparent',
              color: viewMode === 'map' ? 'var(--accent)' : 'var(--ink-lo)',
              fontWeight: 600,
              fontSize: 'var(--fs-cap)',
              cursor: 'pointer',
            }}
          >
            Geographic Map
          </button>
          <button
            onClick={() => onToggleViewMode('topology')}
            className={`tab-schematic ${viewMode === 'topology' ? 'active' : ''}`}
            style={{
              padding: 'var(--s1) var(--s3)',
              borderRadius: 'var(--r-ctl)',
              border: '1px solid var(--line-hair)',
              backgroundColor: viewMode === 'topology' ? 'var(--bg-raised)' : 'transparent',
              color: viewMode === 'topology' ? 'var(--accent)' : 'var(--ink-lo)',
              fontWeight: 600,
              fontSize: 'var(--fs-cap)',
              cursor: 'pointer',
            }}
          >
            Schematic Topology
          </button>
        </div>

        {/* Legend buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
          {onToggleSynthetic && (
            <button
              onClick={onToggleSynthetic}
              className={`legend-synthetic ${showSyntheticOverlay ? 'active' : ''}`}
              style={{
                fontSize: 'var(--fs-micro)',
                background: showSyntheticOverlay ? 'var(--bg-sunken)' : 'transparent',
                border: '1px dashed var(--synthetic)',
                color: 'var(--ink-mid)',
                padding: '2px var(--s2)',
                borderRadius: 'var(--r-chip)',
                cursor: 'pointer',
              }}
              title="Toggle synthetic telecom/power overlay"
            >
              SYNTHETIC LAYERS
            </button>
          )}

          {onToggleSevered && (
            <button
              onClick={onToggleSevered}
              className={`legend-severed ${highlightSevered ? 'active' : ''}`}
              style={{
                fontSize: 'var(--fs-micro)',
                background: highlightSevered ? 'var(--fail-wash)' : 'transparent',
                border: '1px solid var(--fail)',
                color: 'var(--fail)',
                padding: '2px var(--s2)',
                borderRadius: 'var(--r-chip)',
                cursor: 'pointer',
              }}
              title="Toggle severed corridors highlight"
            >
              SEVERED ARCS ({severedCorridorIds.size})
            </button>
          )}

          <button
            onClick={() => setShowEntityList(!showEntityList)}
            style={{
              fontSize: 'var(--fs-micro)',
              background: showEntityList ? 'var(--bg-sunken)' : 'var(--bg-raised)',
              border: '1px solid var(--line-hair)',
              color: 'var(--ink-hi)',
              padding: '2px var(--s2)',
              borderRadius: 'var(--r-chip)',
              cursor: 'pointer',
            }}
          >
            {showEntityList ? 'Hide Entity Registry' : 'Entity Registry'}
          </button>

          {/* Zoom controls */}
          <div style={{ display: 'flex', gap: '2px', marginLeft: 'var(--s2)' }}>
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 2.0))}
              style={{ padding: '2px var(--s2)', background: 'var(--bg-raised)', border: '1px solid var(--line-hair)', color: 'var(--ink-hi)', cursor: 'pointer', borderRadius: 'var(--r-chip)' }}
            >
              +
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
              style={{ padding: '2px var(--s2)', background: 'var(--bg-raised)', border: '1px solid var(--line-hair)', color: 'var(--ink-hi)', cursor: 'pointer', borderRadius: 'var(--r-chip)' }}
            >
              −
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              style={{ padding: '2px var(--s2)', background: 'var(--bg-raised)', border: '1px solid var(--line-hair)', color: 'var(--ink-hi)', cursor: 'pointer', borderRadius: 'var(--r-chip)' }}
            >
              0
            </button>
          </div>
        </div>
      </div>

      {/* Main Graph Viewport */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          cursor: viewMode === 'map' ? (isPanning ? 'grabbing' : 'grab') : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: viewMode === 'map' ? `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` : 'none',
            transformOrigin: 'center center',
          }}
        >
          {viewMode === 'map' ? (
            <GeographicView
              world={world}
              selectedEntityId={selectedEntityId}
              onSelectEntity={onSelectEntity}
              hoveredEntityId={tooltipMeta?.id}
              onHoverEntity={handleHover}
              severedCorridorIds={severedCorridorIds}
              degradedCorridorIds={degradedCorridorIds}
              selectedRouteCorridorIds={selectedRouteCorridorIds}
              showSyntheticOverlay={showSyntheticOverlay}
              highlightSevered={highlightSevered}
            />
          ) : (
            <SchematicView
              world={world}
              selectedEntityId={selectedEntityId}
              onSelectEntity={onSelectEntity}
              hoveredEntityId={tooltipMeta?.id}
              onHoverEntity={handleHover}
              severedCorridorIds={severedCorridorIds}
              degradedCorridorIds={degradedCorridorIds}
              selectedRouteCorridorIds={selectedRouteCorridorIds}
            />
          )}
        </div>

        {/* Top-left Counterfactual Branch Chip (Only if counterfactual state active) */}
        {isCounterfactual && (
          <div
            className="branch-chip"
            style={{
              position: 'absolute',
              top: 'var(--s3)',
              left: 'var(--s3)',
              backgroundColor: 'var(--branch-wash)',
              border: '1px solid var(--branch)',
              color: 'var(--branch)',
              padding: 'var(--s1) var(--s3)',
              borderRadius: 'var(--r-ctl)',
              fontSize: 'var(--fs-micro)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--s2)',
              boxShadow: 'var(--branch-glow)',
              pointerEvents: 'none',
            }}
          >
            <span>BRANCH</span>
            <span className="mono">{branchId}</span>
          </div>
        )}

        {/* Hover Tooltip */}
        {tooltipMeta && (
          <div
            className="graph-tooltip"
            style={{
              position: 'absolute',
              bottom: 'var(--s4)',
              right: 'var(--s4)',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--line-hair)',
              borderRadius: 'var(--r-ctl)',
              padding: 'var(--s3)',
              maxWidth: '300px',
              fontSize: 'var(--fs-micro)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              zIndex: 20,
              pointerEvents: 'none',
            }}
          >
            <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '2px' }}>
              {tooltipMeta.meta?.type}: {tooltipMeta.id}
            </div>
            {Object.entries(tooltipMeta.meta || {})
              .filter(([k]) => k !== 'type')
              .map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: 'var(--ink-lo)' }}>{key}:</span>
                  <span className="mono" style={{ color: 'var(--ink-hi)' }}>{String(val)}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Accessible Entity List Overlay */}
      {showEntityList && (
        <div style={{ maxHeight: '200px', overflowY: 'auto', borderTop: '1px solid var(--line-hair)' }}>
          <EntityList
            world={world}
            selectedEntityId={selectedEntityId}
            onSelectEntity={onSelectEntity}
            onOpenEvidence={onOpenEvidence}
            selectedCaseId={selectedCaseId}
            severedCorridorIds={severedCorridorIds}
          />
        </div>
      )}
    </div>
  );
};
