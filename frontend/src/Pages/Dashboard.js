import React, { useEffect, useState } from 'react';

const COUNT_UP_DURATION_MS = 1000;
const COUNT_UP_INTERVAL_MS = 20;
const STAT_TARGETS = {
  casesToday: 3,
  avgConfidence: 76,
};

const RECENT_CASES = [
  {
    id: 'PHT-2024-001',
    subject: 'Ravi Kumar',
    category: 'transport_hub',
    confidence: 82,
    engine: 'WRAITH',
    time: 'Today 14:32',
  },
  {
    id: 'PHT-2024-002',
    subject: 'Meera Nair',
    category: 'isolated_outdoor',
    confidence: 61,
    engine: 'PHANTOM',
    time: 'Today 11:15',
  },
  {
    id: 'PHT-2024-003',
    subject: 'Unknown Subject',
    category: 'unknown',
    confidence: 34,
    engine: 'PHANTOM',
    time: 'Yesterday 09:44',
  },
];

function formatLiveTimestamp(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function getConfidenceColor(confidence) {
  if (confidence > 70) {
    return '#00e5a0';
  }

  if (confidence >= 40) {
    return '#f5a623';
  }

  return '#ff4d4d';
}

export function Dashboard() {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [animatedStats, setAnimatedStats] = useState({
    casesToday: 0,
    avgConfidence: 0,
  });

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const totalSteps = Math.ceil(COUNT_UP_DURATION_MS / COUNT_UP_INTERVAL_MS);
    let step = 0;

    const intervalId = setInterval(() => {
      step += 1;
      const progress = Math.min(step / totalSteps, 1);

      setAnimatedStats({
        casesToday: Math.round(STAT_TARGETS.casesToday * progress),
        avgConfidence: Math.round(STAT_TARGETS.avgConfidence * progress),
      });

      if (progress === 1) {
        clearInterval(intervalId);
      }
    }, COUNT_UP_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  const statCards = [
    {
      label: 'CASES TODAY',
      value: String(animatedStats.casesToday),
      valueColor: '#00e5a0',
    },
    {
      label: 'AVG CONFIDENCE',
      value: `${animatedStats.avgConfidence}%`,
      valueColor: '#00e5a0',
    },
    {
      label: 'ENGINE STATUS',
      value: 'ONLINE',
      valueColor: '#00e5a0',
    },
    {
      label: 'LAST ANALYSIS',
      value: '2 mins ago',
      valueColor: '#e8eaf0',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1
          style={{
            color: '#e8eaf0',
            fontFamily: "'Space Mono', monospace",
            fontSize: '28px',
            letterSpacing: '4px',
            marginBottom: '10px',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          CASE OVERVIEW
        </h1>

        <div
          style={{
            color: '#00e5a0',
            fontFamily: "'Space Mono', monospace",
            fontSize: '14px',
            letterSpacing: '4px',
            marginBottom: '12px',
          }}
        >
          PHANTOM-WRAITH ACTIVE
        </div>

        <div
          style={{
            color: '#5a6070',
            fontFamily: "'Space Mono', monospace",
            fontSize: '13px',
          }}
        >
          {formatLiveTimestamp(currentTime)}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            minWidth: '920px',
          }}
        >
          {statCards.map(card => (
            <div
              key={card.label}
              style={{
                background: '#111318',
                border: '1px solid #1e2330',
                borderRadius: '8px',
                padding: '20px',
              }}
            >
              <div
                style={{
                  color: '#5a6070',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '2px',
                  marginBottom: '14px',
                  textTransform: 'uppercase',
                }}
              >
                {card.label}
              </div>

              <div
                style={{
                  color: card.valueColor,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '28px',
                  lineHeight: 1,
                }}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          color: '#5a6070',
          fontFamily: "'Space Mono', monospace",
          fontSize: '12px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}
      >
        RECENT CASES
      </div>

      <div
        style={{
          background: '#111318',
          border: '1px solid #1e2330',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            width: '100%',
          }}
        >
          <thead>
            <tr>
              {['CASE ID', 'SUBJECT', 'CATEGORY', 'CONFIDENCE', 'ENGINE', 'TIME'].map(column => (
                <th
                  key={column}
                  style={{
                    background: '#181c24',
                    color: '#5a6070',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    fontWeight: 400,
                    letterSpacing: '2px',
                    padding: '14px 18px',
                    textAlign: 'left',
                    textTransform: 'uppercase',
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {RECENT_CASES.map(caseItem => {
              const confidenceColor = getConfidenceColor(caseItem.confidence);

              return (
                <tr key={caseItem.id}>
                  <td
                    style={{
                      background: '#111318',
                      borderBottom: '1px solid #1e2330',
                      color: '#e8eaf0',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '13px',
                      padding: '18px',
                    }}
                  >
                    <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
                      <span
                        style={{
                          background: confidenceColor,
                          borderRadius: '999px',
                          display: 'inline-block',
                          flexShrink: 0,
                          height: '8px',
                          width: '8px',
                        }}
                      />
                      <span>{caseItem.id}</span>
                    </div>
                  </td>

                  <td
                    style={{
                      background: '#111318',
                      borderBottom: '1px solid #1e2330',
                      color: '#e8eaf0',
                      fontFamily: "'Syne', sans-serif",
                      fontSize: '16px',
                      fontWeight: 600,
                      padding: '18px',
                    }}
                  >
                    {caseItem.subject}
                  </td>

                  <td
                    style={{
                      background: '#111318',
                      borderBottom: '1px solid #1e2330',
                      color: '#e8eaf0',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '13px',
                      padding: '18px',
                    }}
                  >
                    {caseItem.category}
                  </td>

                  <td
                    style={{
                      background: '#111318',
                      borderBottom: '1px solid #1e2330',
                      color: '#e8eaf0',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '13px',
                      padding: '18px',
                    }}
                  >
                    {caseItem.confidence}%
                  </td>

                  <td
                    style={{
                      background: '#111318',
                      borderBottom: '1px solid #1e2330',
                      color: '#e8eaf0',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '13px',
                      padding: '18px',
                    }}
                  >
                    {caseItem.engine}
                  </td>

                  <td
                    style={{
                      background: '#111318',
                      borderBottom: '1px solid #1e2330',
                      color: '#e8eaf0',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '13px',
                      padding: '18px',
                    }}
                  >
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{caseItem.time}</span>

                      <button
                        type="button"
                        style={{
                          background: '#111318',
                          border: '1px solid #00e5a0',
                          borderRadius: '6px',
                          color: '#00e5a0',
                          cursor: 'pointer',
                          fontFamily: "'Space Mono', monospace",
                          fontSize: '12px',
                          letterSpacing: '1px',
                          padding: '8px 14px',
                        }}
                      >
                        VIEW
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
