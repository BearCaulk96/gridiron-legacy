import type { LeagueState } from '../game/types';
import { teamPower } from '../game/ratings';
import { describeGame } from '../game/simulation';
import { hireCoachHint, userTeam } from '../game/season';
import { formatMoney, teamCapSpace } from '../game/salary';
import { DIFFICULTIES } from '../game/difficulty';

interface Props {
  state: LeagueState;
  onBeginSeason: () => void;
  onAdvanceWeek: () => void;
  onEnterDraft: () => void;
  onOpen: (screen: 'draft' | 'trade' | 'roster' | 'freeAgency') => void;
}

export function Hub({ state, onBeginSeason, onAdvanceWeek, onEnterDraft, onOpen }: Props) {
  const team = userTeam(state);
  const power = Math.round(teamPower(state, team.id));
  const cfg = DIFFICULTIES[state.difficulty];
  const upcoming = state.schedule.find(
    (g) => !g.played && (g.homeId === team.id || g.awayId === team.id) && g.week === state.week,
  );
  const last = [...state.schedule]
    .reverse()
    .find((g) => g.played && (g.homeId === team.id || g.awayId === team.id));

  return (
    <div className="grid-2">
      <section className="panel panel-pad anim-fade-up">
        <div className="tag">Franchise Hub</div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3rem',
            margin: '0.2rem 0 0.5rem',
            letterSpacing: '0.04em',
          }}
        >
          {team.city.toUpperCase()} {team.name.toUpperCase()}
        </h2>
        <div className="stat-pile" style={{ margin: '1rem 0 1.25rem' }}>
          <div>
            <strong>
              {team.wins}-{team.losses}
              {team.ties ? `-${team.ties}` : ''}
            </strong>
            <span className="muted">Record</span>
          </div>
          <div>
            <strong>{power}</strong>
            <span className="muted">Team Power</span>
          </div>
          <div>
            <strong>{formatMoney(teamCapSpace(state, team.id))}</strong>
            <span className="muted">Cap Space</span>
          </div>
          <div>
            <strong>{state.scoutingPoints}</strong>
            <span className="muted">Scout Pts</span>
          </div>
        </div>

        <p className="muted" style={{ marginTop: 0 }}>
          {cfg.tagline} — {hireCoachHint(state)}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1.25rem' }}>
          {state.phase === 'preseason' && (
            <button className="btn btn-primary" onClick={onBeginSeason}>
              Start Regular Season
            </button>
          )}
          {state.phase === 'regular' && (
            <button className="btn btn-primary" onClick={onAdvanceWeek}>
              Simulate Week {state.week}
            </button>
          )}
          {state.phase === 'offseason' && (
            <button className="btn btn-primary" onClick={onEnterDraft}>
              Enter Draft
            </button>
          )}
          {state.phase === 'draft' && (
            <button className="btn btn-primary" onClick={() => onOpen('draft')}>
              Go to Draft Board
            </button>
          )}
          {state.phase === 'freeAgency' && (
            <button className="btn btn-primary" onClick={() => onOpen('freeAgency')}>
              Free Agency Desk
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => onOpen('roster')}>
            Manage Roster
          </button>
          <button className="btn btn-ghost" onClick={() => onOpen('trade')}>
            Call Trades
          </button>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          {upcoming && (
            <p>
              <span className="tag">Next</span> {describeGame(state, upcoming)}
            </p>
          )}
          {last && (
            <p className="muted">
              <span className="tag">Last</span> {describeGame(state, last)}
            </p>
          )}
        </div>
      </section>

      <aside className="panel panel-pad anim-fade-up anim-delay-1">
        <div className="tag">Ticker</div>
        <h3 style={{ marginTop: '0.35rem' }}>League Wire</h3>
        <ul className="msg-list">
          {state.messages.slice(0, 10).map((m, i) => (
            <li key={`${i}-${m.slice(0, 12)}`}>{m}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
