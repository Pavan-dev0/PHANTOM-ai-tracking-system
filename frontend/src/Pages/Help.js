import React from 'react';

const ABOUT_CARDS = [
  {
    title:
      'PHANTOM — Predictive Human Analysis Through Network of Tracked Observable Markers',
    body:
      'PHANTOM models human movement through physical space using last known location, elapsed time, and available transport to calculate a realistic search zone. It treats the absence of a signal as evidence not silence. The system continuously narrows the zone as new information arrives giving investigators a prioritised area rather than a single point.',
  },
  {
    title: 'WRAITH — Cognitive Forensics Engine',
    body:
      'WRAITH analyses the digital traces left by a person before disappearance including search patterns app usage and map queries. It reconstructs their probable mental state and intended destination category and identifies which stage of intention crystallisation the person had reached: vague, narrowing, specific, or action. This cognitive signal is fused with the PHANTOM movement signal to produce a unified confidence-weighted search recommendation.',
  },
];

const ANALYSIS_STEPS = [
  'Go to NEW ANALYSIS in the sidebar',
  'Click a preloaded case button or fill the form manually',
  'Click RUN ANALYSIS and watch the status bar',
  'Review the result card for confidence score dominant engine and intent stage',
  'Click OPEN SEARCH ZONE to view the area in Google Maps',
  'Click EXPORT REPORT to download the PDF case report',
];

export function Help() {
  return (
    <div>
      <h1 className="page-title">ABOUT PHANTOM-WRAITH</h1>

      <div className="about-grid">
        {ABOUT_CARDS.map(card => (
          <section key={card.title} className="about-card">
            <div className="about-card-title">{card.title}</div>
            <p className="about-card-body">{card.body}</p>
          </section>
        ))}

        <section className="about-card">
          <div className="about-card-title">HOW TO RUN AN ANALYSIS</div>
          <ol className="about-steps-list">
            {ANALYSIS_STEPS.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>

      <div className="about-footer">
        PHANTOM-WRAITH v1.0 — Prototype Build — MCA Final Year Project
      </div>
    </div>
  );
}
