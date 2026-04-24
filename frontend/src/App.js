import React, { useState, useEffect } from 'react';
import {Dashboard} from './Pages/Dashboard.js';
import {LocatePhone} from './Pages/LocatePhone.js';
import {MyDevices} from './Pages/MyDevices.js';
import {Settings} from './Pages/Settings.js';
import {Help} from './Pages/Help.js';
import Profile from './Pages/Profile.js';
import './App.css';

const NAV = [
  {
    label: 'General',
    items: [
      { id: 'dashboard', title: 'Dashboard' },
      { id: 'locate', title: 'Locate Phone' },
      { id: 'devices', title: 'My Devices' },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'profile', title: 'Profile' },
      { id: 'settings', title: 'Settings' },
      { id: 'help', title: 'Help' },
    ],
  },
];
const PAGES = {
  dashboard: Dashboard,
  locate:    LocatePhone,
  devices:   MyDevices,
  profile:   Profile,
  settings:  Settings,
  help:      Help,
};


function App() {

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLocate = currentPage === 'locate';
  const PageComponent = PAGES[currentPage];

  // Close sidebar on desktop resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setSidebarOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function navigate(id) {
    setCurrentPage(id);
    setSidebarOpen(false);
  }
  
  return (
    <div className="App">
{/* ── HEADER ── */}
      <header className="header">
        <button
          className={`ham ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(prev => !prev)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        {isLocate
          ? <input className="search-bar" autoFocus type="text" placeholder="Search phone number or device…" />
          : <div className="site-name">My<span>App</span></div>
        }
      </header>

      {/* ── SIDEBAR OVERLAY (mobile) ── */}
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {NAV.map(section => (
          <div className="nav-group" key={section.label}>
            <span className="nav-group-label">{section.label}</span>
            {section.items.map(item => (
              <button
                key={item.id}
                className={`nav-btn ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => navigate(item.id)}
              >
                <span className="nav-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d={item.icon} />
                  </svg>
                </span>
                {item.title}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main">
        <PageComponent />
      </main>

    </div>
  );
}

export default App;
