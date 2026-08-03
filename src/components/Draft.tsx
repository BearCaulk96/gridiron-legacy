import { useEffect, useMemo, useState } from 'react';
import type { LeagueState, Player, Position } from '../game/types';
import {
  currentDraftPick,
  prospectGrade,
  prospects,
  visibleOverall,
  visiblePotential,
  visibleTraitGrades,
} from '../game/draft';
import { getDifficulty } from '../game/difficulty';
import { playerName } from '../game/generate';
import { userTeam } from '../game/season';
import { TeamLogo } from './TeamLogo';

interface Props {
  state: LeagueState;
  onDraft: (id: string) => void;
  onScout: (id: string) => void;
  onSimRest: () => void;
  onSimToUser: () => void;
  onFinish: () => void;
  onBack: () => void;
  onEnsureBoard: () => void;
}

const POS: Array<Position | 'ALL'> = ['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S'];

function gradeTone(grade: string): string {
  if (grade.startsWith('A')) return 'hot';
  if (grade.startsWith('B')) return 'good';
  return 'ok';
}

export function Draft({
  state,
  onDraft,
  onScout,
  onSimRest,
  onSimToUser,
  onFinish,
  onBack,
  onEnsureBoard,
}: Props) {
  const [pos, setPos] = useState<Position | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cfg = getDifficulty(state.difficulty);
  const team = userTeam(state);
  const pick = currentDraftPick(state);
  const scoutingOnly = state.phase === 'scouting';
  const draftComplete = !scoutingOnly && !pick;
  const yourTurn = pick?.teamId === state.userTeamId;
  const onClock = pick ? state.teams.find((t) => t.id === pick.teamId) : null;

  useEffect(() => {
    onEnsureBoard();
  }, [onEnsureBoard, state.phase, state.calendarIndex]);

  const board = useMemo(() => {
    let list = prospects(state);
    if (pos !== 'ALL') list = list.filter((p) => p.position === pos);
    return list.slice(0, 100);
  }, [state, pos]);

  useEffect(() => {
    if (!board.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !board.some((p) => p.id === selectedId)) {
      setSelectedId(board[0]!.id);
    }
  }, [board, selectedId]);

  const selected: Player | null = selectedId ? (state.players[selectedId] ?? null) : null;
  const selectedOvr = selected ? visibleOverall(state, selected) : null;
  const selectedPot = selected ? visiblePotential(state, selected) : null;
  const selectedGrade = selected ? prospectGrade(state, selected) : null;
  const selectedTraits = selected ? visibleTraitGrades(state, selected) : [];

  if (state.phase !== 'draft' && state.phase !== 'scouting') {
    return (
      <div className="draft-root">
        <header className="draft-top">
          <button type="button" className="draft-back" onClick={onBack}>
            ← Office
          </button>
          <div className="draft-top-center">
            <h1>DRAFT</h1>
            <p>Opens in May</p>
          </div>
          <TeamLogo team={team} size={36} />
        </header>
        <div className="draft-closed">
          <p>Scouting reports arrive in May. The draft is May Week 3.</p>
          <button type="button" className="btn btn-primary" onClick={onBack}>
            Back to Office
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="draft-root">
      <header className="draft-top">
        <button type="button" className="draft-back" onClick={onBack}>
          ← Office
        </button>
        <div className="draft-top-center">
          <p className="draft-mode">{scoutingOnly ? 'Scouting' : 'Draft'} · {cfg.label}</p>
          <h1>
            {scoutingOnly
              ? 'SCOUTING'
              : pick
                ? `PICK ${pick.overall}`
                : 'COMPLETE'}
          </h1>
          <p>
            {scoutingOnly
              ? `${state.scoutingPoints} scout pts`
              : pick
                ? `Round ${pick.round} · ${state.scoutingPoints} scout pts`
                : 'Board is clear'}
          </p>
        </div>
        <TeamLogo team={team} size={36} />
      </header>

      {!scoutingOnly && pick && onClock && (
        <div className={`draft-clock ${yourTurn ? 'yours' : ''}`}>
          <TeamLogo team={onClock} size={28} />
          <div>
            <strong>{yourTurn ? 'You are on the clock' : `${onClock.abbrev} on the clock`}</strong>
            <span>
              Overall pick {pick.overall} · Round {pick.round}
            </span>
          </div>
          {!yourTurn && (
            <button type="button" className="btn btn-ghost btn-small" onClick={onSimToUser}>
              Sim to me
            </button>
          )}
        </div>
      )}

      {scoutingOnly && (
        <div className="draft-clock scout">
          <div>
            <strong>Evaluate the class</strong>
            <span>{state.scoutingPoints} scouting points left</span>
          </div>
        </div>
      )}

      {draftComplete ? (
        <div className="draft-closed">
          <p>Every pick is in. Advance to the draft recap.</p>
          <button type="button" className="btn btn-primary" onClick={onFinish}>
            Advance Week
          </button>
        </div>
      ) : (
        <>
          <div className="draft-pos" role="tablist" aria-label="Filter by position">
            {POS.map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={pos === p}
                className={pos === p ? 'active' : ''}
                onClick={() => setPos(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="draft-list-wrap" aria-label="Prospects">
            {board.length === 0 ? (
              <div className="draft-closed">
                <p>No prospects at this position.</p>
              </div>
            ) : (
              <ul className="draft-cards">
                {board.map((p, idx) => {
                  const ovr = visibleOverall(state, p);
                  const pot = visiblePotential(state, p);
                  const grade = prospectGrade(state, p);
                  const active = p.id === selectedId;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={`draft-card ${active ? 'selected' : ''}`}
                        onClick={() => setSelectedId(p.id)}
                        aria-pressed={active}
                      >
                        <span className="draft-card-rank">{idx + 1}</span>
                        <span className="draft-card-body">
                          <strong>{playerName(p)}</strong>
                          <small>
                            {p.position}
                            {p.scouted ? ' · Scouted' : ''}
                          </small>
                        </span>
                        <span className={`draft-card-grade tone-${gradeTone(grade)}`}>{grade}</span>
                        <span className="draft-card-metrics">
                          <span>
                            <em>OVR</em>
                            <b>{ovr ?? '??'}</b>
                          </span>
                          <span>
                            <em>POT</em>
                            <b>{pot ?? '??'}</b>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="draft-dock">
            {selected ? (
              <>
                <div className="draft-dock-info">
                  <div>
                    <strong>{playerName(selected)}</strong>
                    <span>
                      {selected.position} · Board {selectedGrade} · OVR {selectedOvr ?? '??'} · POT{' '}
                      {selectedPot ?? '??'}
                    </span>
                  </div>
                  <div className="draft-trait-grades" aria-label="Position traits">
                    {selectedTraits.map((t) => (
                      <span key={t.key} className={`draft-trait tone-${gradeTone(String(t.grade))}`}>
                        <em>{t.key}</em>
                        <b>{t.grade}</b>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="draft-dock-actions">
                  {!selected.scouted && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => onScout(selected.id)}
                      disabled={state.scoutingPoints <= 0}
                    >
                      Scout Traits
                    </button>
                  )}
                  {scoutingOnly ? (
                    selected.scouted && <span className="draft-dock-note">Traits revealed</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!yourTurn}
                      onClick={() => onDraft(selected.id)}
                    >
                      {yourTurn ? 'Draft Player' : 'Wait your turn'}
                    </button>
                  )}
                  {!scoutingOnly && yourTurn && (
                    <button type="button" className="btn btn-ghost" onClick={onSimRest}>
                      Autopick rest
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="draft-dock-note">Tap a prospect to scout traits or draft.</p>
            )}
          </footer>
        </>
      )}
    </div>
  );
}
