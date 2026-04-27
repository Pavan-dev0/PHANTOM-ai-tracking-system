import React, { useState } from 'react';

const SETTINGS_INPUT_STYLE = {
  appearance: 'none',
  background: '#181c24',
  border: '1px solid #1e2330',
  borderRadius: '6px',
  color: '#e8eaf0',
  fontFamily: "'Space Mono', monospace",
  fontSize: '12px',
  outline: 'none',
  padding: '11px 12px',
  width: '100%',
};

export function Settings() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [defaultTransport, setDefaultTransport] = useState('unknown');
  const [confidenceThreshold, setConfidenceThreshold] = useState('MEDIUM');
  const [defaultLat, setDefaultLat] = useState('13.0827');
  const [defaultLng, setDefaultLng] = useState('80.2707');
  const [displayMode, setDisplayMode] = useState('dark');
  const [autoScroll, setAutoScroll] = useState(true);

  return (
    <div>
      <h1 className="page-title">SYSTEM SETTINGS</h1>
      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-title">AI ENGINE CONFIGURATION</div>
          <div className="settings-key-row">
            <input
              type="password"
              placeholder="Enter your Gemini API key"
              value={geminiApiKey}
              onChange={event => setGeminiApiKey(event.target.value)}
              style={SETTINGS_INPUT_STYLE}
            />
            <button type="button" className="locate-btn settings-save-btn">
              SAVE KEY
            </button>
          </div>
          <div className="settings-status-line">
            <span>API KEY STATUS:</span>
            <span className={geminiApiKey ? 'settings-status-ok' : 'settings-status-bad'}>
              {geminiApiKey ? 'CONFIGURED' : 'NOT SET'}
            </span>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-title">ANALYSIS DEFAULTS</div>

          <div className="settings-field-group">
            <label className="settings-label" htmlFor="default-transport">
              DEFAULT TRANSPORT
            </label>
            <select
              id="default-transport"
              value={defaultTransport}
              onChange={event => setDefaultTransport(event.target.value)}
              style={SETTINGS_INPUT_STYLE}
            >
              <option value="walking">WALKING</option>
              <option value="bus">BUS</option>
              <option value="train">TRAIN</option>
              <option value="unknown">UNKNOWN</option>
            </select>
          </div>

          <div className="settings-field-group">
            <div className="settings-label">CONFIDENCE THRESHOLD</div>
            <div className="settings-radio-row">
              {[
                { label: 'LOW', color: '#ff4d4d' },
                { label: 'MEDIUM', color: '#f5a623' },
                { label: 'HIGH', color: '#00e5a0' },
              ].map(option => (
                <label key={option.label} className="settings-radio-option">
                  <input
                    type="radio"
                    name="confidence-threshold"
                    value={option.label}
                    checked={confidenceThreshold === option.label}
                    onChange={event => setConfidenceThreshold(event.target.value)}
                  />
                  <span
                    className="settings-threshold-dot"
                    style={{ background: option.color }}
                    aria-hidden="true"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="settings-coordinates-row">
            <div className="settings-field-group">
              <label className="settings-label" htmlFor="default-lat">
                DEFAULT LATITUDE
              </label>
              <input
                id="default-lat"
                type="number"
                value={defaultLat}
                onChange={event => setDefaultLat(event.target.value)}
                style={SETTINGS_INPUT_STYLE}
              />
            </div>

            <div className="settings-field-group">
              <label className="settings-label" htmlFor="default-lng">
                DEFAULT LONGITUDE
              </label>
              <input
                id="default-lng"
                type="number"
                value={defaultLng}
                onChange={event => setDefaultLng(event.target.value)}
                style={SETTINGS_INPUT_STYLE}
              />
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-title">DISPLAY PREFERENCES</div>

          <div className="settings-theme-grid">
            <button
              type="button"
              className={`settings-theme-box ${displayMode === 'dark' ? 'is-selected' : ''}`}
              onClick={() => setDisplayMode('dark')}
            >
              <span className="settings-theme-title">DARK OPERATIVE</span>
              <span className="settings-theme-copy">Operational interface mode</span>
            </button>

            <button
              type="button"
              className={`settings-theme-box ${displayMode === 'light' ? 'is-selected' : ''}`}
              onClick={() => setDisplayMode('light')}
            >
              <span className="settings-theme-title">LIGHT FIELD</span>
              <span className="settings-theme-copy">Visual preview only</span>
            </button>
          </div>

          <div className="settings-theme-note">Light theme coming in final version</div>

          <div className="settings-toggle-row">
            <div>
              <div className="settings-label">RESULT AUTO-SCROLL</div>
              <div className="settings-toggle-copy">Automatically focus the latest analysis output</div>
            </div>

            <button
              type="button"
              className={`settings-toggle ${autoScroll ? 'is-on' : ''}`}
              onClick={() => setAutoScroll(prev => !prev)}
              aria-pressed={autoScroll}
            >
              <span className="settings-toggle-knob" />
            </button>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-title">DATA AND PRIVACY</div>
          <div className="settings-privacy-copy">
            <p>All analysis data is processed locally and via your configured API key.</p>
            <p>No case data is stored permanently in this prototype version.</p>
            <p>This system is intended for authorised investigative use only.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
