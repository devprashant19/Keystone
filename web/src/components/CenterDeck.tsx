import React, { useState, useEffect } from 'react';
import { WorldSummary } from '../graph/types';
import { GraphContainer } from '../graph/GraphContainer';

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
  worldSummary?: WorldSummary | null;
  onOpenEvidence?: (caseId: string) => void;
  branchName?: string;
}

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
  worldSummary: propWorldSummary,
  onOpenEvidence,
  branchName,
}) => {
  const [worldSummary, setWorldSummary] = useState<WorldSummary | null>(propWorldSummary || null);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  useEffect(() => {
    if (propWorldSummary) {
      setWorldSummary(propWorldSummary);
      return;
    }
    fetch('/api/world/summary')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load world summary');
        return res.json();
      })
      .then((data: WorldSummary) => {
        setWorldSummary(data);
      })
      .catch((err) => {
        console.error('CenterDeck failed to fetch world summary:', err);
      });
  }, [propWorldSummary]);

  // Determine severed corridors based on frame index
  const isF1Severed = frameIndex >= 1 && Boolean(f1Corridor);
  const isF2Severed = frameIndex >= 3 && Boolean(f2Corridor);

  const severedCorridorIds = new Set<string>();
  if (isF1Severed) severedCorridorIds.add(f1Corridor);
  if (isF2Severed) severedCorridorIds.add(f2Corridor);

  // Counterfactual branch ID if in frame 2, 3, or 4
  const activeBranchId = frameIndex >= 2 ? (branchName || `preview_${selectedCaseId || 'branch'}`) : null;

  if (!worldSummary) {
    return (
      <main
        style={{
          flex: 1,
          backgroundColor: 'var(--bg-void)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink-lo)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-cap)',
        }}
        role="main"
      >
        Connecting to FalkorDB World Topology…
      </main>
    );
  }

  return (
    <main
      style={{
        flex: 1,
        backgroundColor: 'var(--bg-void)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
      role="main"
      aria-label="Delhi Road Network and Infrastructure Topology"
    >
      <GraphContainer
        world={worldSummary}
        viewMode={viewMode}
        onToggleViewMode={onToggleViewMode}
        selectedEntityId={selectedEntityId}
        onSelectEntity={(id) => {
          setSelectedEntityId(id);
          onSelectEntity(id);
        }}
        branchId={activeBranchId}
        severedCorridorIds={severedCorridorIds}
        showSyntheticOverlay={highlightSynthetic}
        onToggleSynthetic={onToggleSynthetic}
        highlightSevered={highlightSevered}
        onToggleSevered={onToggleSevered}
        onOpenEvidence={onOpenEvidence}
        selectedCaseId={selectedCaseId}
      />
    </main>
  );
};
