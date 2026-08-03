import type { LeagueState } from '../game/types';
import { formatMoney } from '../game/salary';
import { hireCoachHint, userTeam } from '../game/season';
import { DIFFICULTIES } from '../game/difficulty';

interface Props {
  state: LeagueState;
}

export function Coaches({ state }: Props) {
  const team = userTeam(state);
  const coaches = team.coachIds.map((id) => state.coaches[id]!);
  const cfg = DIFFICULTIES[state.difficulty];

  return (
    <section className="panel panel-pad anim-fade-up">
      <div className="tag">Coaching Staff</div>
      <h2 style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', fontSize: '2.4rem', margin: '0.2rem 0' }}>
        SIDELINE
      </h2>
      <p className="muted">{hireCoachHint(state)}</p>
      <p className="muted" style={{ fontSize: '0.88rem' }}>
        Scheme impact on this difficulty: {Math.round(cfg.schemeMatter * 100)}%
      </p>
      <div className="grid-3" style={{ marginTop: '1rem' }}>
        {coaches.map((c) => (
          <article key={c.id} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '1rem' }}>
            <div className="tag">{c.role}</div>
            <h3 style={{ margin: '0.35rem 0', fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.03em' }}>
              {c.name}
            </h3>
            <p className="muted" style={{ margin: 0 }}>
              Scheme: {c.scheme}
            </p>
            <p style={{ margin: '0.75rem 0 0' }}>
              OFF {c.offense} · DEF {c.defense} · DEV {c.development}
            </p>
            <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>
              {c.contractYears} yr · {formatMoney(c.salary)}/yr
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
