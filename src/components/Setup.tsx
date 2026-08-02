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
  const starter = TEAM_TEMPLATES.find((t) => t.id === initialTeamId) ?? TEAM_TEMPLATES.find((t) => t.id === 'kc')!;
  const [difficulty, setDifficulty] = useState<Difficulty>('rookie');
  const [teamId, setTeamId] = useState(starter.id);
  const [conference, setConference] = useState<Conference>(starter.conference);
  const cfg = DIFFICULTIES[difficulty];
  const team = TEAM_TEMPLATES.find((t) => t.id === teamId)!;

  const grouped = useMemo(() => {
    return DIVISIONS.map((division) => ({
      division,
      teams: TEAM_TEMPLATES.filter((t) => t.conference === conference && t.division === division),
    }));
  }, [conference]);

  return (
    <div className="app-shell">
      <div className="nav-bar">
        <div>
          <div className="tag">New Franchise</div>
          <h1 className="brand-mark" style={{ fontSize: '3rem', margin: 0 }}>
            CHOOSE YOUR PATH
          </h1>
        </div>
        <button className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
      </div>

      <div className="panel panel-pad anim-fade-up" style={{ marginBottom: '1rem' }}>
        <div className="tag">Difficulty</div>
        <div className="diff-grid" style={{ marginTop: '0.75rem' }}>
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((id) => {
            const d = DIFFICULTIES[id];
            return (
              <button
                key={id}
                className={`diff-card ${difficulty === id ? 'selected' : ''}`}
                onClick={() => setDifficulty(id)}
              >
                <div className="tag">{d.label}</div>
                <h3>{d.label}</h3>
                <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>
                  {d.tagline}
                </p>
              </button>
            );
          })}
        </div>
        <p style={{ marginTop: '1rem', color: 'var(--chalk-dim)', maxWidth: 720 }}>{cfg.description}</p>
      </div>

      <div className="panel panel-pad anim-fade-up anim-delay-1">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <TeamLogo team={team} size={56} />
            <div>
              <div className="tag">Franchise</div>
              <h2 style={{ margin: '0.15rem 0', fontFamily: 'var(--font-display)', fontSize: '2.2rem', letterSpacing: '0.04em' }}>
                {team.city} {team.name}
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                {team.conference} Conference · {team.division} Division
              </p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => onStart(teamId, difficulty)}>
            Take the Job
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.1rem', flexWrap: 'wrap' }}>
          {CONFERENCES.map((c) => (
            <button
              key={c}
              className={`btn btn-small ${conference === c ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setConference(c)}
            >
              {c} Conference
            </button>
          ))}
        </div>

        <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
          {grouped.map(({ division, teams }) => (
            <div key={division}>
              <div className="tag" style={{ marginBottom: '0.45rem' }}>
                {conference} · {division}
              </div>
              <div className="team-grid">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    className={`team-choice ${teamId === t.id ? 'selected' : ''}`}
                    onClick={() => setTeamId(t.id)}
                    style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}
                  >
                    <TeamLogo team={t} size={40} />
                    <div style={{ textAlign: 'left', minWidth: 0 }}>
                      <div className="abbrev" style={{ color: t.primary === '#F5F7FA' || t.primary === '#FFFFFF' ? t.secondary : t.secondary }}>
                        {t.abbrev}
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>{t.city}</div>
                      <div className="muted" style={{ fontSize: '0.8rem' }}>
                        {t.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
