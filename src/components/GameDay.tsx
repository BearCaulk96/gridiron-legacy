import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { LeagueState } from '../game/types';
import {
  ballSpotLabel,
  createLiveGame,
  formatClock,
  stepPlay,
  stepUntilFinal,
  stepUntilQuarterChange,
  totalYards,
  type LiveGameState,
} from '../game/playByPlay';
import { userGameThisWeek } from '../game/season';
import { TeamLogo } from './TeamLogo';

interface Props {
  state: LeagueState;
  onFinish: (live: LiveGameState) => void;
  onBack: () => void;
}

interface Marker {
  id: string;
  kind: 'O' | 'X';
  x: number;
  y: number;
}

/** Place simple O (offense) / X (defense) markers relative to the ball. */
function formationMarkers(live: LiveGameState): Marker[] {
  const los = 12 + (live.ballOn / 100) * 76;
  const dir = live.possession === 'home' ? 1 : -1;
  const oBack = -dir * 3.2;
  const dFwd = dir * 3.4;

  const offense: Array<[number, number]> = [
    [oBack - dir * 2.2, 50],
    [oBack, 28],
    [oBack, 38],
    [oBack, 50],
    [oBack, 62],
    [oBack, 72],
    [oBack + dir * 1.4, 22],
    [oBack + dir * 1.4, 78],
    [oBack - dir * 4.5, 42],
    [oBack - dir * 4.5, 58],
    [oBack + dir * 3.5, 50],
  ];
  const defense: Array<[number, number]> = [
    [dFwd, 32],
    [dFwd, 44],
    [dFwd, 56],
    [dFwd, 68],
    [dFwd + dir * 2.2, 24],
    [dFwd + dir * 2.2, 76],
    [dFwd + dir * 4.5, 36],
    [dFwd + dir * 4.5, 50],
    [dFwd + dir * 4.5, 64],
    [dFwd + dir * 7.5, 30],
    [dFwd + dir * 7.5, 70],
  ];

  const clampX = (x: number) => Math.min(94, Math.max(6, x));
  const markers: Marker[] = [];
  offense.forEach(([dx, y], i) => {
    markers.push({ id: `o${i}`, kind: 'O', x: clampX(los + dx), y });
  });
  defense.forEach(([dx, y], i) => {
    markers.push({ id: `x${i}`, kind: 'X', x: clampX(los + dx), y });
  });
  return markers;
}

