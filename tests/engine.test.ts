import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createLeague } from '../src/game/generate.ts';
import {
  advanceWeek,
  beginSeason,
  completeLiveGameWeek,
  enterDraft,
  startNewGame,
  userGameThisWeek,
} from '../src/game/season.ts';
import { createLiveGame, stepUntilFinal } from '../src/game/playByPlay.ts';
import { currentDraftPick, draftPlayer, prospects } from '../src/game/draft.ts';
import { evaluateTrade } from '../src/game/trade.ts';
import { TEAM_TEMPLATES } from '../src/game/teams.ts';
import { teamCapHit } from '../src/game/salary.ts';

describe('Gridiron Dynasty engine', () => {
  it('creates 32 teams with rosters and a schedule', () => {
    const league = createLeague('kc', 'rookie', 42);
    assert.equal(league.teams.length, 32);
    assert.equal(TEAM_TEMPLATES.length, 32);
    assert.ok(Object.keys(league.players).length > 500);
    assert.equal(league.schedule.length, 17 * 16);
    assert.ok(teamCapHit(league, 'kc') > 0);
  });

  it('simulates a full regular season without crashing', () => {
    const league = startNewGame('phi', 'pro');
    beginSeason(league);
    for (let i = 0; i < 17; i++) {
      advanceWeek(league);
    }
    assert.equal(league.phase, 'offseason');
    assert.ok(league.teams.every((t) => t.wins + t.losses + t.ties === 17));
  });

  it('runs a user draft pick on casual with visible board', () => {
    const league = startNewGame('dal', 'casual');
    league.phase = 'offseason';
    // Force standings so draft order is defined
    league.teams.forEach((t, i) => {
      t.wins = i;
      t.losses = 16 - i;
    });
    enterDraft(league);
    assert.equal(league.phase, 'draft');
    const pick = currentDraftPick(league);
    assert.ok(pick);
    if (pick!.teamId !== league.userTeamId) {
      // autoPickUntilUser should have stopped on user
      assert.equal(pick!.teamId, league.userTeamId);
    }
    const board = prospects(league);
    assert.ok(board.length > 50);
    const ok = draftPlayer(league, board[0]!.id, league.userTeamId);
    assert.equal(ok, true);
  });

  it('rejects lopsided veteran trades', () => {
    const league = createLeague('bos', 'veteran', 7);
    const star = Object.values(league.players)
      .filter((p) => p.teamId === 'kc')
      .sort((a, b) => b.overall - a.overall)[0]!;
    const scrub = Object.values(league.players)
      .filter((p) => p.teamId === 'bos')
      .sort((a, b) => a.overall - b.overall)[0]!;
    const result = evaluateTrade(league, {
      fromTeamId: 'bos',
      toTeamId: 'kc',
      offer: [{ type: 'player', playerId: scrub.id }],
      request: [{ type: 'player', playerId: star.id }],
    });
    assert.equal(result.accept, false);
  });

  it('uses American and National conferences with 32 custom franchises', () => {
    const league = createLeague('pit', 'casual', 1);
    assert.equal(league.teams.filter((t) => t.conference === 'American').length, 16);
    assert.equal(league.teams.filter((t) => t.conference === 'National').length, 16);
    assert.ok(league.teams.some((t) => t.name === 'Stampede'));
    assert.ok(league.teams.some((t) => t.city === 'Richmond'));
    assert.ok(league.teams.every((t) => !!t.accent));
  });

  it('plays a live user game then completes the week', () => {
    const league = startNewGame('pit', 'rookie');
    beginSeason(league);
    const matchup = userGameThisWeek(league);
    assert.ok(matchup);
    const live = createLiveGame(league, matchup!);
    stepUntilFinal(league, live);
    assert.equal(live.phase, 'final');
    assert.ok(live.homeScore + live.awayScore >= 0);
    completeLiveGameWeek(league, live);
    assert.equal(league.week, 2);
    assert.ok(matchup!.played);
    assert.equal(
      league.schedule.filter((g) => g.week === 1 && g.played).length,
      16,
    );
  });
});
