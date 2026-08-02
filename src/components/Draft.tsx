import { useEffect, useMemo, useState } from 'react';
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
  onEnsureBoard: () => void;
}

const POS: Array<Position | 'ALL'> = ['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S'];

export function Draft({
  state,
  onDraft,
  onScout,
  onSimRest,
  onFinish,
  onBack,
  onEnsureBoard,
}: Props) {
  const [pos, setPos] = useState<Position | 'ALL'>('ALL');
  const cfg = getDifficulty(state.difficulty);
  const pick = currentDraftPick(state);
  const scoutingOnly = state.phase === 'scouting';
  const draftComplete = !scoutingOnly && !pick;

  useEffect(() => {
    onEnsureBoard();
  }, [onEnsureBoard, state.phase, state.calendarIndex]);

  const board = useMemo(() => {
    let list = prospects(state);
    if (pos !== 'ALL') list = list.filter((p) => p.position === pos);
    return list.slice(0, 120);
  }, [state, pos]);

  const yourTurn = pick?.teamId === state.userTeamId;

  if (state.phase !== 'draft' && state.phase !== 'scouting') {
    return (
      <section className="panel panel-pad draft-panel">
        <div className="draft-toolbar">
          <div>
            <h2 className="draft-title">DRAFT BOARD</h2>
            <p className="muted">Scouting opens in May, with the draft on May Week 3.</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Back to Office
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel panel-pad draft-panel anim-fade-up">
      <div className="draft-toolbar">
        <div className="draft-toolbar-copy">
          <div className="tag">{scoutingOnly ? 'Scouting' : 'Draft'} · {cfg.label}</div>
          <h2 className="draft-title">
            {scoutingOnly
              ? 'SCOUTING BOARD'
              : pick
                ? `PICK ${pick.overall} · R${pick.round}`
                : 'DRAFT COMPLETE'}
          </h2>
          <p className="muted draft-sub">
            {revealBoardHint(cfg)} · Scout points: {state.scoutingPoints}
            {!scoutingOnly && pick
              ? ` · On the clock: ${state.teams.find((t) => t.id === pick.teamId)?.abbrev ?? ''}${yourTurn ? ' (YOU)' : ''}`
              : ''}
          </p>
        </div>
        <div className="draft-toolbar-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={onBack}>
            Office
          </button>
          {!scoutingOnly && !draftComplete && (
            <button type="button" className="btn btn-ghost btn-small" onClick={onSimRest}>
              Simulate Remaining
            </button>
          )}
          {!scoutingOnly && draftComplete && (
            <button type="button" className="btn btn-primary btn-small" onClick={onFinish}>
              Advance Week
            </button>
          )}
        </div>
      </div>

      {draftComplete ? (
        <div className="draft-empty">
          <p>The board is clear — every pick is in.</p>
          <button type="button" className="btn btn-primary" onClick={onFinish}>
            Advance Week
          </button>
        </div>
      ) : (
        <>
          <div className="draft-filters" role="tablist" aria-label="Position filter">
            {POS.map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={pos === p}
                className={`btn btn-small ${pos === p ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPos(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="draft-board list-scroll" aria-label="Prospect list">
            {board.length === 0 ? (
              <div className="draft-empty">
                <p>No prospects on the board yet. Generating class…</p>
              </div>
            ) : (
              <ul className="draft-list">
                {board.map((p) => {
                  const ovr = visibleOverall(state, p);
                  const pot = visiblePotential(state, p);
                  return (
                    <li key={p.id} className="draft-row">
                      <div className="draft-row-main">
                        <strong>{playerName(p)}</strong>
                        <span>
                          {p.position} · Grade {prospectGrade(state, p)}
                          {p.scouted ? ' · scouted' : ''}
                        </span>
                      </div>
                      <div className="draft-row-stats">
                        <span>
                          OVR <b>{ovr ?? '??'}</b>
                        </span>
                        <span>
                          POT <b>{pot ?? '??'}</b>
                        </span>
                      </div>
                      <div className="draft-row-actions">
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
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
