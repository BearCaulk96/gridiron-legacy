import { useEffect, useState, type CSSProperties } from 'react';
import type { GameResult, LeagueState, Team } from '../game/types';
import {
  CALENDAR_LENGTH,
  calendarCardLabel,
  calendarSlot,
  currentCalendar,
  formatCalendarLabel,
} from '../game/calendar';
import { getOfficeTheme } from '../game/officeThemes';
import { teamPower } from '../game/ratings';
import { formatMoney, rosterPlayers, teamCapSpace } from '../game/salary';
import { isDraftInProgress } from '../game/draft';
import { standings, userGameThisWeek, userTeam } from '../game/season';
import { TeamLogo } from './TeamLogo';
import { GameMenu, type MenuDestination } from './GameMenu';
import type { Screen } from '../hooks/useLeague';

interface Props {
  state: LeagueState;
  onPlayGame: () => void;
  onAdvanceCalendar: () => void;
  onOpen: (screen: Screen) => void;
  onTitle: () => void;
}

function opponentOf(game: GameResult, teamId: string): string {
  return game.homeId === teamId ? game.awayId : game.homeId;
}

function resultLabel(game: GameResult, teamId: string): string {
  const mine = game.homeId === teamId ? game.homeScore : game.awayScore;
  const theirs = game.homeId === teamId ? game.awayScore : game.homeScore;
  const prefix = mine > theirs ? 'W' : mine < theirs ? 'L' : 'T';
  return `${prefix} ${mine}-${theirs}`;
}

function vsLabel(game: GameResult, teamId: string): string {
  return game.homeId === teamId ? 'VS' : 'AT';
}

