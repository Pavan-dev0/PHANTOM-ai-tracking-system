import React, { useEffect, useRef, useState } from 'react';
import { analyseCase } from '../api';
import { createCaseReport } from '../report';

const INITIAL_FORM_STATE = {
  name: '',
  last_lat: '',
  last_lng: '',
  missing_since_hours: '',
  phone_lat: '',
  phone_lng: '',
  phone_activity_notes: '',
  transport_available: 'unknown',
};

const CASE_PRESETS = {
  case1: {
    label: 'CASE 1 — TRANSIT INTENT',
    values: {
      name: 'Ravi Kumar',
      last_lat: '13.0827',
      last_lng: '80.2707',
      missing_since_hours: '6',
      phone_lat: '13.09',
      phone_lng: '80.28',
      phone_activity_notes:
        'Searched Chennai Central station, looked up train timings to Bangalore, opened maps near Park Town',
      transport_available: 'bus',
    },
  },
  case2: {
    label: 'CASE 2 — ISOLATED OUTDOOR',
    values: {
      name: 'Meera Nair',
      last_lat: '13.1',
      last_lng: '80.25',
      missing_since_hours: '3',
      phone_lat: '13.11',
      phone_lng: '80.24',
      phone_activity_notes:
        'Searched parks near Tambaram, looked up isolated hiking trails, maps offline mode enabled',
      transport_available: 'walking',
    },
  },
  case3: {
    label: 'CASE 3 — UNKNOWN SUBJECT',
    values: {
      name: 'Unknown Subject',
      last_lat: '13.05',
      last_lng: '80.21',
      missing_since_hours: '10',
      phone_lat: '',
      phone_lng: '',
      phone_activity_notes: 'No recent phone activity recorded',
      transport_available: 'unknown',
    },
  },
};

const FIELD_DEFINITIONS = [
  { label: 'PERSON NAME', name: 'name', type: 'text' },
  { label: 'LAST KNOWN LATITUDE', name: 'last_lat', type: 'number' },
  { label: 'LAST KNOWN LONGITUDE', name: 'last_lng', type: 'number' },
  { label: 'HOURS MISSING', name: 'missing_since_hours', type: 'number' },
  { label: 'PHONE LAST LAT (OPTIONAL)', name: 'phone_lat', type: 'number' },
  { label: 'PHONE LAST LNG (OPTIONAL)', name: 'phone_lng', type: 'number' },
];

const STATUS_STEPS = ['CASE SUBMITTED', 'ANALYSING', 'RESULT READY'];
const INTENT_STAGES = ['vague', 'narrowing', 'specific', 'action'];
const ENGINE_BADGES = ['PHANTOM', 'WRAITH'];
const SIGNAL_CARDS = [
  { key: 'movement', label: 'MOVEMENT SIGNAL', dotColor: '#1D9E75' },
  { key: 'cognitive', label: 'COGNITIVE SIGNAL', dotColor: '#7F77DD' },
  { key: 'device', label: 'DEVICE ANCHOR', dotColor: '#f5a623' },
];

function getInputStyle(isFocused) {
  return {
    appearance: 'none',
    background: '#181c24',
    border: `1px solid ${isFocused ? '#00e5a0' : '#1e2330'}`,
    borderRadius: '4px',
    color: '#e8eaf0',
    fontFamily: "'Space Mono', monospace",
    fontSize: '12px',
    outline: 'none',
    padding: '10px 12px',
    width: '100%',
  };
}

function clearTimers(timerIdsRef) {
  timerIdsRef.current.forEach(timerId => {
    window.clearTimeout(timerId);
  });
  timerIdsRef.current = [];
}

function scheduleTimer(timerIdsRef, callback, delay) {
  const timerId = window.setTimeout(callback, delay);
  timerIdsRef.current.push(timerId);
  return timerId;
}

function getConfidenceColor(confidence) {
  if (confidence > 0.7) {
    return '#00e5a0';
  }

  if (confidence >= 0.4) {
    return '#f5a623';
  }

  return '#ff4d4d';
}

function getSearchZoneUrl(searchZone) {
  const fallbackLat = 13.0827;
  const fallbackLng = 80.2707;
  const lat = Number.isFinite(Number(searchZone?.lat))
    ? Number(searchZone.lat)
    : fallbackLat;
  const lng = Number.isFinite(Number(searchZone?.lng))
    ? Number(searchZone.lng)
    : fallbackLng;

  return `https://www.google.com/maps/@${lat},${lng},13z`;
}

