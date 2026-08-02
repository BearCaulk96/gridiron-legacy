import { useCallback, useEffect, useState } from 'react';
import type { Difficulty, LeagueState, TradeOffer } from '../game/types';
import { clearSave, hasSave as checkSave, loadGame, saveGame } from '../game/save';
import {
  advanceWeek,
  aiSignFreeAgents,
  beginSeason,
  completeLiveGameWeek,
  completeOffseasonToNextSeason,
  enterDraft,
  releasePlayer,
  signFreeAgent,
  startNewGame,
} from '../game/season';
import { autoPickUntilUser, draftPlayer, runFullAiDraft, scoutPlayer } from '../game/draft';
import { canUserAffordIncoming, evaluateTrade, executeTrade } from '../game/trade';
import type { LiveGameState } from '../game/playByPlay';

export type Screen =
  | 'landing'
  | 'setup'
  | 'hub'
  | 'gameday'
  | 'roster'
  | 'coaches'
  | 'draft'
  | 'trade'
  | 'freeAgency'
  | 'standings'
  | 'cap';

function cloneUpdate(prev: LeagueState, updater: (s: LeagueState) => void): LeagueState {
  const copy = structuredClone(prev);
  updater(copy);
  saveGame(copy);
  return copy;
}

export function useLeague() {
  const [state, setState] = useState<LeagueState | null>(null);
  const [screen, setScreen] = useState<Screen>('landing');
  const [toast, setToast] = useState<string | null>(null);

  // Always open on the title screen; Load Dynasty continues a save.
  useEffect(() => {
    const saved = loadGame();
    if (saved) setState(saved);
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const newGame = useCallback((teamId: string, difficulty: Difficulty) => {
    const league = startNewGame(teamId, difficulty);
    saveGame(league);
    setState(league);
    setScreen('hub');
  }, []);

  const continueGame = useCallback(() => {
    const saved = loadGame();
    if (saved) {
      setState(saved);
      setScreen('hub');
    }
  }, []);

  const abandon = useCallback(() => {
    clearSave();
    setState(null);
    setScreen('landing');
  }, []);

  const goTitle = useCallback(() => {
    setScreen('landing');
  }, []);

  const actions = {
    beginSeason: () => setState((prev) => (prev ? cloneUpdate(prev, beginSeason) : prev)),
    advanceWeek: () => setState((prev) => (prev ? cloneUpdate(prev, advanceWeek) : prev)),
    completeLiveGame: (live: LiveGameState) => {
      setState((prev) => (prev ? cloneUpdate(prev, (s) => completeLiveGameWeek(s, live)) : prev));
      setScreen('hub');
    },
    enterDraft: () => {
      setState((prev) => (prev ? cloneUpdate(prev, enterDraft) : prev));
      setScreen('draft');
    },
    draftPlayer: (playerId: string) => {
      setState((prev) => {
        if (!prev) return prev;
        let drafted = false;
        const next = cloneUpdate(prev, (s) => {
          drafted = draftPlayer(s, playerId, s.userTeamId);
          if (drafted) autoPickUntilUser(s);
        });
        if (!drafted) {
          flash('Cannot draft that player now.');
          return prev;
        }
        if (next.phase === 'freeAgency') {
          queueMicrotask(() => setScreen('freeAgency'));
        }
        return next;
      });
    },
    simDraft: () => {
      setState((prev) => (prev ? cloneUpdate(prev, runFullAiDraft) : prev));
      setScreen('freeAgency');
    },
    scout: (playerId: string) => {
      setState((prev) => {
        if (!prev) return prev;
        if (prev.scoutingPoints <= 0 || !prev.players[playerId] || prev.players[playerId]?.scouted) {
          flash('No scouting points left.');
          return prev;
        }
        return cloneUpdate(prev, (s) => {
          scoutPlayer(s, playerId);
        });
      });
    },
    signFA: (playerId: string) => {
      setState((prev) => {
        if (!prev) return prev;
        let err: string | null = null;
        const next = cloneUpdate(prev, (s) => {
          err = signFreeAgent(s, playerId);
        });
        if (err) flash(err);
        return next;
      });
    },
    release: (playerId: string) => {
      setState((prev) => {
        if (!prev) return prev;
        let err: string | null = null;
        const next = cloneUpdate(prev, (s) => {
          err = releasePlayer(s, playerId);
        });
        if (err) flash(err);
        return next;
      });
    },
    proposeTrade: (offer: TradeOffer) => {
      setState((prev) => {
        if (!prev) return prev;
        const preview = evaluateTrade(prev, offer);
        if (!preview.accept) {
          flash(preview.reason);
          return prev;
        }
        if (!canUserAffordIncoming(prev, offer)) {
          flash('Incoming salaries would break your cap.');
          return prev;
        }
        flash('Trade completed.');
        return cloneUpdate(prev, (s) => {
          executeTrade(s, offer);
        });
      });
    },
    finishFreeAgency: () => {
      setState((prev) =>
        prev
          ? cloneUpdate(prev, (s) => {
              aiSignFreeAgents(s);
              completeOffseasonToNextSeason(s);
            })
          : prev,
      );
      setScreen('hub');
    },
  };

  return {
    state,
    screen,
    setScreen,
    toast,
    newGame,
    continueGame,
    abandon,
    goTitle,
    actions,
    hasSave: checkSave(),
  };
}
