import { useState, type ReactNode } from 'react';
import type { LeagueState } from '../game/types';
import type { Screen } from '../hooks/useLeague';
import { currentCalendar, formatCalendarLabel } from '../game/calendar';
import { userTeam } from '../game/season';
import { TeamLogo } from './TeamLogo';
import { GameMenu, type MenuDestination } from './GameMenu';

interface Props {
  state: LeagueState;
  screen: Screen;
  setScreen: (s: Screen) => void;
  onTitle: () => void;
  children: ReactNode;
}

const TITLES: Partial<Record<Screen, string>> = {
  roster: 'My Team',
  coaches: 'Coaches',
  trade: 'Trade Block',
  standings: 'Standings',
  cap: 'Salary Cap',
};

export function Shell({ state, screen, setScreen, onTitle, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const team = userTeam(state);
  const cal = currentCalendar(state);
  const title = TITLES[screen] ?? 'Gridiron';

  const go = (id: MenuDestination) => {
    setMenuOpen(false);
    if (id === 'title') {
      onTitle();
      return;
    }
    if (id === 'hub') {
      setScreen('hub');
      return;
    }
    setScreen(id);
  };

  return (
    <div className="app-shell app-shell-locked app-shell-mobile">
      <header className="shell-top">
        <button type="button" className="shell-back" onClick={() => setScreen('hub')}>
          ← Office
        </button>
        <div className="shell-top-center">
          <h1>{title}</h1>
          <p>
            {formatCalendarLabel(cal, state.season)} · {cal.shortTitle}
          </p>
        </div>
        <button type="button" className="shell-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menus">
          <TeamLogo team={team} size={28} />
          <span>Menu</span>
        </button>
      </header>

      <div className="app-shell-body">{children}</div>

      <GameMenu open={menuOpen} current={screen} onClose={() => setMenuOpen(false)} onNavigate={go} />
    </div>
  );
}
