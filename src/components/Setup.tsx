import { useState } from 'react';
import { DIFFICULTIES } from '../game/difficulty';
import { TEAM_TEMPLATES } from '../game/teams';
import type { Difficulty } from '../game/types';

interface Props {
  onBack: () => void;
  onStart: (teamId: string, difficulty: Difficulty) => void;
}

export function Setup({ onBack, onStart }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>('rookie');
  const [teamId, setTeamId] = useState('kc');
  const cfg = DIFFICULTIES[difficulty];
  const team = TEAM_TEMPLATES.find((t) => t.id === teamId)!;

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
        <ul className="muted" style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.9rem' }}>
          <li>Draft: {cfg.showProspectOverall ? 'full board' : cfg.draftFog > 0.6 ? 'heavy fog + scouting' : 'grades / limited scouting'}</li>
          <li>Trades: generosity {Math.round(cfg.tradeGenerosity * 100)}% · AI strictness {cfg.aiTradeStrictness.toFixed(2)}</li>
          <li>Cap: {cfg.capSoftPercent > 1 ? `soft to ${Math.round((cfg.capSoftPercent - 1) * 100)}% over` : 'hard ceiling'}</li>
          <li>Games: user sim modifier {cfg.simUserBoost >= 0 ? '+' : ''}{cfg.simUserBoost}</li>
        </ul>
      </div>

      <div className="panel panel-pad anim-fade-up anim-delay-1">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div className="tag">Franchise</div>
            <h2 style={{ margin: '0.25rem 0', fontFamily: 'var(--font-display)', fontSize: '2.4rem', letterSpacing: '0.04em' }}>
              <span className="team-swatch" style={{ background: team.primary, width: 18, height: 18 }} />
              {team.city} {team.name}
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              {team.conference} Conference · {team.division} Division · Original nicknames, real markets
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => onStart(teamId, difficulty)}>
            Take the Job
          </button>
        </div>
        <div className="team-grid" style={{ marginTop: '1rem' }}>
          {TEAM_TEMPLATES.map((t) => (
            <button
              key={t.id}
              className={`team-choice ${teamId === t.id ? 'selected' : ''}`}
              onClick={() => setTeamId(t.id)}
            >
              <div className="abbrev" style={{ color: t.secondary === '#000000' || t.secondary === '#101820' ? t.primary : t.secondary }}>
                <span className="team-swatch" style={{ background: t.primary }} />
                {t.abbrev}
              </div>
              <div style={{ fontSize: '0.85rem' }}>{t.city}</div>
              <div className="muted" style={{ fontSize: '0.8rem' }}>
                {t.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
