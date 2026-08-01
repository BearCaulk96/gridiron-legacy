import type { LeagueState } from '../game/types';
import { freeAgents, formatMoney, suggestedContract } from '../game/salary';
import { playerName } from '../game/generate';

interface Props {
  state: LeagueState;
  onSign: (id: string) => void;
  onFinish: () => void;
}

export function FreeAgency({ state, onSign, onFinish }: Props) {
  const agents = freeAgents(state).slice(0, 60);

  return (
    <section className="panel panel-pad anim-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div className="tag">Free Agency</div>
          <h2 style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', fontSize: '2.4rem', margin: '0.2rem 0' }}>
            OPEN MARKET
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            No boosts for sale — only scouting, cap room, and judgment.
          </p>
        </div>
        {(state.phase === 'freeAgency' || state.phase === 'preseason' || state.phase === 'offseason') && (
          <button className="btn btn-primary" onClick={onFinish} disabled={state.phase !== 'freeAgency'}>
            {state.phase === 'freeAgency' ? 'Close FA & Start Camp' : 'Available after draft'}
          </button>
        )}
      </div>

      <div className="list-scroll" style={{ marginTop: '1rem' }}>
        <table className="data">
          <thead>
            <tr>
              <th>Player</th>
              <th>Pos</th>
              <th>Age</th>
              <th>OVR</th>
              <th>Ask / yr</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {agents.map((p) => {
              const ask = suggestedContract(p.overall, p.age, 2).annualSalary;
              return (
                <tr key={p.id}>
                  <td>{playerName(p)}</td>
                  <td>{p.position}</td>
                  <td>{p.age}</td>
                  <td>{p.overall}</td>
                  <td>{formatMoney(ask)}</td>
                  <td>
                    <button className="btn btn-primary btn-small" onClick={() => onSign(p.id)}>
                      Sign
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