function ordinal(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}ST`;
  if (j === 2 && k !== 12) return `${n}ND`;
  if (j === 3 && k !== 13) return `${n}RD`;
  return `${n}TH`;
}

function IconFootball() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <ellipse cx="12" cy="12" rx="9" ry="6" transform="rotate(-35 12 12)" />
      <path d="M10 10l4 4M11 9.5h2M11 14.5h2" stroke="#111" strokeWidth="1.2" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function ProceduralOffice({
  team,
  theme,
}: {
  team: Team;
  theme: ReturnType<typeof getOfficeTheme>;
}) {
  return (
    <div
      className={`office-proc office-proc-${theme.style}`}
      style={
        {
          '--office-primary': team.primary,
          '--office-secondary': team.secondary,
          '--office-accent': team.accent,
        } as CSSProperties
      }
    >
      <div className="office-proc-wall" />
      <div className="office-proc-window">
        <div className="office-proc-sky" />
        <div className="office-proc-skyline" data-city={team.id} />
        <span className="office-proc-sky-label">{theme.skyline}</span>
      </div>
      <div className="office-proc-banner">
        {theme.banner.split('').map((ch, i) => (
          <span key={`${ch}-${i}`}>{ch === ' ' ? '·' : ch}</span>
        ))}
      </div>
      <div className="office-proc-shelf" />
      <div className="office-proc-desk">
        <div className="office-proc-plaque">
          <TeamLogo team={team} size={54} />
          <strong>
            {team.city.toUpperCase()}
            <br />
            {team.name.toUpperCase()}
          </strong>
        </div>
      </div>
      <div className="office-proc-chair" />
      <div className="office-proc-rug">
        <TeamLogo team={team} size={72} />
      </div>
    </div>
  );
}

export function HeadOffice({
  state,
  onPlayGame,
  onAdvanceCalendar,
  onOpen,
  onTitle,
}: Props) {
  const team = userTeam(state);
  const theme = getOfficeTheme(team);
  const power = Math.round(teamPower(state, team.id));
  const cap = teamCapSpace(state, team.id);
  const fanApproval = Math.round(
    rosterPlayers(state, team.id).reduce((s, p) => s + p.morale, 0) /
      Math.max(1, rosterPlayers(state, team.id).length),
  );
  const cal = currentCalendar(state);
  const userGame = userGameThisWeek(state);

  const ranked = standings(state);
  const confTeams = ranked.filter((t) => t.conference === team.conference);
  const divTeams = ranked.filter((t) => t.conference === team.conference && t.division === team.division);
  const confRank = confTeams.findIndex((t) => t.id === team.id) + 1;
  const divRank = divTeams.findIndex((t) => t.id === team.id) + 1;

  const [centerIdx, setCenterIdx] = useState(state.calendarIndex);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    setCenterIdx(state.calendarIndex);
  }, [state.calendarIndex, team.id, state.season]);

  const openMenuItem = (id: MenuDestination) => {
    setMenuOpen(false);
    if (id === 'title') {
      onTitle();
      return;
    }
    if (id === 'hub') return;
    onOpen(id);
  };

  const slots = [-1, 0, 1].map((delta) => {
    const idx = centerIdx + delta;
    if (idx < 0 || idx >= CALENDAR_LENGTH) return null;
    return calendarSlot(idx);
  });

  const matchupForSlot = (index: number): GameResult | null => {
    const slot = calendarSlot(index);
    if (slot.seasonWeek == null || slot.playAction !== 'gameday') return null;
    return (
      state.schedule.find(
        (g) =>
          g.week === slot.seasonWeek &&
          !!g.preseason === !!slot.preseason &&
          !!g.playoff === !!slot.playoff &&
          (g.homeId === team.id || g.awayId === team.id),
      ) ?? null
    );
  };

  const currentGame = userGame ?? matchupForSlot(state.calendarIndex);
  const oppTeam = currentGame
    ? state.teams.find((t) => t.id === opponentOf(currentGame, team.id))
    : null;

  const newsBase = state.messages.slice(0, 8);
  const news = (newsBase.length ? newsBase : ['Welcome to the United Football Association.']).concat(
    newsBase.length ? newsBase : ['Welcome to the United Football Association.'],
  );
  const artUrl = theme.hasArt ? `${import.meta.env.BASE_URL}offices/${team.id}.jpg` : null;

  const draftOpen = cal.kind === 'draft' && isDraftInProgress(state);

  const primaryMode: 'play' | 'draft' | 'advance' = userGame
    ? 'play'
    : draftOpen
      ? 'draft'
      : 'advance';

  const runPrimary = () => {
    if (primaryMode === 'play') {
      onPlayGame();
      return;
    }
    if (primaryMode === 'draft') {
      onOpen('draft');
      return;
    }
    onAdvanceCalendar();
  };

  const primaryLabel =
    primaryMode === 'play' ? 'Play Now' : primaryMode === 'draft' ? 'Draft Night' : 'Advance Week';

  const primaryDetail = (() => {
    if (primaryMode === 'play' && oppTeam && currentGame) {
      return `${vsLabel(currentGame, team.id)} ${oppTeam.name.toUpperCase()}`;
    }
    if (primaryMode === 'draft') return 'ENTER THE DRAFT';
    if (cal.kind === 'draft') return 'DRAFT COMPLETE';
    return cal.shortTitle.toUpperCase();
  })();

  return (
    <div
      className="office-root"
      style={
        {
          '--office-primary': team.primary,
          '--office-secondary': team.secondary,
          '--office-accent': team.accent,
          '--office-glow': theme.glow,
        } as CSSProperties
      }
    >
      {artUrl ? (
        <div className="office-bg" style={{ backgroundImage: `url(${artUrl})` }} />
      ) : (
        <ProceduralOffice team={team} theme={theme} />
      )}
      <div className="office-shade" />

      <header className="office-schedule">
        <button
          className="office-sched-arrow"
          onClick={() => setCenterIdx((v) => Math.max(0, v - 1))}
          aria-label="Previous week"
        >
          ‹
        </button>
        {slots.map((slot, i) => {
          const when = i === 0 ? 'PREVIOUS' : i === 1 ? 'CURRENT' : 'NEXT';
          if (!slot) {
            return (
              <div key={when} className={`office-sched-card ${i === 1 ? 'current empty' : 'empty'}`}>
                <small>{when}</small>
                <strong>—</strong>
              </div>
            );
          }
          const game = matchupForSlot(slot.index);
          const opp = game ? state.teams.find((t) => t.id === opponentOf(game, team.id)) : null;
          return (
            <div
              key={slot.index}
              className={`office-sched-card ${slot.index === state.calendarIndex ? 'current' : ''}`}
            >
              <small>
                {calendarCardLabel(slot)} · {when}
              </small>
              {game && opp ? (
                <div className="office-sched-match">
                  <TeamLogo team={team} size={28} />
                  <div>
                    <strong>
                      {vsLabel(game, team.id)} {opp.abbrev}
                    </strong>
                    <span>{game.played ? resultLabel(game, team.id) : slot.shortTitle}</span>
                  </div>
                  <TeamLogo team={opp} size={28} />
                </div>
              ) : (
                <div className="office-sched-match office-sched-event">
                  <div>
                    <strong>{slot.shortTitle}</strong>
                    <span>{formatCalendarLabel(slot, state.season)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button
          className="office-sched-arrow"
          onClick={() => setCenterIdx((v) => Math.min(CALENDAR_LENGTH - 1, v + 1))}
          aria-label="Next week"
        >
          ›
        </button>
      </header>

      <aside className="office-right">
        <div className="office-team-card">
          <div className="office-team-head">
            <TeamLogo team={team} size={22} />
            <div>
              <h2>
                {team.city.toUpperCase()} {team.name.toUpperCase()}
              </h2>
            </div>
          </div>
          <ul>
            <li>
              <span>Record</span>
              <strong>
                {team.wins}-{team.losses}
                {team.ties ? `-${team.ties}` : ''}
              </strong>
            </li>
            <li>
              <span>Div / Conf</span>
              <strong>
                {ordinal(Math.max(1, divRank))} / {ordinal(Math.max(1, confRank))}
              </strong>
            </li>
            <li>
              <span>OVR / Cap</span>
              <strong>
                {power} · {formatMoney(cap)}
              </strong>
            </li>
            <li>
              <span>Fans</span>
              <strong>{fanApproval}%</strong>
            </li>
          </ul>
        </div>

        <div className="office-actions">
          <div className="office-cal-stamp">
            <small>{formatCalendarLabel(cal, state.season)}</small>
            <strong>{cal.title}</strong>
          </div>
          <button type="button" className="office-menu-launch" onClick={() => setMenuOpen(true)}>
            <IconMenu />
            <span>
              <strong>Menus</strong>
              <small>Roster, FA, Draft, more</small>
            </span>
          </button>
          <button type="button" className={`office-play office-play-${primaryMode}`} onClick={runPrimary}>
            <IconFootball />
            <span>
              <strong>{primaryLabel}</strong>
              <small>{primaryDetail}</small>
            </span>
          </button>
        </div>
      </aside>

      <footer className="office-news">
        <strong>LEAGUE NEWS</strong>
        <div className="office-news-track">
          <div className="office-news-marquee">
            {news.map((n, i) => (
              <span key={`${i}-${n.slice(0, 10)}`}>{n}</span>
            ))}
          </div>
        </div>
      </footer>

      <GameMenu open={menuOpen} current="hub" onClose={() => setMenuOpen(false)} onNavigate={openMenuItem} />
    </div>
  );
}