function BoxTable({
  title,
  stats,
}: {
  title: string;
  stats: LiveGameState['homeStats'];
}) {
  return (
    <div className="gameday-box">
      <h3>{title}</h3>
      <dl>
        <div>
          <dt>Total yards</dt>
          <dd>{totalYards(stats)}</dd>
        </div>
        <div>
          <dt>Passing</dt>
          <dd>
            {stats.completions}/{stats.attempts}, {stats.passYards} yd, {stats.passTd} TD
          </dd>
        </div>
        <div>
          <dt>Rushing</dt>
          <dd>
            {stats.rushes} att, {stats.rushYards} yd, {stats.rushTd} TD
          </dd>
        </div>
        <div>
          <dt>First downs</dt>
          <dd>{stats.firstDowns}</dd>
        </div>
        <div>
          <dt>Turnovers</dt>
          <dd>{stats.turnovers}</dd>
        </div>
        <div>
          <dt>Sacks / INT</dt>
          <dd>
            {stats.sacks} / {stats.ints}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function GameDay({ state, onFinish, onBack }: Props) {
  const matchup = useMemo(() => userGameThisWeek(state), [state]);
  const [live, setLive] = useState<LiveGameState | null>(() =>
    matchup ? createLiveGame(state, matchup) : null,
  );
  const [watching, setWatching] = useState(false);
  const [pulse, setPulse] = useState(0);

  const home = state.teams.find((t) => t.id === live?.homeId);
  const away = state.teams.find((t) => t.id === live?.awayId);

  useEffect(() => {
    if (!watching) return;
    const id = window.setInterval(() => {
      setLive((prev) => {
        if (!prev || prev.phase === 'final') {
          setWatching(false);
          return prev;
        }
        const next = structuredClone(prev);
        stepPlay(state, next);
        setPulse((p) => p + 1);
        if (next.phase === 'final') setWatching(false);
        return next;
      });
    }, 900);
    return () => window.clearInterval(id);
  }, [watching, state]);

  if (!matchup || !live || !home || !away) {
    return (
      <div className="gameday-root">
        <div className="gameday-empty panel">
          <p>No game to watch this week.</p>
          <button type="button" className="btn btn-primary" onClick={onBack}>
            Back to Office
          </button>
        </div>
      </div>
    );
  }

  const markers = formationMarkers(live);
  const possTeam = live.possession === 'home' ? home : away;
  const spot = ballSpotLabel(live, home.abbrev, away.abbrev);
  const downDist =
    live.phase === 'kickoff'
      ? 'Kickoff'
      : live.phase === 'final'
        ? 'Final'
        : `${live.down}${live.down === 1 ? 'st' : live.down === 2 ? 'nd' : live.down === 3 ? 'rd' : 'th'} & ${live.distance}`;

  const nextPlay = () => {
    setWatching(false);
    setLive((prev) => {
      if (!prev || prev.phase === 'final') return prev;
      const next = structuredClone(prev);
      stepPlay(state, next);
      setPulse((p) => p + 1);
      return next;
    });
  };

  const simQuarter = () => {
    setWatching(false);
    setLive((prev) => {
      if (!prev || prev.phase === 'final') return prev;
      const next = structuredClone(prev);
      stepUntilQuarterChange(state, next);
      setPulse((p) => p + 1);
      return next;
    });
  };

  const simGame = () => {
    setWatching(false);
    setLive((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      stepUntilFinal(state, next);
      setPulse((p) => p + 1);
      return next;
    });
  };

  if (live.phase === 'final') {
    return (
      <div className="gameday-root gameday-final">
        <header className="gameday-final-head">
          <p className="eyebrow">Final</p>
          <div className="gameday-final-score">
            <div>
              <TeamLogo team={away} size={48} />
              <span>
                {away.city} {away.name}
              </span>
              <strong>{live.awayScore}</strong>
            </div>
            <span className="gameday-at">@</span>
            <div>
              <TeamLogo team={home} size={48} />
              <span>
                {home.city} {home.name}
              </span>
              <strong>{live.homeScore}</strong>
            </div>
          </div>
        </header>
        <div className="gameday-boxes">
          <BoxTable title={`${away.abbrev} stats`} stats={live.awayStats} />
          <BoxTable title={`${home.abbrev} stats`} stats={live.homeStats} />
        </div>
        <div className="gameday-final-actions">
          <button type="button" className="btn btn-primary" onClick={() => onFinish(live)}>
            Return to Office
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="gameday-root"
      style={
        {
          '--home-primary': home.primary,
          '--home-secondary': home.secondary,
          '--home-accent': home.accent,
        } as CSSProperties
      }
    >
      <header className="gameday-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Office
        </button>
        <div className="gameday-matchup">
          <span>
            {away.abbrev} @ {home.abbrev}
          </span>
          <small>
            Week {state.week} · {home.city}
          </small>
        </div>
        <span className="gameday-scheme">
          {live.possession === 'home' ? home.abbrev : away.abbrev} · {live.possession === 'home' ? live.homeScheme : live.awayScheme}
        </span>
      </header>

      <div className={`gameday-field ${pulse % 2 === 0 ? 'pulse-a' : 'pulse-b'}`} aria-label="Football field">
        <div className="gameday-endzone left">
          <TeamLogo team={home} size={44} />
          <span>
            {home.city}
            <br />
            {home.name}
          </span>
        </div>
        <div className="gameday-grid">
          {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((n, i) => (
            <div key={i} className="gameday-yard" data-n={n} />
          ))}
          <div
            className="gameday-los"
            style={{ left: `${12 + (live.ballOn / 100) * 76}%` }}
            title="Line of scrimmage"
          />
          <div
            className="gameday-ball"
            style={{ left: `${12 + (live.ballOn / 100) * 76}%` }}
            aria-hidden
          />
          {markers.map((m) => (
            <span
              key={m.id}
              className={`gameday-marker kind-${m.kind}`}
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
            >
              {m.kind}
            </span>
          ))}
        </div>
        <div className="gameday-endzone right">
          <TeamLogo team={home} size={44} />
          <span>
            {home.city}
            <br />
            {home.name}
          </span>
        </div>
      </div>

      <section className="gameday-board">
        <div className="gameday-scoreline">
          <div className={live.possession === 'away' ? 'has-ball' : ''}>
            <TeamLogo team={away} size={28} />
            <span>{away.abbrev}</span>
            <strong>{live.awayScore}</strong>
          </div>
          <div className="gameday-clock">
            <span>
              Q{live.quarter} · {formatClock(live.clock)}
            </span>
            <small>
              {downDist} · Ball on {spot}
            </small>
          </div>
          <div className={live.possession === 'home' ? 'has-ball' : ''}>
            <strong>{live.homeScore}</strong>
            <span>{home.abbrev}</span>
            <TeamLogo team={home} size={28} />
          </div>
        </div>
        <p className="gameday-possession">
          Possession: {possTeam.city} {possTeam.name}
        </p>
        <p className="gameday-play" key={pulse}>
          {live.lastPlay?.text ?? live.log[0] ?? 'Ready for kickoff.'}
        </p>
        <div className="gameday-controls">
          <button type="button" className="btn btn-primary" onClick={nextPlay}>
            Next play
          </button>
          <button
            type="button"
            className={`btn ${watching ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setWatching((w) => !w)}
          >
            {watching ? 'Pause watch' : 'Watch plays'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={simQuarter}>
            Sim quarter
          </button>
          <button type="button" className="btn btn-ghost" onClick={simGame}>
            Sim game
          </button>
        </div>
      </section>
    </div>
  );
}
