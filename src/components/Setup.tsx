import { useMemo, useState } from 'react';
import { DIFFICULTIES } from '../game/difficulty';
import { TEAM_TEMPLATES } from '../game/teams';
import type { Conference, Difficulty, DifficultyConfig } from '../game/types';
import { TeamLogo } from './TeamLogo';

interface Props {
  initialTeamId?: string;
  onBack: () => void;
  onStart: (teamId: string, difficulty: Difficulty) => void;
}

const CONFERENCES: Conference[] = ['American', 'National'];
const DIVISIONS = ['North', 'East', 'South', 'West'] as const;

type Step = 'team' | 'difficulty';

function difficultyBullets(d: DifficultyConfig): string[] {
  const bullets: string[] = [];
  bullets.push(d.uncapped ? 'Salary cap: uncapped' : 'Salary cap: $300M hard cap');
  if (d.draftFog <= 0.05) bullets.push('Draft board: fully visible');
  else if (d.draftFog < 0.4) bullets.push('Draft board: light fog until you scout');
  else if (d.draftFog < 0.7) bullets.push('Draft board: heavy fog — scouting matters');
  else bullets.push('Draft board: deep uncertainty on every pick');
  if (d.tradeGenerosity >= 1.1) bullets.push('Trades: generous AI partners');
  else if (d.tradeGenerosity >= 1) bullets.push('Trades: fair market value');
  else if (d.tradeGenerosity >= 0.95) bullets.push('Trades: need-based, selective AI');
  else bullets.push('Trades: ruthless market');
  if (d.simUserBoost > 0) bullets.push('Simulation: slight boost for your club');
  else if (d.simUserBoost < 0) bullets.push('Simulation: no mercy — every edge counts');
  else bullets.push('Simulation: even playing field');
  if (d.schemeMatter >= 0.7) bullets.push('Coaching scheme fit swings close games');
  return bullets.slice(0, 4);
}

export function Setup({ initialTeamId, onBack, onStart }: Props) {
  const starter =
    TEAM_TEMPLATES.find((t) => t.id === initialTeamId) ?? TEAM_TEMPLATES.find((t) => t.id === 'kc')!;
  const [step, setStep] = useState<Step>('team');
  const [difficulty, setDifficulty] = useState<Difficulty>('rookie');
  const [teamId, setTeamId] = useState(starter.id);
  const [conference, setConference] = useState<Conference>(starter.conference);
  const cfg = DIFFICULTIES[difficulty];
  const team = TEAM_TEMPLATES.find((t) => t.id === teamId)!;
  const bullets = difficultyBullets(cfg);

  const teams = useMemo(
    () =>
      TEAM_TEMPLATES.filter((t) => t.conference === conference).sort((a, b) => {
        const di = DIVISIONS.indexOf(a.division as (typeof DIVISIONS)[number]);
        const dj = DIVISIONS.indexOf(b.division as (typeof DIVISIONS)[number]);
        return di - dj || a.city.localeCompare(b.city);
      }),
    [conference],
  );

  if (step === 'difficulty') {
    return (
      <div className="setup-root setup-step-diff">
        <header className="setup-top">
          <div className="setup-top-copy">
            <div className="tag">Step 2 of 2</div>
            <h1 className="brand-mark setup-title">SELECT DIFFICULTY</h1>
          </div>
          <div className="setup-top-actions">
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setStep('team')}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => onStart(teamId, difficulty)}
            >
              Take the Job
            </button>
          </div>
        </header>

        <div className="setup-picked">
          <TeamLogo team={team} size={28} />
          <div className="setup-selected-copy">
            <strong>
              {team.city} {team.name}
            </strong>
            <span>
              {team.conference} · {team.division}
            </span>
          </div>
        </div>

        <section className="setup-diff-page" aria-label="Difficulty">
          <div className="setup-diff-grid setup-diff-grid-stack" role="radiogroup" aria-label="Difficulty">
            {(Object.keys(DIFFICULTIES) as Difficulty[]).map((id) => {
              const d = DIFFICULTIES[id];
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={difficulty === id}
                  className={`setup-diff-card setup-diff-card-lg ${difficulty === id ? 'selected' : ''}`}
                  onClick={() => setDifficulty(id)}
                >
                  <strong>{d.label}</strong>
                  <small>{d.tagline}</small>
                </button>
              );
            })}
          </div>

          <aside className="setup-diff-summary" aria-live="polite">
            <div className="tag">How it plays</div>
            <h2>{cfg.label}</h2>
            <p className="setup-diff-tagline">{cfg.tagline}</p>
            <p className="setup-diff-desc">{cfg.description}</p>
            <ul className="setup-diff-bullets">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
    );
  }

  return (
    <div className="setup-root">
      <header className="setup-top">
        <div className="setup-top-copy">
          <div className="tag">Step 1 of 2</div>
          <h1 className="brand-mark setup-title">SELECT YOUR TEAM</h1>
        </div>
        <div className="setup-top-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={onBack}>
            Back
          </button>
          <button type="button" className="btn btn-primary btn-small" onClick={() => setStep('difficulty')}>
            Continue
          </button>
        </div>
      </header>

      <section className="setup-franchise">
        <div className="setup-selected">
          <TeamLogo team={team} size={28} />
          <div className="setup-selected-copy">
            <strong>
              {team.city} {team.name}
            </strong>
            <span>
              {team.conference} · {team.division}
            </span>
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
                    <TeamLogo team={t} size={22} />
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
