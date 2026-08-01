import type { LeagueState } from '../game/types';
import { standings } from '../game/season';
import { teamPower } from '../game/ratings';

interface Props {
  state: LeagueState;
}

export function Standings({ state }: Props) {
  const rows = standings(state);

  return (
    <section className="panel panel-pad anim-fade-up">
      <div className="tag">League</div>
      <h2 style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', fontSize: '2.4rem', margin: '0.2rem 0 1rem' }}>
        STANDINGS
      </h2>
      <div className="list-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Conf</th>
              <th>W</th>
              <th>L</th>
              <th>T</th>
              <th>PF</th>
              <th>PA</th>
              <th>Power</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={t.id} style={t.id === state.userTeamId ? { background: 'rgba(240,162,2,0.08)' } : undefined}>
                <td>{i + 1}</td>
                <td>
                  <span className="team-swatch" style={{ background: t.primary }} />
                  {t.city} {t.name}
                </td>
                <td>
                  {t.conference} {t.division}
                </td>
                <td>{t.wins}</td>
                <td>{t.losses}</td>
                <td>{t.ties}</td>
                <td>{t.pointsFor}</td>
                <td>{t.pointsAgainst}</td>
                <td>{Math.round(teamPower(state, t.id))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
