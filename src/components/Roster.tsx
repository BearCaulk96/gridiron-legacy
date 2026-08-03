import type { LeagueState } from '../game/types';
import { formatMoney, playerCapHit, rosterPlayers } from '../game/salary';
import { playerName } from '../game/generate';

interface Props {
  state: LeagueState;
  onRelease: (id: string) => void;
}

export function Roster({ state, onRelease }: Props) {
  const players = rosterPlayers(state, state.userTeamId);

  return (
    <section className="panel panel-pad anim-fade-up">
      <div className="tag">Roster</div>
      <h2 style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', fontSize: '2.4rem', margin: '0.2rem 0 1rem' }}>
        DEPTH CHART
      </h2>
      <div className="list-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Player</th>
              <th>Pos</th>
              <th>Age</th>
              <th>OVR</th>
              <th>POT</th>
              <th>Morale</th>
              <th>Cap Hit</th>
              <th>Yrs</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td>
                  {playerName(p)}
                  {p.injuryWeeks > 0 && (
                    <span className="muted"> · OUT {p.injuryWeeks}w</span>
                  )}
                </td>
                <td>{p.position}</td>
                <td>{p.age}</td>
                <td>{p.overall}</td>
                <td>{p.potential}</td>
                <td>{p.morale}</td>
                <td>{formatMoney(playerCapHit(p))}</td>
                <td>{p.contract?.yearsRemaining ?? '-'}</td>
                <td>
                  <button className="btn btn-danger btn-small" onClick={() => onRelease(p.id)}>
                    Cut
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
