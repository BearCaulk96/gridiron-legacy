import { useState } from 'react';

type Modal = 'options' | 'stats' | 'hof' | 'credits' | 'settings' | null;

interface Props {
  hasSave: boolean;
  onNew: (teamId?: string) => void;
  onContinue: () => void;
}

const MENU = [
  {
    id: 'new',
    title: 'New Dynasty',
    sub: 'Start a new franchise.',
    icon: 'shield',
  },
  {
    id: 'load',
    title: 'Load Dynasty',
    sub: 'Continue a saved dynasty.',
    icon: 'folder',
  },
  {
    id: 'options',
    title: 'League Options',
    sub: 'Rules, settings & more.',
    icon: 'gear',
  },
  {
    id: 'stats',
    title: 'Stats & Records',
    sub: 'History, leaders & more.',
    icon: 'chart',
  },
  {
    id: 'hof',
    title: 'Hall of Fame',
    sub: 'Honor the greats.',
    icon: 'temple',
  },
] as const;

function MenuIcon({ name }: { name: (typeof MENU)[number]['icon'] }) {
  switch (name) {
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'folder':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 7h6l2 2h10v10H3V7z" />
        </svg>
      );
    case 'gear':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </svg>
      );
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 20V10M12 20V4M20 20v-7" />
        </svg>
      );
    case 'temple':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 20h16M6 20V10l6-4 6 4v10M9 20v-6h6v6" />
        </svg>
      );
  }
}

function Trophy() {
  return (
    <div className="title-trophy" aria-hidden>
      <svg viewBox="0 0 120 160" width="100%" height="100%">
        <defs>
          <linearGradient id="cupMetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f3f4f6" />
            <stop offset="45%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
          <linearGradient id="cupGold" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#8a6a12" />
            <stop offset="50%" stopColor="#f0c14b" />
            <stop offset="100%" stopColor="#fff1b8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse cx="60" cy="148" rx="34" ry="8" fill="#f0c14b" opacity="0.35" filter="url(#glow)" />
        <rect x="48" y="118" width="24" height="18" rx="2" fill="url(#cupGold)" />
        <path d="M40 136h40l6 12H34z" fill="url(#cupGold)" />
        <path
          d="M30 28c0 28 8 48 30 56 22-8 30-28 30-56H30z"
          fill="url(#cupMetal)"
          stroke="#d1d5db"
          strokeWidth="2"
        />
        <path d="M30 40c-12 2-18 12-16 22 4 8 12 8 16 6" fill="none" stroke="url(#cupMetal)" strokeWidth="6" />
        <path d="M90 40c12 2 18 12 16 22-4 8-12 8-16 6" fill="none" stroke="url(#cupMetal)" strokeWidth="6" />
        <ellipse cx="60" cy="52" rx="16" ry="22" fill="#111827" opacity="0.25" />
        <path
          d="M48 44c4-8 20-8 24 0-2 8-6 14-12 18-6-4-10-10-12-18z"
          fill="url(#cupMetal)"
          stroke="#9ca3af"
        />
        <circle cx="60" cy="50" r="3" fill="#f0c14b" />
      </svg>
    </div>
  );
}

export function TitleScreen({ hasSave, onNew, onContinue }: Props) {
  const [activeMenu, setActiveMenu] = useState<(typeof MENU)[number]['id']>('new');
  const [modal, setModal] = useState<Modal>(null);

  const runMenu = (id: (typeof MENU)[number]['id']) => {
    setActiveMenu(id);
    if (id === 'new') onNew();
    else if (id === 'load') {
      if (hasSave) onContinue();
      else setModal('stats');
    } else if (id === 'options') setModal('options');
    else if (id === 'stats') setModal('stats');
    else if (id === 'hof') setModal('hof');
  };

  return (
    <div className="title-root">
      <div className="title-stage">
        <div
          className="title-bg"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}title-stadium.png)` }}
        />
        <div className="title-bg-shade" />

        <main className="title-center">
          <h1 className="title-wordmark">
            <span className="silver">GRIDIRON</span>
            <span className="gold">
              <i />
              DYNASTY
              <i />
            </span>
          </h1>

          <Trophy />
        </main>

        <nav className="title-menu" aria-label="Main menu">
          {MENU.map((item) => {
            const disabled = item.id === 'load' && !hasSave;
            return (
              <button
                key={item.id}
                className={`title-menu-btn ${activeMenu === item.id ? 'active' : ''} ${disabled ? 'dim' : ''}`}
                onClick={() => runMenu(item.id)}
                onMouseEnter={() => setActiveMenu(item.id)}
                onFocus={() => setActiveMenu(item.id)}
              >
                <span className="title-menu-icon">
                  <MenuIcon name={item.icon} />
                </span>
                <span className="title-menu-copy">
                  <strong>{item.title}</strong>
                  <small>{item.id === 'load' && !hasSave ? 'No save found yet.' : item.sub}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <footer className="title-footer">
          <div className="title-footer-left">
            <button onClick={() => setModal('settings')}>⚙ Settings</button>
            <button onClick={() => setModal('credits')}>Credits</button>
          </div>
          <div className="title-footer-center">Welcome to Gridiron Dynasty</div>
          <div className="title-footer-right">
            <span>Version 1.0.0</span>
            <button
              onClick={() => {
                setModal(null);
                setActiveMenu('new');
              }}
              title="Reset title screen"
            >
              ✕ Exit Game
            </button>
          </div>
        </footer>
      </div>

      {modal && (
        <div className="title-modal-backdrop" onClick={() => setModal(null)}>
          <div className="title-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            {modal === 'options' && (
              <>
                <h3>League Options</h3>
                <p>Choose your path when you start a New Dynasty:</p>
                <ul>
                  <li>
                    <strong>Casual / Rookie / Pro / Veteran</strong> — each changes drafting fog, trade AI, salary cap pressure, and simulation.
                  </li>
                  <li>No microtransactions. No pay-to-win unlocks.</li>
                  <li>32 UFA franchises across American & National conferences.</li>
                </ul>
              </>
            )}
            {modal === 'settings' && (
              <>
                <h3>Settings</h3>
                <p>Built for phones and tablets — portrait works throughout the dynasty.</p>
                <p>Progress autosaves in this browser after you take a GM job.</p>
                <p>Free forever — built for franchise managers, not wallets.</p>
              </>
            )}
            {modal === 'stats' && (
              <>
                <h3>Stats & Records</h3>
                {hasSave ? (
                  <p>A dynasty save is ready. Use <strong>Load Dynasty</strong> to return to your franchise hub, standings, and season history.</p>
                ) : (
                  <p>No dynasty on file yet. Start a New Dynasty to begin writing league history.</p>
                )}
              </>
            )}
            {modal === 'hof' && (
              <>
                <h3>Hall of Fame</h3>
                <p>Champions and legends will be enshrined here as your dynasties win Gridiron Cups across seasons.</p>
                <p className="muted">The doors open once the first cup is claimed.</p>
              </>
            )}
            {modal === 'credits' && (
              <>
                <h3>Credits</h3>
                <p>
                  <strong>Gridiron Dynasty</strong>
                </p>
                <p>United Football Association · Franchise simulation</p>
                <p>Designed for managers who build through drafts, trades, coaching, and the cap — not cash shop shortcuts.</p>
              </>
            )}
            <button className="btn btn-primary" onClick={() => setModal(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
