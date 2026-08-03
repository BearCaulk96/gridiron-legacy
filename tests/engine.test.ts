import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createLeague } from '../src/game/generate.ts';
import {
  advanceCalendar,
  advanceWeek,
  beginSeason,
  completeLiveGameWeek,
  enterDraft,
  startNewGame,
  userGameThisWeek,
} from '../src/game/season.ts';
import { CALENDAR_LENGTH, YEAR_CALENDAR, currentCalendar } from '../src/game/calendar.ts';
import { createLiveGame, stepUntilFinal } from '../src/game/playByPlay.ts';
import { currentDraftPick, draftPlayer, prospects, runFullAiDraft } from '../src/game/draft.ts';
import { evaluateTrade } from '../src/game/trade.ts';
import { TEAM_TEMPLATES } from '../src/game/teams.ts';
import { maxAllowedCap, rosterPlayers } from '../src/game/salary.ts';
import { DIFFICULTIES } from '../src/game/difficulty.ts';
import { teamCapHit } from '../src/game/salary.ts';

describe('Gridiron Dynasty engine', () => {
  it('creates 32 teams with rosters and a schedule', () => {
    const league = createLeague('kc', 'rookie', 42);
    assert.equal(league.teams.length, 32);
    assert.equal(TEAM_TEMPLATES.length, 32);
    assert.ok(Object.keys(league.players).length > 500);
    assert.equal(league.schedule.length, (3 + 18) * 16);
    assert.equal(league.calendarIndex, 0);
    assert.equal(league.phase, 'freeAgency');
    assert.ok(teamCapHit(league, 'kc') > 0);
  });

  it('defines a 48-week April–March calendar', () => {
    assert.equal(CALENDAR_LENGTH, 48);
    assert.equal(YEAR_CALENDAR.length, 48);
    assert.equal(YEAR_CALENDAR[0]!.month, 'April');
    assert.equal(YEAR_CALENDAR[0]!.title, 'Free Agency');
    assert.equal(YEAR_CALENDAR[47]!.month, 'March');
    assert.ok(YEAR_CALENDAR.some((s) => s.kind === 'regularSeason' && s.seasonWeek === 18));
    assert.ok(YEAR_CALENDAR.some((s) => s.kind === 'superBowl'));
  });

  it('simulates a full regular season without crashing', () => {
    const league = startNewGame('phi', 'pro');
    beginSeason(league);
    for (let i = 0; i < 18; i++) {
      advanceWeek(league);
    }
    assert.equal(currentCalendar(league).phase, 'playoffs');
    assert.ok(league.teams.every((t) => t.wins + t.losses + t.ties === 18));
  });

  it('runs a user draft pick on casual with visible board', () => {
    const league = startNewGame('dal', 'casual');
    league.teams.forEach((t, i) => {
      t.wins = i;
      t.losses = 16 - i;
    });
    enterDraft(league);
    assert.equal(league.phase, 'draft');
    const pick = currentDraftPick(league);
    assert.ok(pick);
    if (pick!.teamId !== league.userTeamId) {
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
    completeLiveGameWeek(league, live);
    assert.equal(currentCalendar(league).seasonWeek, 2);
    assert.ok(matchup!.played);
    assert.equal(
      league.schedule.filter((g) => !g.preseason && !g.playoff && g.week === 1 && g.played).length,
      16,
    );
  });

  it('advances calendar from April free agency into May scouting', () => {
    const league = startNewGame('kc', 'rookie');
    assert.equal(currentCalendar(league).kind, 'freeAgency');
    advanceCalendar(league);
    advanceCalendar(league);
    advanceCalendar(league);
    advanceCalendar(league);
    assert.equal(currentCalendar(league).month, 'May');
    assert.equal(currentCalendar(league).kind, 'scoutingReport');
    assert.equal(league.phase, 'scouting');
  });

  it('keeps a selectable board after simulating the prior year draft', () => {
    const league = startNewGame('kc', 'rookie');
    while (currentCalendar(league).kind !== 'draft') advanceCalendar(league);
    runFullAiDraft(league);
    assert.equal(currentDraftPick(league), null);
    advanceCalendar(league);
    assert.equal(currentCalendar(league).kind, 'draftRecap');

    let guard = 0;
    while (!(currentCalendar(league).kind === 'draft' && league.season > 2026) && guard++ < 80) {
      advanceCalendar(league);
    }
    assert.equal(currentCalendar(league).kind, 'draft');
    assert.ok(prospects(league).length > 50);
    const pick = currentDraftPick(league);
    assert.ok(pick, 'second-year draft should still have picks remaining');
  });

  it('advances past draft week after the board is simulated out', () => {
    const league = startNewGame('phi', 'casual');
    while (currentCalendar(league).kind !== 'draft') advanceCalendar(league);
    runFullAiDraft(league);
    assert.equal(currentDraftPick(league), null);
    advanceCalendar(league);
    assert.equal(currentCalendar(league).kind, 'draftRecap');
  });

  it('uses 53-man rosters, $300M pro cap, and trait-based prospects', () => {
    const pro = createLeague('kc', 'pro', 99);
    const casual = createLeague('kc', 'casual', 99);
    assert.equal(rosterPlayers(pro, 'kc').length, 53);
    assert.equal(pro.salaryCap, 300_000_000);
    assert.equal(DIFFICULTIES.pro.uncapped, false);
    assert.equal(DIFFICULTIES.casual.uncapped, true);
    assert.ok(maxAllowedCap(casual) > 1e12);
    assert.equal(maxAllowedCap(pro), 300_000_000);

    const board = prospects(pro);
    assert.ok(board.length >= 200);
    const withTraits = board.filter((p) => p.traits && Object.keys(p.traits).length >= 3);
    assert.ok(withTraits.length > 100);
    const gems = board.filter((p) => p.potential - p.overall >= 18);
    assert.ok(gems.length >= 8, 'late-round style gems should exist');
    assert.ok(teamCapHit(pro, 'kc') > 50_000_000);
  });
});
