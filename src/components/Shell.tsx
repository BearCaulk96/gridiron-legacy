import type { ReactNode } from 'react';
import type { LeagueState } from '../game/types';
import type { Screen } from '../hooks/useLeague';
import { currentCalendar, formatCalendarLabel } from '../game/calendar';
import { DIFFICULTIES } from '../game/difficulty';
import { formatMoney, teamCapHit, teamCapSpace } from '../game/salary';
import { userTeam } from '../game/season';
import { TeamLogo } from './TeamLogo';

interface Props {
  state: LeagueState;
  screen: Screen;
  setScreen: (s: Screen) => void;
  onAbandon: () => void;
  children: ReactNode;
}

const LINKS: { id: Screen; label: string }[] = [
  { id: 'hub', label: 'Office' },
  { id: 'roster', label: 'Roster' },
  { id: 'coaches', label: 'Coaches' },
  { id: 'trade', label: 'Trade' },
  { id: 'draft', label: 'Draft' },
  { id: 'freeAgency', label: 'Free Agency' },
  { id: 'standings', label: 'Standings' },
  { id: 'cap', label: 'Cap' },
];

export function Shell({ state, screen, setScreen, onAbandon, children }: Props) {
  const team = userTeam(state);
  const cfg = DIFFICULTIES[state.difficulty];
  const cal = currentCalendar(state);

  return (
    <div className="app-shell">
      <header className="nav-bar">
        <div>
          <div className="brand-mark" style={{ fontSize: '2rem' }}>
            GRIDIRON DYNASTY
          </div>
          <div className="muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <TeamLogo team={team} size={22} />
            <span>
              {team.city} {team.name} · {cfg.label} · {formatCalendarLabel(cal, state.season)} ·{' '}
              {cal.shortTitle}
              {' · '}
              Cap space {formatMoney(teamCapSpace(state, team.id))}
            </span>
          </div>
        </div>
        <button className="btn btn-ghost btn-small" onClick={onAbandon}>
          New Game
        </button>
      </header>
      <nav className="nav-links" style={{ marginBottom: '1rem' }}>
        {LINKS.map((l) => (
          <button key={l.id} className={screen === l.id ? 'active' : ''} onClick={() => setScreen(l.id)}>
            {l.label}
          </button>
        ))}
      </nav>
      <div className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
        Cap used {formatMoney(teamCapHit(state, team.id))} / {formatMoney(state.salaryCap)}
        {cfg.capSoftPercent > 1 ? ` (soft to ${formatMoney(Math.floor(state.salaryCap * cfg.capSoftPercent))})` : ''}
      </div>
      {children}
    </div>
  );
}
