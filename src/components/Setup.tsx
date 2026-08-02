import { useMemo, useState } from 'react';
import { DIFFICULTIES } from '../game/difficulty';
import { TEAM_TEMPLATES } from '../game/teams';
import type { Conference, Difficulty } from '../game/types';
import { TeamLogo } from './TeamLogo';

interface Props {
  initialTeamId?: string;
  onBack: () => void;
  onStart: (teamId: string, difficulty: Difficulty) => void;
}

const CONFERENCES: Conference[] = ['American', 'National'];
const DIVISIONS = ['North', 'East', 'South', 'West'] as const;

export function Setup({ initialTeamId, onBack, onStart }: Props) {
  const starter =
    TEAM_TEMPLATES.find((t) => t.id === initialTeamId) ?? TEAM_TEMPLATES.find((t) => t.id === 'kc')!;
  const [difficulty, setDifficulty] = useState<Difficulty>('rookie');
  const [teamId, setTeamId] = useState(starter.id);
  const [conference, setConference] = useState<Conference>(starter.conference);
  const cfg = DIFFICULTIES[difficulty];
  const team = TEAM_TEMPLATES.find((t) => t.id === teamId)!;

  const teams = useMemo(
    () =>
      TEAM_TEMPLATES.filter((t) => t.conference === conference).sort((a, b) => {
        const di = DIVISIONS.indexOf(a.division as (typeof DIVISIONS)[number]);
        const dj = DIVISIONS.indexOf(b.division as (typeof DIVISIONS)[number]);
        return di - dj || a.city.localeCompare(b.city);
      }),
    [conference],
  );

  return (
    <div className="setup-root">
      <header className="setup-top">
        <div className="setup-top-copy">
          <div className="tag">New Franchise</div>
          <h1 className="brand-mark setup-title">CHOOSE YOUR PATH</h1>
        </div>
        <div className="setup-top-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={onBack}>
            Back
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onStart(teamId, difficulty)}>
            Take the Job
          </button>
        </div>
      </header>

      <section className="setup-diff" aria-label="Difficulty">
        <div className="setup-diff-grid">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((id) => {
            const d = DIFFICULTIES[id];
            return (
              <button
                key={id}
                type="button"
                className={`setup-diff-card ${difficulty === id ? 'selected' : ''}`}
                onClick={() => setDifficulty(id)}
              >
                <strong>{d.label}</strong>
                <span>{d.tagline}</span>
              </button>
            );
          })}
        </div>
        <p className="setup-diff-desc">{cfg.description}</p>
      </section>

      <section className="setup-franchise">
        <div className="setup-selected">
          <TeamLogo team={team} size={34} />
          <div>
            <div className="tag">Selected Team</div>
            <h2>
              {team.city} {team.name}
            </h2>
            <p>
              {team.conference} · {team.division}
            </p>
          </div>
        </div>
        <div className="setup-conf" role="tablist" aria-label="Conference">
          {CONFERENCES.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={conference === c}
              className={`btn btn-small ${conference === c ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setConference(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <div className="setup-teams" aria-label="Choose team">
        {DIVISIONS.map((division) => {
          const divTeams = teams.filter((t) => t.division === division);
          return (
            <div key={division} className="setup-div">
              <div className="tag">
                {conference} · {division}
              </div>
              <div className="setup-team-grid">
                {divTeams.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`setup-team ${teamId === t.id ? 'selected' : ''}`}
                    onClick={() => setTeamId(t.id)}
                  >
                    <TeamLogo team={t} size={26} />
                    <span>
                      <strong>{t.abbrev}</strong>
                      <small>
                        {t.city} {t.name}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