export function LocatePhone() {
  const [activeCase, setActiveCase] = useState(null);
  const [focusedField, setFocusedField] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [submitPhase, setSubmitPhase] = useState('idle');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [submittedForm, setSubmittedForm] = useState(null);
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [isDominantBadgeVisible, setIsDominantBadgeVisible] = useState(false);
  const [litStageIndex, setLitStageIndex] = useState(-1);
  const timerIdsRef = useRef([]);
  const submissionIdRef = useRef(0);

  useEffect(() => {
    return () => {
      clearTimers(timerIdsRef);
    };
  }, []);

  useEffect(() => {
    if (!analysisResult) {
      return undefined;
    }

    scheduleTimer(timerIdsRef, () => {
      setIsResultVisible(true);
    }, 20);

    return undefined;
  }, [analysisResult]);

  useEffect(() => {
    if (!analysisResult || !isResultVisible) {
      return undefined;
    }

    const currentStageIndex = Math.max(
      INTENT_STAGES.indexOf(analysisResult.intent_stage),
      0
    );

    for (let stageIndex = 0; stageIndex <= currentStageIndex; stageIndex += 1) {
      scheduleTimer(timerIdsRef, () => {
        setLitStageIndex(stageIndex);
      }, stageIndex * 200);
    }

    scheduleTimer(timerIdsRef, () => {
      setIsDominantBadgeVisible(true);
    }, 500);

    return undefined;
  }, [analysisResult, isResultVisible]);

  function handleFieldChange(event) {
    const { name, value } = event.target;

    setFormState(prev => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePresetSelect(caseKey) {
    setActiveCase(caseKey);
    setFormState(CASE_PRESETS[caseKey].values);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const submissionId = submissionIdRef.current + 1;
    submissionIdRef.current = submissionId;

    clearTimers(timerIdsRef);
    setIsLoading(true);
    setSubmitPhase('submitted');
    setSubmittedForm({ ...formState });
    setAnalysisResult(null);
    setIsResultVisible(false);
    setIsDominantBadgeVisible(false);
    setLitStageIndex(-1);

    scheduleTimer(timerIdsRef, () => {
      if (submissionIdRef.current !== submissionId) {
        return;
      }

      setSubmitPhase('analysing');
    }, 600);

    try {
      const result = await analyseCase({ ...formState });

      if (submissionIdRef.current !== submissionId) {
        return;
      }

      setAnalysisResult(result);
      setSubmitPhase('ready');
      setIsLoading(false);
    } catch (error) {
      if (submissionIdRef.current !== submissionId) {
        return;
      }

      setIsLoading(false);
      setSubmitPhase('submitted');
      console.error('Case analysis failed', error);
    }
  }

  function handleOpenSearchZone() {
    window.open(getSearchZoneUrl(analysisResult?.search_zone), '_blank', 'noopener,noreferrer');
  }

  function handleExportReport() {
    if (!analysisResult) {
      return;
    }

    const mapsUrl = getSearchZoneUrl(analysisResult.search_zone);
    const doc = createCaseReport({
      result: analysisResult,
      subjectName: submittedForm?.name || formState.name || 'Unknown Subject',
      mapsUrl,
    });

    if (!doc || typeof doc.save !== 'function') {
      return;
    }

    doc.save(`${analysisResult.case_id || 'phantom-wraith-case-report'}.pdf`);
  }

  const confidence = Number(analysisResult?.confidence || 0);
  const confidencePercent = Math.round(confidence * 100);
  const confidenceColor = getConfidenceColor(confidence);
  const currentStageIndex = Math.max(
    INTENT_STAGES.indexOf(analysisResult?.intent_stage),
    0
  );

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        maxWidth: '1080px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {Object.entries(CASE_PRESETS).map(([caseKey, preset]) => {
          const isActive = activeCase === caseKey;

          return (
            <button
              key={caseKey}
              type="button"
              onClick={() => handlePresetSelect(caseKey)}
              style={{
                background: isActive ? '#1a2a20' : '#111318',
                border: `1px solid ${isActive ? '#00e5a0' : '#1e2330'}`,
                borderRadius: '4px',
                color: isActive ? '#00e5a0' : '#5a6070',
                cursor: 'pointer',
                fontFamily: "'Space Mono', monospace",
                fontSize: '11px',
                letterSpacing: '1px',
                padding: '10px 16px',
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          background: '#111318',
          border: '1px solid #1e2330',
          borderRadius: '8px',
          display: 'grid',
          gap: '18px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          padding: '20px',
        }}
      >
        {FIELD_DEFINITIONS.map(field => (
          <label
            key={field.name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <span
              style={{
                color: '#5a6070',
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              {field.label}
            </span>

            <input
              name={field.name}
              type={field.type}
              value={formState[field.name]}
              onChange={handleFieldChange}
              onFocus={() => setFocusedField(field.name)}
              onBlur={() => setFocusedField('')}
              style={getInputStyle(focusedField === field.name)}
            />
          </label>
        ))}

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            gridColumn: '1 / -1',
          }}
        >
          <span
            style={{
              color: '#5a6070',
              fontFamily: "'Space Mono', monospace",
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            PHONE ACTIVITY NOTES
          </span>

          <textarea
            name="phone_activity_notes"
            rows={4}
            value={formState.phone_activity_notes}
            onChange={handleFieldChange}
            onFocus={() => setFocusedField('phone_activity_notes')}
            onBlur={() => setFocusedField('')}
            style={{
              ...getInputStyle(focusedField === 'phone_activity_notes'),
              resize: 'vertical',
            }}
          />
        </label>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            gridColumn: '1 / -1',
          }}
        >
          <span
            style={{
              color: '#5a6070',
              fontFamily: "'Space Mono', monospace",
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            TRANSPORT AVAILABLE
          </span>

          <select
            name="transport_available"
            value={formState.transport_available}
            onChange={handleFieldChange}
            onFocus={() => setFocusedField('transport_available')}
            onBlur={() => setFocusedField('')}
            style={getInputStyle(focusedField === 'transport_available')}
          >
            <option value="walking">WALKING</option>
            <option value="bus">BUS</option>
            <option value="train">TRAIN</option>
            <option value="unknown">UNKNOWN</option>
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          background: '#00e5a0',
          border: 'none',
          borderRadius: '4px',
          color: '#0a0c10',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontFamily: "'Space Mono', monospace",
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '3px',
          opacity: isLoading ? 0.72 : 1,
          padding: '14px',
          width: '100%',
        }}
      >
        {isLoading ? 'ANALYSING...' : 'RUN ANALYSIS'}
      </button>

      {submitPhase !== 'idle' && (
        <div className="analysis-status-bar" role="status" aria-live="polite">
          {STATUS_STEPS.map((stepLabel, index) => {
            const isActive =
              (index === 0 && submitPhase !== 'idle') ||
              (index === 1 && (submitPhase === 'analysing' || submitPhase === 'ready')) ||
              (index === 2 && submitPhase === 'ready');
            const isBlinking = index === 1 && submitPhase === 'analysing';

            return (
              <div
                key={stepLabel}
                className={[
                  'analysis-status-step',
                  isActive ? 'is-active' : '',
                  isBlinking ? 'is-blinking' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="analysis-status-dot" aria-hidden="true" />
                <span>{stepLabel}</span>
              </div>
            );
          })}
        </div>
      )}

      {analysisResult && (
        <section
          className={[
            'analysis-result-card',
            isResultVisible ? 'is-visible' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            '--analysis-accent': confidenceColor,
            '--confidence-width': `${confidencePercent}%`,
          }}
        >
          <div className="analysis-result-section">
            <div className="analysis-card-header">
              <div className="analysis-card-meta">
                <span>{analysisResult.case_id}</span>
                <span aria-hidden="true">-</span>
                <span>{analysisResult.timestamp}</span>
              </div>

              <div className="analysis-badges">
                {ENGINE_BADGES.map(engine => {
                  const isDominant =
                    engine === String(analysisResult.dominant_engine || '').toUpperCase();

                  return (
                    <span
                      key={engine}
                      className={[
                        'analysis-badge',
                        isDominant ? 'is-dominant' : 'is-secondary',
                        isDominant && isDominantBadgeVisible ? 'is-badge-visible' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {engine}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="analysis-result-section">
            <div className="analysis-summary-row">
              <div>
                <div className="analysis-category">
                  {String(analysisResult.destination_category || '').toUpperCase()}
                </div>
              </div>

              <div className="analysis-confidence-value">{confidencePercent}%</div>
            </div>

            <div className="analysis-confidence-bar" aria-hidden="true">
              <div className="analysis-confidence-fill" />
            </div>
          </div>

          <div className="analysis-result-section">
            <div className="analysis-section-label">INTENT CRYSTALLISATION STAGE</div>

            <div className="analysis-stage-track">
              {INTENT_STAGES.map((stage, index) => {
                let stageState = 'future';

                if (index <= litStageIndex) {
                  stageState = index === currentStageIndex ? 'current' : 'past';
                }

                return (
                  <div key={stage} className="analysis-stage-item">
                    <span className={`analysis-stage-circle is-${stageState}`} aria-hidden="true" />
                    <span className={`analysis-stage-label is-${stageState}`}>
                      {stage.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="analysis-result-section">
            <div className="analysis-section-label">WRAITH ANALYSIS</div>
            <p className="analysis-reasoning">{analysisResult.reasoning}</p>
          </div>

          <div className="analysis-result-section">
            <div className="analysis-signal-grid">
              {SIGNAL_CARDS.map(signal => (
                <div key={signal.key} className="analysis-signal-box">
                  <div className="analysis-signal-label">
                    <span
                      className="analysis-signal-dot"
                      style={{ background: signal.dotColor }}
                      aria-hidden="true"
                    />
                    <span>{signal.label}</span>
                  </div>

                  <p className="analysis-signal-body">
                    {analysisResult.signal_breakdown?.[signal.key]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {analysisResult.gaps && (
            <div className="analysis-result-section">
              <div className="analysis-section-label analysis-section-label-danger">
                DATA GAPS
              </div>
              <p className="analysis-gaps">{analysisResult.gaps}</p>
            </div>
          )}

          <div className="analysis-result-section">
            <div className="analysis-action-grid">
              <button
                type="button"
                className="analysis-action-btn analysis-action-btn-primary"
                onClick={handleOpenSearchZone}
              >
                OPEN SEARCH ZONE
              </button>

              <button
                type="button"
                className="analysis-action-btn analysis-action-btn-secondary"
                onClick={handleExportReport}
              >
                EXPORT REPORT
              </button>
            </div>
          </div>
        </section>
      )}
    </form>
  );
}
