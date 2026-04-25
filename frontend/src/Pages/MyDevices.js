import React from 'react';

const CASES = [
  { caseId: 'PHT-2024-001', name: 'Ravi Kumar', status: 'ACTIVE', confidence: 0.82 },
  { caseId: 'PHT-2024-002', name: 'Meera Nair', status: 'ACTIVE', confidence: 0.61 },
  { caseId: 'PHT-2024-003', name: 'Unknown Subject', status: 'ACTIVE', confidence: 0.34 },
  { caseId: 'PHT-2024-004', name: 'Anita Rao', status: 'CLOSED', confidence: 0.91 },
  { caseId: 'PHT-2024-005', name: 'David Chen', status: 'CLOSED', confidence: 0.78 },
];

function getConfidenceColor(confidence) {
  if (confidence > 0.7) {
    return '#00e5a0';
  }

  if (confidence >= 0.4) {
    return '#f5a623';
  }

  return '#ff4d4d';
}

export function MyDevices() {
  return (
    <div>
      <h1 className="page-title page-title-mono">ACTIVE CASES</h1>
      <p className="page-sub">All ongoing PHANTOM-WRAITH investigations.</p>

      <div className="page-action-row">
        <button type="button" className="locate-btn active-cases-new-btn">
          NEW CASE
        </button>
      </div>

      <div className="active-cases-list">
        {CASES.map(entry => (
          <article key={entry.caseId} className="active-case-card">
            <div className="active-case-main">
              <div className="active-case-id">{entry.caseId}</div>
              <div className="active-case-name">{entry.name}</div>
            </div>

            <div className="active-case-meta">
              <span
                className={`active-case-status ${
                  entry.status === 'ACTIVE' ? 'is-active' : 'is-closed'
                }`}
              >
                {entry.status}
              </span>
              <span
                className="active-case-confidence"
                style={{ color: getConfidenceColor(entry.confidence) }}
              >
                {Math.round(entry.confidence * 100)}%
              </span>
            </div>

            <div className="active-case-actions">
              <button type="button" className="active-case-btn active-case-view-btn">
                VIEW ANALYSIS
              </button>

              {entry.status === 'ACTIVE' && (
                <button type="button" className="active-case-btn active-case-close-btn">
                  CLOSE CASE
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
