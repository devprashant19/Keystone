import React from 'react';
import { WorldSummary, CorridorEdge, PowerFeederNode, TowerNode, RelayNode } from '../graph/types';

interface BlastRadiusProps {
  f1CorridorId: string;
  f2CorridorId?: string;
  worldSummary: WorldSummary | null;
  runData: any;
  selectedCaseId: string;
  onSelectEntity?: (entityId: string, kind?: string) => void;
  onNavigateToEvidence: (caseId: string) => void;
}

export const BlastRadius: React.FC<BlastRadiusProps> = ({
  f1CorridorId,
  f2CorridorId,
  worldSummary,
  runData,
  selectedCaseId,
  onSelectEntity,
  onNavigateToEvidence,
}) => {
  // Find f1 corridor
  const corridors = worldSummary?.corridors || [];
  const f1 = corridors.find((c) => c.id === f1CorridorId);
  const f2 = f2CorridorId ? corridors.find((c) => c.id === f2CorridorId) : null;

  const totalCorridors = corridors.length || 14;
  const severedCorridors: CorridorEdge[] = [];
  if (f1) severedCorridors.push(f1);
  if (f2 && f2.id !== f1?.id) severedCorridors.push(f2);
  const severedCorridorCount = severedCorridors.length || 1;

  // Power Layer
  const powerFeeders = worldSummary?.power_feeders || [];
  const totalPowerFeeders = powerFeeders.length || 7;
  const carriedFeederIds = new Set<string>();
  severedCorridors.forEach((c) => {
    (c.carries_feeder_ids || []).forEach((id) => carriedFeederIds.add(id));
  });
  const severedFeeders: PowerFeederNode[] = powerFeeders.filter(
    (pf) => carriedFeederIds.has(pf.id) || (f1CorridorId && pf.carrier_corridor_id === f1CorridorId)
  );

  // Alert Layer: Towers and Relays
  const towers = worldSummary?.towers || [];
  const totalTowers = towers.length || 8;
  const feedsTowerLinks = worldSummary?.feeds_tower_links || [];
  const darkTowerIds = new Set<string>();
  feedsTowerLinks.forEach((link) => {
    if (carriedFeederIds.has(link.feeder_id)) {
      darkTowerIds.add(link.tower_id);
    }
  });
  const unpoweredTowers: TowerNode[] = towers.filter((t) => darkTowerIds.has(t.id));

  const relays = worldSummary?.relays || [];
  const totalRelays = relays.length || 12;
  // If tower_chandgiram goes dark, relay_chandrawal and relay_dfs lose primary coverage
  const isolatedRelays: RelayNode[] = relays.filter((r) => {
    if (darkTowerIds.has('tower_chandgiram')) {
      return r.id === 'relay_chandrawal' || r.id === 'relay_dfs';
    }
    return false;
  });

  // Critical Facilities Impact (Hero Metric)
  const totalCriticalFacilities = 9; // Delhi topology: 10 facilities total, 9 critical (1 excluded: hospital_sushruta)
  const selectedCase = runData?.cases?.find((c: any) => c.case_id === selectedCaseId);
  
  // Breached critical facility count:
  // In Policy A (Baseline / No Action), breaches_a gives the facility breaches for this case.
  const breachesCount = typeof selectedCase?.breaches_a === 'number'
    ? selectedCase.breaches_a
    : runData?.recommendation?.exposed_count > 0
    ? 2
    : 0;

  const pctBreached = Math.min(100, Math.round((breachesCount / totalCriticalFacilities) * 100));

  const handleEntityClick = (entityId: string, kind: string = 'entity') => {
    if (onSelectEntity) {
      onSelectEntity(entityId, kind);
    }
  };

  return (
    <section
      id="blast-radius-panel"
      className="blast-radius-panel"
      style={{
        padding: '16px 18px',
        borderBottom: '1px solid var(--line-hair)',
        backgroundColor: 'var(--bg-panel)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
      aria-label="Blast Radius and Cyber-Physical Cascade"
    >
      {/* Header with Title and Provenance Shortcut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <div
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              color: 'var(--fail)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '12px' }}>💥</span>
            <span>BLAST RADIUS HERO</span>
          </div>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--ink-hi)',
              margin: '3px 0 0 0',
              letterSpacing: '0.01em',
            }}
          >
            Dependency Cascade
          </h2>
        </div>

        <button
          id="blast-evidence-shortcut-btn"
          onClick={() => onNavigateToEvidence(selectedCaseId || 'road_ring_monastery_chandgiram__road_ring_kashmere_monastery')}
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--line-hair)',
            borderRadius: '6px',
            color: 'var(--accent)',
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          title="Drill directly to FalkorDB causality evidence"
        >
          Inspect Proof ▸
        </button>
      </div>

      {/* 1. Hero Metric Card */}
      <div
        id="blast-hero-metric"
        style={{
          backgroundColor: 'var(--bg-sunken)',
          border: '1px solid var(--line-hair)',
          borderRadius: '10px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--ink-mid)', fontWeight: 700, letterSpacing: '0.05em' }}>
            CRITICAL FACILITIES OUTSIDE SLA
          </span>
          <span
            className="mono"
            style={{
              fontSize: '11px',
              color: 'var(--ink-mid)',
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--line-hair)',
              padding: '2px 7px',
              borderRadius: '5px',
              fontWeight: 500,
            }}
          >
            Deadline: 20m road / 5m alert
          </span>
        </div>

        {/* Large Metric & Baseline Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <div
              id="blast-hero-number"
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: breachesCount > 0 ? 'var(--fail)' : 'var(--ok)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              {breachesCount} / {totalCriticalFacilities}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-mid)' }}>
              breached <span className="mono" style={{ color: 'var(--ink-lo)', fontSize: '11px' }}>(baseline: 0 / {totalCriticalFacilities})</span>
            </div>
          </div>

          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '9999px',
              backgroundColor: breachesCount > 0 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: breachesCount > 0 ? 'var(--fail)' : 'var(--ok)',
              border: breachesCount > 0 ? '1px solid rgba(220, 38, 38, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
              letterSpacing: '0.03em',
            }}
          >
            {breachesCount > 0 ? 'SLA BREACH' : 'NORMAL SLA'}
          </div>
        </div>

        {/* Visual Delta Bar with Ghosted Baseline */}
        <div
          id="blast-delta-bar"
          style={{
            position: 'relative',
            height: '7px',
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--line-hair)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={breachesCount}
          aria-valuemin={0}
          aria-valuemax={totalCriticalFacilities}
          aria-label={`${breachesCount} of ${totalCriticalFacilities} critical facilities outside SLA`}
        >
          {/* Breached fraction fill */}
          <div
            className="motif-sever"
            style={{
              height: '100%',
              width: `${pctBreached}%`,
              background: breachesCount > 0 ? 'linear-gradient(90deg, #dc2626, #b91c1c)' : 'linear-gradient(90deg, #10b981, #059669)',
              borderRadius: '9999px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-lo)', marginTop: '1px' }}>
          <span>0 (Operational)</span>
          <span className="mono" style={{ fontWeight: 600, color: breachesCount > 0 ? 'var(--fail)' : 'var(--ok)' }}>
            {pctBreached}% System Degradation
          </span>
          <span>9 (Full Isolation)</span>
        </div>
      </div>

      {/* 2. Concentric Bands: Road -> Power -> Alert */}
      <div
        id="blast-concentric-bands"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Core: Failed Corridor */}
        <div
          id="blast-center-core"
          className="blast-band"
          tabIndex={0}
          role="button"
          onClick={() => handleEntityClick(f1CorridorId, 'corridor')}
          onKeyDown={(e) => { if (e.key === 'Enter') handleEntityClick(f1CorridorId, 'corridor'); }}
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.04)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '8px',
            padding: '9px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            transition: 'all 0.15s ease',
          }}
          title="Click to inspect root corridor failure"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ fontSize: '14px', lineHeight: 1 }}>🎯</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', color: 'var(--fail)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ROOT FAILURE (F1)
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--ink-hi)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {f1?.name || f1CorridorId}
              </div>
            </div>
          </div>
          <span
            className="mono"
            style={{
              fontSize: '11px',
              color: 'var(--fail)',
              fontWeight: 700,
              flexShrink: 0,
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              padding: '2px 7px',
              borderRadius: '9999px',
            }}
          >
            {f1?.length_km ? `${f1.length_km} km` : 'SEVERED'}
          </span>
        </div>

        {/* Band 1: ROAD LAYER */}
        <div
          id="blast-band-road"
          className="blast-band motif-sever"
          tabIndex={0}
          role="button"
          onClick={() => handleEntityClick(f1CorridorId, 'road')}
          onKeyDown={(e) => { if (e.key === 'Enter') handleEntityClick(f1CorridorId, 'road'); }}
          style={{
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--line-hair)',
            borderLeft: '3px solid var(--fail)',
            borderRadius: '8px',
            padding: '10px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Click to view road layer impact"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>🛣️</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-hi)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Layer 1 · Road Arteries
              </span>
            </div>
            <span
              className="mono"
              style={{
                fontSize: '11px',
                color: 'var(--fail)',
                fontWeight: 600,
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                padding: '2px 7px',
                borderRadius: '9999px',
              }}
            >
              {severedCorridorCount} / {totalCorridors} corridors severed
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {severedCorridors.map((c) => (
              <span
                key={c.id}
                id={`blast-entity-${c.id}`}
                className="mono"
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  backgroundColor: 'rgba(220, 38, 38, 0.06)',
                  color: 'var(--fail)',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  borderRadius: '6px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {c.id.replace('road_', '')} (submerged)
              </span>
            ))}
          </div>
        </div>

        {/* Band 2: POWER LAYER */}
        <div
          id="blast-band-power"
          className="blast-band motif-cascade"
          tabIndex={0}
          role="button"
          onClick={() => { if (severedFeeders[0]) handleEntityClick(severedFeeders[0].id, 'power'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && severedFeeders[0]) handleEntityClick(severedFeeders[0].id, 'power'); }}
          style={{
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--line-hair)',
            borderLeft: '3px solid var(--warn)',
            borderRadius: '8px',
            padding: '10px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Click to view power feeder impact"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>⚡</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-hi)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Layer 2 · Power Feeders
              </span>
            </div>
            <span
              className="mono"
              style={{
                fontSize: '11px',
                color: 'var(--warn)',
                fontWeight: 600,
                backgroundColor: 'rgba(217, 119, 6, 0.08)',
                padding: '2px 7px',
                borderRadius: '9999px',
              }}
            >
              {severedFeeders.length} / {totalPowerFeeders} feeders dark
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {severedFeeders.length === 0 && (
              <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-lo)', padding: '2px 0' }}>
                no feeder carried on this corridor
              </span>
            )}
            {severedFeeders.map((pf: any) => (
              <span
                key={pf.id}
                id={`blast-entity-${pf.id}`}
                className="mono"
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  backgroundColor: 'rgba(217, 119, 6, 0.06)',
                  color: 'var(--warn)',
                  border: '1px solid rgba(217, 119, 6, 0.2)',
                  borderRadius: '6px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ⚡ {pf.name || pf.id} (severed)
              </span>
            ))}
          </div>
        </div>

        {/* Band 3: ALERT LAYER */}
        <div
          id="blast-band-alert"
          className="blast-band motif-cascade"
          tabIndex={0}
          role="button"
          onClick={() => handleEntityClick(unpoweredTowers[0]?.id || 'tower_chandgiram', 'alert')}
          onKeyDown={(e) => { if (e.key === 'Enter') handleEntityClick(unpoweredTowers[0]?.id || 'tower_chandgiram', 'alert'); }}
          style={{
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--line-hair)',
            borderLeft: '3px solid var(--branch)',
            borderRadius: '8px',
            padding: '10px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Click to view telecom and alert network impact"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>📡</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-hi)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Layer 3 · Alert & Telecom
              </span>
            </div>
            <span
              className="mono"
              style={{
                fontSize: '11px',
                color: 'var(--branch)',
                fontWeight: 600,
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                padding: '2px 7px',
                borderRadius: '9999px',
              }}
            >
              {unpoweredTowers.length} / {totalTowers} towers · {isolatedRelays.length} / {totalRelays} relays
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {unpoweredTowers.length === 0 && (
              <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-lo)', padding: '2px 0' }}>
                no tower unpowered by this failure
              </span>
            )}
            {unpoweredTowers.map((t: any) => (
              <span
                key={t.id}
                id={`blast-entity-${t.id}`}
                className="mono"
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  backgroundColor: 'rgba(139, 92, 246, 0.06)',
                  color: 'var(--branch)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '6px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                📡 {t.name || t.id} (unpowered)
              </span>
            ))}
            {isolatedRelays.length === 0 && (
              <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-lo)', padding: '2px 0' }}>
                no relay isolated by this failure
              </span>
            )}
            {isolatedRelays.map((r: any) => (
              <span
                key={r.id}
                id={`blast-entity-${r.id}`}
                className="mono"
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  backgroundColor: 'var(--bg-sunken)',
                  color: 'var(--ink-hi)',
                  border: '1px solid var(--line-hair)',
                  borderRadius: '6px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                🔔 {r.name || r.id} (isolated)
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
