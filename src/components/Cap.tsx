import type { LeagueState } from '../game/types';
import { DIFFICULTIES } from '../game/difficulty';
import {
  formatMoney,
  maxAllowedCap,
  playerCapHit,
  rosterPlayers,
  teamCapHit,
  teamCapSpace,
} from '../game/salary';
import { playerName } from '../game/generate';
import { userTeam } from '../game/season';

interface Props {
  state: LeagueState;
}

export function Cap({ state }: Props) {
  const team = userTeam(state);
  const cfg = DIFFICULTIES[state.difficulty];
  const used = teamCapHit(state, team.id);
  const max = maxAllowedCap(state);
  const pct = Math.min(100, Math.round((used / max) * 100));
  const players = rosterPlayers(state, team.id);
  const coaches = team.coachIds.map((id) => state.coaches[id]!);

  return (
    <section className="panel panel-pad anim-fade-up">
      <div className="tag">Salary Cap · {cfg.label}</div>
      <h2 style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', fontSize: '2.4rem', margin: '0.2rem 0' }}>
        BOOKS
      </h2>
      <p className="muted">
        League cap {formatMoney(state.salaryCap)}
        {cfg.capSoftPercent > 1
          ? ` · soft ceiling ${formatMoney(max)} on ${cfg.label}`
          : ' · hard ceiling — no pay-to-win unlocks, ever'}
      </p>

      <div className="stat-pile" style={{ margin: '1rem 0' }}>
        <div>
          <strong>{formatMoney(used)}</strong>
          <span className="muted">Used</span>
        </div>
        <div>
          <strong>{formatMoney(teamCapSpace(state, team.id))}</strong>
          <span className="muted">Space</span>
        </div>
        <div>
          <strong>{pct}%</strong>
          <span className="muted">Of limit</span>
        </div>
      </div>

      <div className="cap-meter" style={{ marginBottom: '1.25rem' }}>
        <span style={{ width: `${pct}%`, background: pct > 95 ? 'var(--danger)' : pct > 80 ? 'var(--amber)' : 'var(--ok)' }} />
      </div>

      <h3>Top contracts</h3>
      <table className="data">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Hit</th>
          </tr>
        </thead>
        <tbody>
          {[
            ...players.map((p) => ({
              id: p.id,
              name: playerName(p),
              type: p.position,
              hit: playerCapHit(p),
            })),
            ...coaches.map((c) => ({
              id: c.id,
              name: c.name,
              type: c.role,
              hit: c.salary,
            })),
          ]
            .sort((a, b) => b.hit - a.hit)
            .slice(0, 15)
            .map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.type}</td>
                <td>{formatMoney(row.hit)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </section>
  );
}
