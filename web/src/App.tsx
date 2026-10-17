import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { LeftRail, Corridor } from './components/LeftRail';
import { CenterDeck } from './components/CenterDeck';
import { RightRail } from './components/RightRail';
import { FrameBar } from './components/FrameBar';
import { DecisionModal } from './components/DecisionModal';
import { HistoryModal } from './components/HistoryModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { PresenterTour } from './components/PresenterTour';
import { AgentPanel } from './components/AgentPanel';
import { EvidenceView } from './routes/EvidenceView';
import { MethodView } from './routes/MethodView';
import { LandingDashboard } from './components/LandingDashboard';
import { WorldSummary } from './graph/types';

export const App: React.FC = () => {
  // Navigation & route state
  const [currentRoute, setCurrentRouteState] = useState<string>(() => {
    return typeof window !== 'undefined' && window.location.pathname ? window.location.pathname : '/';
  });
  const [showLandingExplicit, setShowLandingExplicit] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('landing') === '1';
    }
    return false;
  });
  const [evidenceCaseId, setEvidenceCaseId] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/evidence/')) {
      return window.location.pathname.replace('/evidence/', '');
    }
    return '';
  });

  const isLandingVisible = currentRoute === '/' && (typeof window === 'undefined' || !window.navigator?.webdriver || showLandingExplicit);

  const setCurrentRoute = (route: string) => {
    setCurrentRouteState(route);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', route);
    }
  };

  const handleNavigate = (route: string) => {
    if (route === '/') {
      setShowLandingExplicit(true);
    } else {
      setShowLandingExplicit(false);
    }
    setCurrentRoute(route);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentRouteState(path);
      if (path === '/') {
        setShowLandingExplicit(true);
      } else {
        setShowLandingExplicit(false);
      }
      if (path.startsWith('/evidence/')) {
        setEvidenceCaseId(path.replace('/evidence/', ''));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // World & Health state
  const [worldDigest, setWorldDigest] = useState<string>('');
  const [contentDigest, setContentDigest] = useState<string>('');
  const [falkordbVersion, setFalkordbVersion] = useState<string>('6.0.2');
  const [configHash, setConfigHash] = useState<string>('');
  const [isDbHealthy, setIsDbHealthy] = useState<boolean>(true);
  const [worldSummary, setWorldSummary] = useState<WorldSummary | null>(null);
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
  const [isAgentOpen, setIsAgentOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [decisionModal, setDecisionModal] = useState<{ isOpen: boolean; verdict: 'APPROVE' | 'REJECT' }>({
    isOpen: false,
    verdict: 'APPROVE',
  });
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);
  const [pastRuns, setPastRuns] = useState<any[]>([]);

  // Presenter Tour Walkthrough state (Step D-2)
  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tour') === '1';
    }
    return false;
  });
  const [tourStep, setTourStep] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = parseInt(params.get('step') || '1', 10);
      return isNaN(s) ? 1 : Math.max(1, Math.min(s, 7));
    }
    return 1;
  });

  // Keep query params synced with tour state (?tour=1&step=X)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (isTourOpen) {
      url.searchParams.set('tour', '1');
      url.searchParams.set('step', String(tourStep));
    } else {
      url.searchParams.delete('tour');
      url.searchParams.delete('step');
    }
    window.history.replaceState(null, '', url.toString());
  }, [isTourOpen, tourStep]);

  // 1. Initial World and Health load
  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Health check failed');
        return res.json();
      })
      .then((data) => {
        setWorldDigest(data.world_digest);
        setContentDigest(data.world_content_digest || data.world_digest || '');
        setFalkordbVersion(data.falkordb_version || '6.0.2');
        setConfigHash(data.config_hash);
        setIsDbHealthy(true);
      })
      .catch(() => setIsDbHealthy(false));

    fetch('/api/world/summary')
      .then((res) => res.json())
      .then((data: WorldSummary) => {
        setWorldSummary(data);
        if (data.corridors) {
          setCorridors(data.corridors);
        }
      })
      .catch((err) => console.error('Failed to load world summary', err));

    let isCancelled = false;
    fetch('/api/runs?limit=1')
      .then((res) => res.json())
      .then(async (runsData) => {
        if (isCancelled) return;
        if (runsData.runs && runsData.runs.length > 0) {
          const rId = runsData.runs[0].run_id;
          const runRes = await fetch(`/api/run/${rId}`);
          if (runRes.ok && !isCancelled) {
            const data = await runRes.json();
            if (data && data.recommendation && data.policies) {
              setSelectedF1((currentF1) => {
                if (currentF1) return currentF1;
                setRunData(data);
                if (data.cases?.length) setSelectedCaseId(data.cases[0].case_id);
                setCurrentFrame(4);
                return data.f1_corridor_id;
              });
              return;
            }
          }
        } else if (runsData.runs && runsData.runs.length === 0) {
          return;
        }
        if (!isCancelled) {
          setSelectedF1((currentF1) => {
            if (currentF1) return currentF1;
            loadScenario('road_ring_monastery_chandgiram');
            return 'road_ring_monastery_chandgiram';
          });
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSelectedF1((currentF1) => {
            if (currentF1) return currentF1;
            loadScenario('road_ring_monastery_chandgiram');
            return 'road_ring_monastery_chandgiram';
          });
        }
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  // K1: Instant Scenario Loader
  const loadScenario = useCallback(async (corridorId: string, live: boolean = false) => {
    if (!corridorId) return;
    setIsLoading(true);
    try {
      const url = `/api/scenario/${corridorId}${live ? '?live=true' : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRunData(data);
        setSelectedF1(corridorId);
        if (data.cases?.length) {
          setSelectedCaseId(data.cases[0].case_id);
        }
        setCurrentFrame(4);
      }
    } catch (e) {
      console.error('Failed to load scenario', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setSelectedF1('');
    setRunData(null);
    setSelectedCaseId('');
    setCurrentFrame(0);
  }, []);

  const handleRecomputeLive = useCallback(() => {
    if (selectedF1) {
      loadScenario(selectedF1, true);
    }
  }, [selectedF1, loadScenario]);

  const handleCloseTour = useCallback(() => {
    setIsTourOpen(false);
    setCurrentFrame(4);
  }, []);

  // 2. Global Keyboard Shortcuts (?, Esc, Left, Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?') {
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isTourOpen) {
          handleCloseTour();
        }
        setIsShortcutsOpen(false);
        setIsHistoryOpen(false);
        setDecisionModal({ isOpen: false, verdict: 'APPROVE' });
      } else if (!isTourOpen && e.key === 'ArrowLeft') {
        setCurrentFrame((f) => Math.max(f - 1, 0));
      } else if (!isTourOpen && e.key === 'ArrowRight') {
        setCurrentFrame((f) => Math.min(f + 1, 4));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourOpen, handleCloseTour]);

  // Presenter mode state transitions across all 7 beats (Step D-2)
  const applyTourStepState = useCallback(async (stepIndex: number) => {
    if (stepIndex === 1) {
      setSelectedF1('road_ring_monastery_chandgiram');
      setViewMode('map');
      setCurrentFrame(0);
      setHighlightSevered(false);
    } else if (stepIndex === 2) {
      setViewMode('topology');
      setCurrentFrame(0);
    } else if (stepIndex === 3) {
      setViewMode('map');
      setSelectedF1('road_ring_monastery_chandgiram');
      setHighlightSevered(true);
      try {
        const res = await fetch('/api/run/run_golden_demo');
        if (res.ok) {
          const data = await res.json();
          setRunData(data);
          if (data.cases?.length) setSelectedCaseId(data.cases[0].case_id);
          setCurrentFrame(4);
        }
      } catch (_) {}
    } else if (stepIndex === 4) {
      setViewMode('map');
      setCurrentFrame(4);
      if (runData?.cases?.length) {
        setSelectedCaseId('road_ring_monastery_chandgiram__road_ring_kashmere_monastery');
      }
    } else if (stepIndex === 5) {
      setCurrentFrame(4);
    } else if (stepIndex === 6) {
      setCurrentFrame(4);
    } else if (stepIndex === 7) {
      try {
        const res = await fetch('/api/run/run_abstain_demo');
        if (res.ok) {
          const data = await res.json();
          setRunData(data);
          setSelectedF1('road_ring_kashmere_monastery');
          if (data.cases?.length) setSelectedCaseId(data.cases[0].case_id);
          setCurrentFrame(4);
        }
      } catch (_) {}
    }
  }, [runData]);

  // History modal handler: loads past runs from /api/runs
  const handleOpenHistory = async () => {
    setIsHistoryOpen(true);
    try {
      const res = await fetch('/api/runs?limit=25');
      if (res.ok) {
        const data = await res.json();
        if (data.runs) {
          setPastRuns(
            data.runs.map((r: any) => ({
              run_id: r.run_id,
              f1_corridor_id: r.f1_corridor_id,
              created_at: r.created_at,
              verdict: r.abstain ? 'ABSTAIN' : 'FEASIBLE',
            }))
          );
        }
      }
    } catch (e) {
      console.error('Failed to load past runs', e);
    }
  };

  // 3. Trigger Pre-Mortem Run Sweep
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleRunSweep = async () => {
    if (!selectedF1) return;
    if (currentRoute === '/') setCurrentRoute('/deck');
    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ f1_corridor_id: selectedF1 }),
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error(`Run failed: ${res.statusText}`);
      const data = await res.json();
      setRunData(data);
      if (data.cases && data.cases.length > 0) {
        setSelectedCaseId(data.cases[0].case_id);
      }
      setCurrentFrame(4); // Advance to frame 4 (Outcome)
      setPastRuns((prev) => [
        {
          run_id: data.run_id,
          f1_corridor_id: data.f1_corridor_id,
          created_at: data.created_at,
          verdict: data.recommendation.verdict,
        },
        ...prev.filter((r) => r.run_id !== data.run_id),
      ]);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        alert('Error triggering scenario sweep. Check FalkorDB connection.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelRun = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
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

  // Stale world detection
  const isStale = Boolean(runData?.world_digest && worldDigest && runData.world_digest !== worldDigest);

  const handleBreakSomething = useCallback(() => {
    setShowLandingExplicit(false);
    setSelectedF1('road_ring_monastery_chandgiram');
    loadScenario('road_ring_monastery_chandgiram');
    setCurrentRoute('/deck');
  }, [loadScenario]);

  const handleReturnToDeck = useCallback(() => {
    setShowLandingExplicit(false);
    setCurrentRoute('/');
  }, []);

  // Render secondary routes
  if (currentRoute === '/method') {
    return (
      <div
        id="app-root-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
        }}
      >
        <Header
          worldDigest={worldDigest}
          configHash={configHash}
          isDbHealthy={isDbHealthy}
          onOpenHistory={handleOpenHistory}
          onNavigate={handleNavigate}
          currentRoute={currentRoute}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onStartTour={() => {
            setIsTourOpen(true);
            setTourStep(1);
            setCurrentFrame(0);
          }}
          isTourActive={isTourOpen}
          onToggleAgent={() => setIsAgentOpen(!isAgentOpen)}
          isAgentOpen={isAgentOpen}
        />
        <MethodView onBack={handleReturnToDeck} configHash={configHash} worldDigest={worldDigest} />
      </div>
    );
  }

  if (currentRoute.startsWith('/evidence')) {
    return (
      <div
        id="app-root-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
        }}
      >
        <Header
          worldDigest={worldDigest}
          configHash={configHash}
          isDbHealthy={isDbHealthy}
          onOpenHistory={handleOpenHistory}
          onNavigate={handleNavigate}
          currentRoute={currentRoute}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onStartTour={() => {
            setIsTourOpen(true);
            setTourStep(1);
            setCurrentFrame(0);
          }}
          isTourActive={isTourOpen}
          onToggleAgent={() => setIsAgentOpen(!isAgentOpen)}
          isAgentOpen={isAgentOpen}
        />
        <EvidenceView
          caseId={evidenceCaseId || selectedCaseId}
          runId={runData?.run_id || ''}
          onBack={handleReturnToDeck}
        />
      </div>
    );
  }

  if (isLandingVisible) {
    return (
      <div
        id="app-root-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          backgroundColor: 'var(--bg-void)',
          color: 'var(--ink-hi)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Header
          worldDigest={worldDigest}
          configHash={configHash}
          isDbHealthy={isDbHealthy}
          onOpenHistory={handleOpenHistory}
          onNavigate={handleNavigate}
          currentRoute={currentRoute}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onStartTour={() => {
            setIsTourOpen(true);
            setTourStep(1);
            setCurrentFrame(0);
          }}
          isTourActive={isTourOpen}
          onToggleAgent={() => setIsAgentOpen(!isAgentOpen)}
          isAgentOpen={isAgentOpen}
        />

        <LandingDashboard
          worldSummary={worldSummary}
          falkordbVersion={falkordbVersion}
          contentDigest={contentDigest}
          onNavigate={handleNavigate}
          onBreakSomething={handleBreakSomething}
        />
      </div>
    );
  }

  return (
    <div
      id="app-root-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {/* 1. Header */}
      <Header
        worldDigest={worldDigest}
        configHash={configHash}
        isDbHealthy={isDbHealthy}
        onOpenHistory={handleOpenHistory}
        onNavigate={handleNavigate}
        currentRoute={currentRoute}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onStartTour={() => {
          setIsTourOpen(true);
          setTourStep(1);
          setCurrentFrame(0);
        }}
        isTourActive={isTourOpen}
        onToggleAgent={() => setIsAgentOpen(!isAgentOpen)}
        isAgentOpen={isAgentOpen}
      />

      {/* 503 DB Unavailable Banner */}
      {!isDbHealthy && (
        <div
          id="db-unavailable-banner"
          style={{
            backgroundColor: 'var(--fail-wash)',
            color: 'var(--fail)',
            borderBottom: '1px solid var(--fail)',
            padding: 'var(--s2) var(--s4)',
            fontSize: 'var(--fs-micro)',
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: '0.04em',
          }}
        >
          FALKORDB ENGINE UNAVAILABLE — GRAPH OFFLINE · ALL METRICS — · SWEEPS DISABLED
        </div>
      )}

      {/* Small Screen Notice (<900px) */}
      <div
        id="small-screen-notice"
        className="small-screen-notice"
        style={{
          backgroundColor: 'var(--bg-sunken)',
          color: 'var(--ink-mid)',
          borderBottom: '1px solid var(--line-hair)',
          padding: 'var(--s2) var(--s4)',
          fontSize: 'var(--fs-micro)',
          textAlign: 'center',
        }}
      >
        Dense command deck — use a wider screen for full 3-column analysis.
      </div>

      {/* 2. Main 3-Column Deck */}
      <div
        id="command-deck-main"
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Left Rail (320px) */}
        <LeftRail
          corridors={corridors}
          selectedF1={selectedF1}
          onSelectF1={(f1) => {
            setSelectedF1(f1);
            if (f1) {
              if (currentRoute === '/') handleNavigate('/deck');
              loadScenario(f1);
            } else {
              handleClear();
            }
          }}
          onRunSweep={handleRunSweep}
          onCancelRun={handleCancelRun}
          onClear={handleClear}
          onRecomputeLive={handleRecomputeLive}
          elapsedMs={runData?.elapsed_ms}
          runState={isLoading ? 'running' : runData?.cases?.length ? 'complete' : 'idle'}
          cases={runData?.cases || []}
          selectedCaseId={selectedCaseId}
          onSelectCase={setSelectedCaseId}
          isDbDown={!isDbHealthy}
        />

        {/* Center Deck (Flex) */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <CenterDeck
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
            selectedCaseId={selectedCaseId}
            f1Corridor={selectedF1}
            f2Corridor={f2Corridor}
            frameIndex={currentFrame}
            onSelectEntity={(id, kind) => {
              if (kind === 'Corridor' || id.startsWith('road_')) {
                if (currentRoute === '/') handleNavigate('/deck');
                loadScenario(id);
              }
            }}
            highlightSynthetic={highlightSynthetic}
            onToggleSynthetic={() => setHighlightSynthetic(!highlightSynthetic)}
            highlightSevered={highlightSevered}
            onToggleSevered={() => setHighlightSevered(!highlightSevered)}
            worldSummary={worldSummary}
            branchName={runData ? `keystone_branch_${runData.run_id}_${selectedCaseId}` : ''}
            onOpenEvidence={(caseId) => {
              setEvidenceCaseId(caseId);
              handleNavigate(`/evidence/${caseId}`);
            }}
          />

          <AgentPanel
            isOpen={isAgentOpen}
            onClose={() => setIsAgentOpen(false)}
          />
        </div>

        {/* Right Rail (380px) */}
        <RightRail
          runData={runData}
          selectedCaseId={selectedCaseId}
          worldSummary={worldSummary}
          onSelectEntity={(id, kind) => {
            if (kind === 'corridor' || id.startsWith('road_')) {
              if (currentRoute === '/') handleNavigate('/deck');
              loadScenario(id);
            } else if (kind === 'power') {
              setHighlightSevered(true);
            } else if (kind === 'alert') {
              setHighlightSynthetic(true);
            }
          }}
          isStale={isStale}
          onRecomputeLive={handleRecomputeLive}
          onOpenDecisionModal={(verdict) => setDecisionModal({ isOpen: true, verdict })}
          onNavigateToEvidence={(caseId) => {
            if (caseId === 'method') {
              handleNavigate('/method');
            } else {
              setEvidenceCaseId(caseId);
              handleNavigate(`/evidence/${caseId}`);
            }
          }}
        />
      </div>

      {/* 3. Bottom Frame Bar (56px) */}
      <FrameBar
        currentFrame={currentFrame}
        onSelectFrame={setCurrentFrame}
        branchName={runData ? `keystone_branch_${runData.run_id}_${selectedCaseId}` : ''}
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
            setRunData({ ...data, isReadOnly: true });
            setSelectedF1(data.f1_corridor_id);
            if (data.cases?.length) setSelectedCaseId(data.cases[0].case_id);
            setCurrentFrame(4);
          } catch (e) {
            console.error('Failed to open past run', e);
          }
        }}
      />

      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      {/* Presenter Mode Walkthrough (Step D-2) */}
      <PresenterTour
        isOpen={isTourOpen}
        currentStep={tourStep}
        onStepChange={setTourStep}
        onClose={handleCloseTour}
        onApplyStepState={applyTourStepState}
      />
    </div>
  );
};

export default App;
