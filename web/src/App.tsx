import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LeftRail, Corridor } from './components/LeftRail';
import { CenterDeck } from './components/CenterDeck';
import { RightRail } from './components/RightRail';
import { FrameBar } from './components/FrameBar';
import { DecisionModal } from './components/DecisionModal';
import { HistoryModal } from './components/HistoryModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { EvidenceView } from './routes/EvidenceView';
import { MethodView } from './routes/MethodView';

export const App: React.FC = () => {
  // Navigation & route state
  const [currentRoute, setCurrentRouteState] = useState<string>(() => {
    return typeof window !== 'undefined' && window.location.pathname ? window.location.pathname : '/';
  });
  const [evidenceCaseId, setEvidenceCaseId] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/evidence/')) {
      return window.location.pathname.replace('/evidence/', '');
    }
    return '';
  });

  const setCurrentRoute = (route: string) => {
    setCurrentRouteState(route);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', route);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentRouteState(path);
      if (path.startsWith('/evidence/')) {
        setEvidenceCaseId(path.replace('/evidence/', ''));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // World & Health state
  const [worldDigest, setWorldDigest] = useState<string>('');
  const [configHash, setConfigHash] = useState<string>('');
  const [isDbHealthy, setIsDbHealthy] = useState<boolean>(true);
  const [corridors, setCorridors] = useState<Corridor[]>([]);

  // Sweep & Run state
  const [selectedF1, setSelectedF1] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [runData, setRunData] = useState<any>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [currentFrame, setCurrentFrame] = useState<number>(0);

  // Deck view state
  const [viewMode, setViewMode] = useState<'map' | 'topology'>('map');
  const [highlightSynthetic, setHighlightSynthetic] = useState<boolean>(false);
  const [highlightSevered, setHighlightSevered] = useState<boolean>(false);

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [decisionModal, setDecisionModal] = useState<{ isOpen: boolean; verdict: 'APPROVE' | 'REJECT' }>({
    isOpen: false,
    verdict: 'APPROVE',
  });
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);
  const [pastRuns, setPastRuns] = useState<any[]>([]);

  // 1. Initial World and Health load
  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Health check failed');
        return res.json();
      })
      .then((data) => {
        setWorldDigest(data.world_digest);
        setConfigHash(data.config_hash);
        setIsDbHealthy(true);
      })
      .catch(() => setIsDbHealthy(false));

    fetch('/api/world/summary')
      .then((res) => res.json())
      .then((data) => {
        if (data.corridors) {
          setCorridors(data.corridors);
        }
      })
      .catch((err) => console.error('Failed to load world summary', err));
  }, []);

  // 2. Global Keyboard Shortcuts (?, Esc, Left, Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?') {
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsShortcutsOpen(false);
        setIsHistoryOpen(false);
        setDecisionModal({ isOpen: false, verdict: 'APPROVE' });
      } else if (e.key === 'ArrowLeft') {
        setCurrentFrame((f) => Math.max(f - 1, 0));
      } else if (e.key === 'ArrowRight') {
        setCurrentFrame((f) => Math.min(f + 1, 4));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 3. Trigger Pre-Mortem Run Sweep
  const handleRunSweep = async () => {
    if (!selectedF1) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ f1_corridor_id: selectedF1 }),
      });
      if (!res.ok) throw new Error(`Run failed: ${res.statusText}`);
      const data = await res.json();
      setRunData(data);
      if (data.cases && data.cases.length > 0) {
        setSelectedCaseId(data.cases[0].case_id);
      }
      setCurrentFrame(1); // Advance to frame 1 (observed f1)
      setPastRuns((prev) => [
        {
          run_id: data.run_id,
          f1_corridor_id: data.f1_corridor_id,
          created_at: data.created_at,
          verdict: data.recommendation.verdict,
        },
        ...prev.filter((r) => r.run_id !== data.run_id),
      ]);
    } catch (err) {
      console.error(err);
      alert('Error triggering scenario sweep. Check FalkorDB connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Submit Commander Decision
  const handleDecisionSubmit = async (rationale: string, actor: string) => {
    if (!runData?.run_id) return;
    setIsSubmittingDecision(true);
    try {
      const res = await fetch(`/api/run/${runData.run_id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict: decisionModal.verdict,
          rationale,
          actor,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Decision submission failed');
      }
      const decData = await res.json();
      setRunData((prev: any) => ({
        ...prev,
        decision: decData,
      }));
      setDecisionModal({ isOpen: false, verdict: 'APPROVE' });
    } catch (e: any) {
      alert(`Error recording decision: ${e.message}`);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Extract selected f2 from selectedCaseId
  const f2Corridor = selectedCaseId.includes('__') ? selectedCaseId.split('__')[1] : '';

  // Render secondary routes
  if (currentRoute === '/method') {
    return (
      <>
        <Header
          worldDigest={worldDigest}
          configHash={configHash}
          isDbHealthy={isDbHealthy}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onNavigate={setCurrentRoute}
          currentRoute={currentRoute}
        />
        <MethodView onBack={() => setCurrentRoute('/')} configHash={configHash} worldDigest={worldDigest} />
      </>
    );
  }

  if (currentRoute.startsWith('/evidence')) {
    return (
      <>
        <Header
          worldDigest={worldDigest}
          configHash={configHash}
          isDbHealthy={isDbHealthy}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onNavigate={setCurrentRoute}
          currentRoute={currentRoute}
        />
        <EvidenceView
          caseId={evidenceCaseId || selectedCaseId}
          runId={runData?.run_id || ''}
          onBack={() => setCurrentRoute('/')}
        />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* 1. Header */}
      <Header
        worldDigest={worldDigest}
        configHash={configHash}
        isDbHealthy={isDbHealthy}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNavigate={setCurrentRoute}
        currentRoute={currentRoute}
      />

      {/* 2. Main 3-Column Deck */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Rail (320px) */}
        <LeftRail
          corridors={corridors}
          selectedF1={selectedF1}
          onSelectF1={setSelectedF1}
          onRunSweep={handleRunSweep}
          isLoading={isLoading}
          cases={runData?.cases || []}
          selectedCaseId={selectedCaseId}
          onSelectCase={setSelectedCaseId}
          isDbDown={!isDbHealthy}
        />

        {/* Center Deck (Flex) */}
        <CenterDeck
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          selectedCaseId={selectedCaseId}
          f1Corridor={selectedF1}
          f2Corridor={f2Corridor}
          frameIndex={currentFrame}
          onSelectEntity={(id) => {
            if (id.startsWith('road_')) {
              setSelectedCaseId(`${selectedF1}__${id}`);
            }
          }}
          highlightSynthetic={highlightSynthetic}
          onToggleSynthetic={() => setHighlightSynthetic(!highlightSynthetic)}
          highlightSevered={highlightSevered}
          onToggleSevered={() => setHighlightSevered(!highlightSevered)}
        />

        {/* Right Rail (380px) */}
        <RightRail
          runData={runData}
          selectedCaseId={selectedCaseId}
          onOpenDecisionModal={(verdict) => setDecisionModal({ isOpen: true, verdict })}
          onNavigateToEvidence={(caseId) => {
            setEvidenceCaseId(caseId);
            setCurrentRoute(`/evidence/${caseId}`);
          }}
        />
      </div>

      {/* 3. Bottom Frame Bar (56px) */}
      <FrameBar
        currentFrame={currentFrame}
        onSelectFrame={setCurrentFrame}
        branchName={runData ? `jaal_branch_${runData.run_id}_${selectedCaseId}` : ''}
      />

      {/* Modals */}
      <DecisionModal
        isOpen={decisionModal.isOpen}
        verdict={decisionModal.verdict}
        onClose={() => setDecisionModal({ isOpen: false, verdict: 'APPROVE' })}
        onSubmit={handleDecisionSubmit}
        isSubmitting={isSubmittingDecision}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        pastRuns={pastRuns}
        onSelectRun={async (rId) => {
          try {
            const res = await fetch(`/api/run/${rId}`);
            const data = await res.json();
            setRunData(data);
            setSelectedF1(data.f1_corridor_id);
            if (data.cases?.length) setSelectedCaseId(data.cases[0].case_id);
          } catch (e) {
            console.error('Failed to open past run', e);
          }
        }}
      />

      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
};

export default App;
