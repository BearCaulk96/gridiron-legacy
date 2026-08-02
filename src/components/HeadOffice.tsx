import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { GameResult, LeagueState, Team } from '../game/types';
import { getOfficeTheme } from '../game/officeThemes';
import { teamPower } from '../game/ratings';
import { formatMoney, rosterPlayers, teamCapSpace } from '../game/salary';
import { standings, userTeam } from '../game/season';
import { TeamLogo } from './TeamLogo';
import type { Screen } from '../hooks/useLeague';

interface Props {
  state: LeagueState;
  onBeginSeason: () => void;
  onPlayGame: () => void;
  onEnterDraft: () => void;
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

function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 19c1.5-3 4-4.5 6-4.5S13.5 16 15 19M14 14.5c1.5-.3 3.2-.2 5 1.5" />
    </svg>
  );
}

function IconHandshake() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M8 13l3 3 8-8M3 14l5 5 2-2M16 7l2 2 3-1" />
    </svg>
  );
}

function IconTrade() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </svg>
  );
}

function IconFootball() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <ellipse cx="12" cy="12" rx="9" ry="6" transform="rotate(-35 12 12)" />
      <path d="M10 10l4 4M11 9.5h2M11 14.5h2" stroke="#111" strokeWidth="1.2" />
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
  onBeginSeason,
  onPlayGame,
  onEnterDraft,
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

  const ranked = standings(state);
  const confTeams = ranked.filter((t) => t.conference === team.conference);
  const divTeams = ranked.filter((t) => t.conference === team.conference && t.division === team.division);
  const confRank = confTeams.findIndex((t) => t.id === team.id) + 1;
  const divRank = divTeams.findIndex((t) => t.id === team.id) + 1;

  const myGames = useMemo(
    () =>
      state.schedule
        .filter((g) => g.homeId === team.id || g.awayId === team.id)
        .sort((a, b) => a.week - b.week),
    [state.schedule, team.id],
  );

  const focusWeek =
    state.phase === 'regular'
      ? state.week
      : state.phase === 'preseason'
        ? 1
        : myGames.find((g) => !g.played)?.week ?? 17;

  const focusIdx = Math.max(
    0,
    myGames.findIndex((g) => g.week === focusWeek),
  );
  const [centerIdx, setCenterIdx] = useState(focusIdx);
  useEffect(() => {
    setCenterIdx(focusIdx);
  }, [focusIdx, team.id, state.season]);

  const slots = [-1, 0, 1].map((delta) => {
    const idx = centerIdx + delta;
    return idx >= 0 && idx < myGames.length ? myGames[idx]! : null;
  });

  const currentGame = slots[1];
  const oppTeam = currentGame
    ? state.teams.find((t) => t.id === opponentOf(currentGame, team.id))
    : null;

  const newsBase = state.messages.slice(0, 8);
  const news = (newsBase.length ? newsBase : ['Welcome to the United Football Association.']).concat(
    newsBase.length ? newsBase : ['Welcome to the United Football Association.'],
  );
  const artUrl = theme.hasArt ? `${import.meta.env.BASE_URL}offices/${team.id}.jpg` : null;

  const play = () => {
    if (state.phase === 'preseason') onBeginSeason();
    else if (state.phase === 'regular') onPlayGame();
    else if (state.phase === 'offseason') onEnterDraft();
    else if (state.phase === 'draft') onOpen('draft');
    else if (state.phase === 'freeAgency') onOpen('freeAgency');
    else onOpen('standings');
  };

  const playLabel = (() => {
    if (state.phase === 'preseason') return 'START SEASON';
    if (state.phase === 'regular' && oppTeam) {
      return `${vsLabel(currentGame!, team.id)} ${oppTeam.name.toUpperCase()}`;
    }
    if (state.phase === 'offseason') return 'ENTER DRAFT';
    if (state.phase === 'draft') return 'DRAFT BOARD';
    if (state.phase === 'freeAgency') return 'FREE AGENCY';
    return 'CONTINUE';
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
        {slots.map((game, i) => {
          const label = i === 0 ? 'PREVIOUS WEEK' : i === 1 ? 'CURRENT WEEK' : 'NEXT WEEK';
          if (!game) {
            return (
              <div key={label} className={`office-sched-card ${i === 1 ? 'current empty' : 'empty'}`}>
                <small>{label}</small>
                <strong>—</strong>
              </div>
            );
          }
          const opp = state.teams.find((t) => t.id === opponentOf(game, team.id))!;
          return (
            <div key={game.id} className={`office-sched-card ${i === 1 ? 'current' : ''}`}>
              <small>
                WEEK {game.week} · {label}
              </small>
              <div className="office-sched-match">
                <TeamLogo team={team} size={28} />
                <div>
                  <strong>
                    {vsLabel(game, team.id)} {opp.abbrev}
                  </strong>
                  <span>{game.played ? resultLabel(game, team.id) : opp.city}</span>
                </div>
                <TeamLogo team={opp} size={28} />
              </div>
            </div>
          );
        })}
        <button
          className="office-sched-arrow"
          onClick={() => setCenterIdx((v) => Math.min(myGames.length - 1, v + 1))}
          aria-label="Next week"
        >
          ›
        </button>
      </header>

      <aside className="office-left">
        <button className="office-nav-btn" onClick={() => onOpen('roster')}>
          <IconPeople />
          <span>
            <strong>MY TEAM</strong>
            <small>Roster, lineup, depth chart, & more.</small>
          </span>
        </button>
        <button className="office-nav-btn" onClick={() => onOpen('freeAgency')}>
          <IconHandshake />
          <span>
            <strong>FREE AGENTS</strong>
            <small>View available players and signings.</small>
          </span>
        </button>
        <button className="office-nav-btn" onClick={() => onOpen('trade')}>
          <IconTrade />
          <span>
            <strong>TRADE BLOCK</strong>
            <small>Manage trades, offers and picks.</small>
          </span>
        </button>
        <div className="office-left-extra">
          <button onClick={() => onOpen('coaches')}>Coaches</button>
          <button onClick={() => onOpen('standings')}>Standings</button>
          <button onClick={() => onOpen('cap')}>Cap</button>
          <button onClick={onTitle}>Title</button>
        </div>
      </aside>

      <aside className="office-right">
        <div className="office-team-card">
          <div className="office-team-head">
            <TeamLogo team={team} size={40} />
            <div>
              <small>{theme.tagline}</small>
              <h2>
                {team.city.toUpperCase()} {team.name.toUpperCase()}
              </h2>
            </div>
          </div>
          <ul>
            <li>
              <span>Record</span>
              <strong>
                {team.wins} - {team.losses}
                {team.ties ? ` - ${team.ties}` : ''}
              </strong>
            </li>
            <li>
              <span>Division</span>
              <strong>{ordinal(Math.max(1, divRank))}</strong>
            </li>
            <li>
              <span>Conference</span>
              <strong>{ordinal(Math.max(1, confRank))}</strong>
            </li>
            <li>
              <span>Team Overall</span>
              <strong>{power}</strong>
            </li>
            <li>
              <span>Cap Space</span>
              <strong>{formatMoney(cap)}</strong>
            </li>
            <li>
              <span>Fan Approval</span>
              <strong>{fanApproval}%</strong>
            </li>
          </ul>
        </div>

        <button className="office-play" onClick={play}>
          <IconFootball />
          <span>
            <strong>PLAY NOW</strong>
            <small>{playLabel}</small>
          </span>
        </button>
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
    </div>
  );
}
