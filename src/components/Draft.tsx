import { useMemo, useState } from 'react';
import type { LeagueState, Position } from '../game/types';
import {
  currentDraftPick,
  prospectGrade,
  prospects,
  revealBoardHint,
  visibleOverall,
  visiblePotential,
} from '../game/draft';
import { getDifficulty } from '../game/difficulty';
import { playerName } from '../game/generate';
interface Props {
  state: LeagueState;
  onDraft: (id: string) => void;
  onScout: (id: string) => void;
  onSimRest: () => void;
  onFinish: () => void;
  onBack: () => void;
}

const POS: Array<Position | 'ALL'> = ['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S'];

export function Draft({ state, onDraft, onScout, onSimRest, onFinish, onBack }: Props) {
  const [pos, setPos] = useState<Position | 'ALL'>('ALL');
  const cfg = getDifficulty(state.difficulty);
  const pick = currentDraftPick(state);
  const board = useMemo(() => {
    let list = prospects(state);
    if (pos !== 'ALL') list = list.filter((p) => p.position === pos);
    return list.slice(0, 80);
  }, [state, pos]);

  const yourTurn = pick?.teamId === state.userTeamId;
  const draftComplete = !pick;
  const scoutingOnly = state.phase === 'scouting';

  if (state.phase !== 'draft' && state.phase !== 'scouting') {
    return (
      <section className="panel panel-pad">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem' }}>DRAFT BOARD</h2>
        <p className="muted">Scouting opens in May, with the draft on May Week 3.</p>
        <button type="button" className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={onBack}>
          Back to Office
        </button>
      </section>
    );
  }

  return (
    <section className="panel panel-pad anim-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div className="tag">{scoutingOnly ? 'Scouting' : 'Draft'} · {cfg.label}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', fontSize: '2.4rem', margin: '0.2rem 0' }}>
            {scoutingOnly
              ? 'SCOUTING BOARD'
              : pick
                ? `PICK ${pick.overall} · R${pick.round}`
                : 'DRAFT COMPLETE'}
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            {revealBoardHint(cfg)} · Scout points: {state.scoutingPoints}
          </p>
          {!scoutingOnly && pick && (
            <p style={{ margin: '0.5rem 0 0' }}>
              On the clock:{' '}
              <strong>
                {state.teams.find((t) => t.id === pick.teamId)?.abbrev}
                {yourTurn ? ' (YOU)' : ''}
              </strong>
            </p>
          )}
          {!scoutingOnly && draftComplete && (
            <p style={{ margin: '0.5rem 0 0' }}>
              The board is empty — every pick is in. Advance the week to continue.
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Office
          </button>
          {!scoutingOnly && !draftComplete && (
            <button type="button" className="btn btn-ghost" onClick={onSimRest}>
              Simulate Remaining
            </button>
          )}
          {!scoutingOnly && draftComplete && (
            <button type="button" className="btn btn-primary" onClick={onFinish}>
              Advance Week
            </button>
          )}
        </div>
      </div>

      {!draftComplete && (
        <>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '1rem 0' }}>
            {POS.map((p) => (
              <button
                key={p}
                type="button"
                className={`btn btn-small ${pos === p ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPos(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="list-scroll">
            {board.length === 0 ? (
              <p className="muted">No prospects available on the board.</p>
            ) : (
              <table className="data">
                <thead>
                  <tr>
                    <th>Prospect</th>
                    <th>Pos</th>
                    <th>Grade</th>
                    <th>OVR</th>
                    <th>POT</th>
                    <th>Scout</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {board.map((p) => {
                    const ovr = visibleOverall(state, p);
                    const pot = visiblePotential(state, p);
                    return (
                      <tr key={p.id}>
                        <td>
                          {playerName(p)}
                          {p.scouted && <span className="muted"> · scouted</span>}
                        </td>
                        <td>{p.position}</td>
                        <td>{prospectGrade(state, p)}</td>
                        <td>{ovr ?? '??'}</td>
                        <td>{pot ?? '??'}</td>
                        <td>
                          {!p.scouted && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-small"
                              onClick={() => onScout(p.id)}
                              disabled={state.scoutingPoints <= 0}
                            >
                              Scout
                            </button>
                          )}
                        </td>
                        <td>
                          {!scoutingOnly && (
                            <button
                              type="button"
                              className="btn btn-primary btn-small"
                              disabled={!yourTurn}
                              onClick={() => onDraft(p.id)}
                            >
                              Draft
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </section>
  );
}
