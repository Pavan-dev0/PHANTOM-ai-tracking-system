import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CASES = [
  {
    caseId: 'PHT-2024-001',
    name: 'Ravi Kumar',
    status: 'ACTIVE',
    confidence: 0.82,
    formData: {
      name: 'Ravi Kumar',
      last_lat: '12.9716',
      last_lng: '77.5946',
      missing_since_hours: '2',
      phone_lat: '12.9350',
      phone_lng: '77.6245',
      phone_activity_notes:
        'Searched Majestic bus stand, checked train timings, and opened maps around Bengaluru City station',
      transport_available: 'bus',
    },
  },
  {
    caseId: 'PHT-2024-002',
    name: 'Meera Nair',
    status: 'ACTIVE',
    confidence: 0.61,
    formData: {
      name: 'Meera Nair',
      last_lat: '28.6139',
      last_lng: '77.2090',
      missing_since_hours: '3',
      phone_lat: '28.5355',
      phone_lng: '77.3910',
      phone_activity_notes:
        'Searched city parks near Delhi, looked up quiet trail routes, and enabled offline maps',
      transport_available: 'walking',
    },
  },
  {
    caseId: 'PHT-2024-003',
    name: 'Unknown Subject',
    status: 'ACTIVE',
    confidence: 0.34,
    formData: {
      name: 'Unknown Subject',
      last_lat: '19.0760',
      last_lng: '72.8777',
      missing_since_hours: '1.5',
      phone_lat: '',
      phone_lng: '',
      phone_activity_notes: 'No recent phone activity recorded',
      transport_available: 'unknown',
    },
  },
  {
    caseId: 'PHT-2024-004',
    name: 'Anita Rao',
    status: 'CLOSED',
    confidence: 0.91,
    formData: {
      name: 'Anita Rao',
      last_lat: '17.3850',
      last_lng: '78.4867',
      missing_since_hours: '6',
      phone_lat: '17.4100',
      phone_lng: '78.4720',
      phone_activity_notes: 'Reviewed metro routes and transit searches around central Hyderabad',
      transport_available: 'train',
    },
  },
  {
    caseId: 'PHT-2024-005',
    name: 'David Chen',
    status: 'CLOSED',
    confidence: 0.78,
    formData: {
      name: 'David Chen',
      last_lat: '22.5726',
      last_lng: '88.3639',
      missing_since_hours: '4',
      phone_lat: '22.5675',
      phone_lng: '88.3702',
      phone_activity_notes: 'Recent map checks suggested station access and short road transfers',
      transport_available: 'bus',
    },
  },
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
  const navigate = useNavigate();
  const [cases, setCases] = useState(CASES);

  function handleViewAnalysis(entry) {
    navigate('/new-analysis', {
      state: {
        caseData: entry,
        prefillForm: entry.formData,
      },
    });
  }

  function handleCloseCase(caseId) {
    setCases(prevCases =>
      prevCases.map(entry =>
        entry.caseId === caseId ? { ...entry, status: 'CLOSED' } : entry
      )
    );
  }

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
        {cases.map(entry => (
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
              <button
                type="button"
                className="active-case-btn active-case-view-btn"
                onClick={() => handleViewAnalysis(entry)}
              >
                VIEW ANALYSIS
              </button>

              {entry.status === 'ACTIVE' && (
                <button
                  type="button"
                  className="active-case-btn active-case-close-btn"
                  onClick={() => handleCloseCase(entry.caseId)}
                >
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
