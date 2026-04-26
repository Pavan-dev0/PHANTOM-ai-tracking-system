import React, { useEffect, useState } from 'react';
import {
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Dashboard } from './Pages/Dashboard.js';
import { LocatePhone } from './Pages/LocatePhone.js';
import { MyDevices } from './Pages/MyDevices.js';
import { Settings } from './Pages/Settings.js';
import { Help } from './Pages/Help.js';
import Profile from './Pages/Profile.js';
import { USE_MOCK } from './api.js';
import './App.css';

const NAV = [
  {
    label: 'General',
    items: [
      { id: 'dashboard', title: 'CASE OVERVIEW', path: '/' },
      { id: 'locate', title: 'NEW ANALYSIS', path: '/new-analysis' },
      { id: 'devices', title: 'ACTIVE CASES', path: '/active-cases' },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'profile', title: 'INVESTIGATOR PROFILE', path: '/profile' },
      { id: 'settings', title: 'SYSTEM SETTINGS', path: '/settings' },
      { id: 'help', title: 'ABOUT PHANTOM-WRAITH', path: '/about' },
    ],
  },
];

const DEFAULT_PAGE_ID = 'dashboard';

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage =
    NAV.flatMap(section => section.items).find(item => item.path === location.pathname)?.id ||
    DEFAULT_PAGE_ID;

  const isLocate = currentPage === 'locate';

  // Close sidebar on desktop resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setSidebarOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handleNavigate(path) {
    navigate(path);
    setSidebarOpen(false);
  }

  return (
    <>
      <div className="app-grid-overlay" aria-hidden="true" />
      <div className="App" data-mode={USE_MOCK ? 'mock' : 'live'}>
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
          <div className="sidebar-brand">
            <span className="sidebar-brand-dot" aria-hidden="true" />
            <span className="sidebar-brand-name">PHANTOM-WRAITH</span>
          </div>

          {NAV.map(section => (
            <div className="nav-group" key={section.label}>
              <span className="nav-group-label">{section.label}</span>
              {section.items.map(item => (
                <button
                  key={item.id}
                  className={`nav-btn ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => handleNavigate(item.path)}
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
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-analysis" element={<LocatePhone />} />
            <Route path="/active-cases" element={<MyDevices />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<Help />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppShell />
    </MemoryRouter>
  );
}

export default App;
