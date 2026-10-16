import React, { useState, useRef } from 'react';
import { WorldSummary } from './types';

interface EntityListProps {
  world: WorldSummary;
  selectedEntityId?: string;
  onSelectEntity: (id: string, kind: string) => void;
  onOpenEvidence?: (caseId: string) => void;
  selectedCaseId?: string;
  severedCorridorIds?: Set<string>;
}

export const EntityList: React.FC<EntityListProps> = ({
  world,
  selectedEntityId,
  onSelectEntity,
  onOpenEvidence,
  selectedCaseId,
  severedCorridorIds = new Set(),
}) => {
  // Aggregate all entities dynamically
  const entities = React.useMemo(() => {
    const list: Array<{ id: string; name: string; type: string; status: string; provenance: string }> = [];

    (world.intersections || []).forEach((item) => {
      list.push({
        id: item.id,
        name: item.name,
        type: 'Intersection',
        status: 'OPERATIONAL',
        provenance: item.data_origin,
      });
    });

    (world.corridors || []).forEach((item) => {
      list.push({
        id: item.id,
        name: item.name,
        type: 'Corridor',
        status: severedCorridorIds.has(item.id) ? 'SEVERED' : item.status,
        provenance: item.data_origin,
      });
    });

    (world.facilities || []).forEach((item) => {
      list.push({
        id: item.id,
        name: item.name,
        type: 'Facility',
        status: item.excluded_from_metrics ? 'EXCLUDED' : 'OPERATIONAL',
        provenance: item.data_origin,
      });
    });

    (world.power_feeders || []).forEach((item) => {
      list.push({
        id: item.id,
        name: item.name,
        type: 'PowerFeeder',
        status: 'OPERATIONAL',
        provenance: item.data_origin,
      });
    });

    (world.towers || []).forEach((item) => {
      list.push({
        id: item.id,
        name: item.name,
        type: 'Tower',
        status: 'OPERATIONAL',
        provenance: item.data_origin,
      });
    });

    (world.relays || []).forEach((item) => {
      list.push({
        id: item.id,
        name: item.name,
        type: 'RelayContact',
        status: 'OPERATIONAL',
        provenance: item.data_origin,
      });
    });

    return list;
  }, [world, severedCorridorIds]);

  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const next = Math.min(prev + 1, entities.length - 1);
        rowRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        onSelectEntity(entities[next].id, entities[next].type);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        rowRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        onSelectEntity(entities[next].id, entities[next].type);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedCaseId && onOpenEvidence) {
        onOpenEvidence(selectedCaseId);
      }
    }
  };

  return (
    <div
      className="keyboard-entity-list-container"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--line-hair)',
        borderRadius: 'var(--r-panel)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Keyboard Navigable Entity Mirror"
    >
      <div
        style={{
          padding: 'var(--s2) var(--s3)',
          borderBottom: '1px solid var(--line-hair)',
          backgroundColor: 'var(--bg-header)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 'var(--fs-micro)', fontWeight: 700, color: 'var(--ink-hi)' }}>
          KEYBOARD ENTITY REGISTRY ({entities.length} items)
        </span>
        <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-lo)' }}>
          Use Tab to focus, ↑/↓ to move, Enter for evidence
        </span>
      </div>

      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
        <table style={{ width: '100%', fontSize: 'var(--fs-micro)', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: 'var(--ink-lo)', borderBottom: '1px solid var(--line-hair)', textAlign: 'left' }}>
              <th style={{ padding: 'var(--s1)' }}>Entity ID</th>
              <th style={{ padding: 'var(--s1)' }}>Name</th>
              <th style={{ padding: 'var(--s1)' }}>Type</th>
              <th style={{ padding: 'var(--s1)' }}>Status</th>
              <th style={{ padding: 'var(--s1)' }}>Origin</th>
            </tr>
          </thead>
          <tbody>
            {entities.map((ent, idx) => {
              const isSelected = selectedEntityId === ent.id || focusedIndex === idx;
              return (
                <tr
                  key={ent.id}
                  ref={(el) => (rowRefs.current[idx] = el)}
                  onClick={() => {
                    setFocusedIndex(idx);
                    onSelectEntity(ent.id, ent.type);
                  }}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-raised)' : 'transparent',
                    borderBottom: '1px solid var(--line-hair)',
                    cursor: 'pointer',
                  }}
                  className={`entity-row ${isSelected ? 'selected' : ''}`}
                >
                  <td className="mono" style={{ padding: 'var(--s1)', color: isSelected ? 'var(--accent)' : 'var(--ink-hi)' }}>
                    {ent.id}
                  </td>
                  <td style={{ padding: 'var(--s1)', color: 'var(--ink-mid)' }}>{ent.name}</td>
                  <td style={{ padding: 'var(--s1)', color: 'var(--ink-lo)' }}>{ent.type}</td>
                  <td
                    style={{
                      padding: 'var(--s1)',
                      color: ent.status === 'SEVERED' ? 'var(--fail)' : 'var(--ok)',
                      fontWeight: 600,
                    }}
                  >
                    {ent.status}
                  </td>
                  <td className="mono" style={{ padding: 'var(--s1)', color: 'var(--ink-lo)' }}>
                    {ent.provenance}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
