import React from 'react';

export function Dashboard() {
  return (
    <>
      <h1 className="page-title">Welcome back, John 👋</h1>
      <p className="page-sub">Here's what you need to know before using this app.</p>
      <div className="good-box">
        <div className="good-title">Best Practices to Follow</div>
        <p className="good-body">
          When used correctly, location tracking can be a genuinely helpful tool. Here's how to use it responsibly:
        </p>
        <ul className="good-list">
          <li>Always get <strong>verbal or written consent</strong> from the person before tracking their device.</li>
          <li>Use tracking only for <strong>agreed upon purposes</strong> such as child safety, elderly care, or finding a lost device.</li>
          <li>Let the person being tracked know they can <strong>opt out at any time</strong>.</li>
          <li>Keep any location data <strong>private and secure</strong> — never share it with unauthorised parties.</li>
        </ul>
      </div>
      <div className="warning-box">
        <div className="warning-title">Use Responsibly — Consent is Required</div>
        <p className="warning-body">
          This app allows you to track the location of a phone or device. Before using the locate feature, please be aware of the following:
        </p>
        <ul className="warning-list">
          <li>You <strong>must have explicit permission</strong> from the person you intend to track before doing so.</li>
          <li>Tracking someone without their knowledge is a <strong>violation of their privacy</strong> and may be illegal in your region.</li>
          <li>Always inform the person being tracked about when, why, and how their location is being monitored.</li>
          <li>This tool should only be used for legitimate purposes such as family safety, device recovery, or fleet management.</li>
        </ul>
      </div>

      <div className="danger-box">
        <div className="danger-title">Misuse is a Serious Offence</div>
        <p className="danger-body">
          Using location tracking to stalk, harass, monitor, or control another person without their consent is <strong>illegal</strong> and can result in criminal prosecution. If you believe someone is being tracked without their consent, advise them to seek help immediately. The developers of this app do not condone any form of misuse and are not liable for how this tool is used.
        </p>
      </div>
    </>
  );
}