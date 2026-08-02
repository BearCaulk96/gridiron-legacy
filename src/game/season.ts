import { applyDevelopment, autoPickUntilUser, currentDraftPick, runFullAiDraft } from './draft';
import { buildSchedule, createLeague, generateDraftClass, playerName } from './generate';
import { createRng, randInt, shuffle } from './rng';
import { getDifficulty } from './difficulty';
import { positionalNeed } from './ratings';
import {
  freeAgents,
  maxAllowedCap,
  refreshTeamCapHits,
  suggestedContract,
  teamCapHit,
  teamCapSpace,
} from './salary';
import { applyCompletedGame, describeGame, simulateGame } from './simulation';
import {
  CALENDAR_LENGTH,
  calendarSlot,
  currentCalendar,
  formatCalendarLabel,
  type CalendarSlot,
} from './calendar';
import type { Difficulty, GameResult, LeagueState, Team } from './types';
import type { LiveGameState } from './playByPlay';

export function startNewGame(userTeamId: string, difficulty: Difficulty): LeagueState {
  return createLeague(userTeamId, difficulty);
}

function syncFromCalendar(state: LeagueState): void {
  const slot = currentCalendar(state);
  state.phase = slot.phase;
  state.week = slot.seasonWeek ?? 0;
}

function tickInjuries(state: LeagueState): void {
  for (const p of Object.values(state.players)) {
    if (p.injuryWeeks > 0) p.injuryWeeks -= 1;
  }
}

function gamesForSlot(state: LeagueState, slot: CalendarSlot): GameResult[] {
  if (slot.seasonWeek == null) return [];
  return state.schedule.filter(
    (g) =>
      g.week === slot.seasonWeek &&
      !!g.preseason === !!slot.preseason &&
      !!g.playoff === !!slot.playoff &&
      !g.played,
  );
}

export function userGameThisWeek(state: LeagueState): GameResult | null {
  const slot = currentCalendar(state);
  if (slot.playAction !== 'gameday' || slot.seasonWeek == null) return null;
  return (
    state.schedule.find(
      (g) =>
        g.week === slot.seasonWeek &&
        !!g.preseason === !!slot.preseason &&
        !!g.playoff === !!slot.playoff &&
        !g.played &&
        (g.homeId === state.userTeamId || g.awayId === state.userTeamId),
    ) ?? null
  );
}

function standingsSort(a: Team, b: Team): number {
  const pct = (t: Team) => (t.wins + t.ties * 0.5) / Math.max(1, t.wins + t.losses + t.ties);
  return pct(b) - pct(a) || b.pointsFor - a.pointsFor;
}

function ensurePlayoffRound(state: LeagueState, slot: CalendarSlot): void {
  if (!slot.playoff || slot.seasonWeek == null) return;
  const existing = state.schedule.some((g) => g.playoff && g.week === slot.seasonWeek);
  if (existing) return;

  const american = state.teams
    .filter((t) => t.conference === 'American')
    .sort(standingsSort)
    .slice(0, 4);
  const national = state.teams
    .filter((t) => t.conference === 'National')
    .sort(standingsSort)
    .slice(0, 4);

  const winnersOf = (week: number): string[] =>
    state.schedule
      .filter((g) => g.playoff && g.week === week && g.played)
      .map((g) => (g.homeScore >= g.awayScore ? g.homeId : g.awayId));

  const confOf = (id: string) => state.teams.find((t) => t.id === id)?.conference;

  const push = (week: number, homeId: string, awayId: string) => {
    state.schedule.push({
      id: `po_${state.season}_${week}_${homeId}_${awayId}`,
      week,
      homeId,
      awayId,
      homeScore: 0,
      awayScore: 0,
      played: false,
      playoff: true,
    });
  };

  if (slot.seasonWeek === 1) {
    // Wildcard: 1v4, 2v3 each conference
    push(1, american[0]!.id, american[3]!.id);
    push(1, american[1]!.id, american[2]!.id);
    push(1, national[0]!.id, national[3]!.id);
    push(1, national[1]!.id, national[2]!.id);
    state.messages.unshift('Wildcard weekend is set.');
  } else if (slot.seasonWeek === 2) {
    const am = winnersOf(1).filter((id) => confOf(id) === 'American');
    const na = winnersOf(1).filter((id) => confOf(id) === 'National');
    if (am.length >= 2) push(2, am[0]!, am[1]!);
    if (na.length >= 2) push(2, na[0]!, na[1]!);
    state.messages.unshift('Divisional round — conference finals are set.');
  } else if (slot.seasonWeek === 4) {
    const champs = winnersOf(2);
    if (champs.length >= 2) push(4, champs[0]!, champs[1]!);
    else push(4, american[0]!.id, national[0]!.id);
    state.messages.unshift('Super Bowl week arrives.');
  }
}

/** Prepare the newly entered calendar week (draft class, playoff bracket, etc.). */
function onEnterWeek(state: LeagueState): void {
  const slot = currentCalendar(state);
  syncFromCalendar(state);

  if (slot.kind === 'scoutingReport') {
    prepareDraftClass(state);
    state.messages.unshift(`${formatCalendarLabel(slot, state.season)} — scouting reports hit the building.`);
  } else if (slot.kind === 'draft') {
    prepareDraftClass(state);
    state.phase = 'draft';
    state.messages.unshift(`The ${state.season} Gridiron Draft is open.`);
    autoPickUntilUser(state);
  } else if (slot.playoff) {
    ensurePlayoffRound(state, slot);
  } else if (slot.kind === 'regularSeason' && slot.seasonWeek === 1) {
    state.messages.unshift(`${state.season} regular season kicks off.`);
  }
}

function prepareDraftClass(state: LeagueState): void {
  const existingProspects = Object.values(state.players).filter((p) => p.isProspect && !p.teamId);
  if (existingProspects.length >= 100) {
    // Refresh scouting points when entering scouting/draft window
    state.scoutingPoints =
      state.difficulty === 'veteran' ? 6 : state.difficulty === 'pro' ? 10 : state.difficulty === 'rookie' ? 18 : 40;
    return;
  }
  for (const p of existingProspects) delete state.players[p.id];
  const rng = createRng(state.season * 1337);
  const cls = generateDraftClass(rng, state.season);
  const cfg = getDifficulty(state.difficulty);
  cls
    .sort((a, b) => b.potential - a.potential)
    .slice(0, cfg.freeScoutedProspects)
    .forEach((p) => {
      p.scouted = true;
    });
  for (const p of cls) state.players[p.id] = p;
  state.scoutingPoints =
    state.difficulty === 'veteran' ? 6 : state.difficulty === 'pro' ? 10 : state.difficulty === 'rookie' ? 18 : 40;
}

function resolveNonGameWeek(state: LeagueState, slot: CalendarSlot): void {
  const label = formatCalendarLabel(slot, state.season);
  switch (slot.kind) {
    case 'playoffConference': {
      const champs = state.schedule
        .filter((g) => g.playoff && g.week === 2 && g.played)
        .map((g) => (g.homeScore >= g.awayScore ? g.homeId : g.awayId));
      for (const id of champs) {
        const t = state.teams.find((x) => x.id === id);
        if (t) state.messages.unshift(`${t.city} ${t.name} are Conference Champions.`);
      }
      if (!champs.length) state.messages.unshift(`${label}: Conference champions are confirmed.`);
      break;
    }
    case 'freeAgencyRecap': {
      aiSignFreeAgents(state);
      state.messages.unshift(`${label}: Free agency frenzy settles — boards are set for May scouting.`);
      break;
    }
    case 'draftRecap': {
      state.messages.unshift(`${label}: Draft grades are in. Rookies report for June meetings.`);
      break;
    }
    case 'gmStadium':
      state.messages.unshift(`${label}: Stadium ops and ticket sales reviewed.`);
      break;
    case 'gmCoaching':
      state.messages.unshift(`${label}: Front office reviews the coaching staff.`);
      break;
    case 'coachWeek':
      state.messages.unshift(`${label}: Scheme install meetings wrap up.`);
      break;
    case 'rest':
      state.messages.unshift(`${label}: The building goes quiet — rest week.`);
      break;
    case 'trainingCamp':
      state.messages.unshift(
        `${label}: Training camp focus — ${slot.detail ?? 'full squad'}.`,
      );
      break;
    case 'finalizeRoster':
      state.messages.unshift(`${label}: 53-man roster finalized and starters elected.`);
      break;
    case 'hallOfFame': {
      const mvp = [...state.teams].sort((a, b) => b.pointsFor - a.pointsFor)[0]!;
      state.messages.unshift(
        `${label}: Season awards — ${mvp.city} ${mvp.name} lead the scoring race. Hall of Fame class announced.`,
      );
      break;
    }
    case 'seasonRecap': {
      const champ = state.championId
        ? state.teams.find((t) => t.id === state.championId)
        : null;
      state.messages.unshift(
        champ
          ? `${label}: ${champ.city} ${champ.name} headline the season recap.`
          : `${label}: The season recap airs league-wide.`,
      );
      break;
    }
    case 'retirements': {
      const rng = createRng(state.season * 77 + 3);
      let count = 0;
      for (const p of Object.values(state.players)) {
        if (!p.teamId || p.isProspect) continue;
        if (p.age >= 34 && rng() < 0.22) {
          state.messages.unshift(`${playerName(p)} (${p.position}) announces retirement.`);
          p.teamId = null;
          p.contract = null;
          count += 1;
          if (count >= 6) break;
        }
      }
      if (!count) state.messages.unshift(`${label}: A quiet retirement cycle.`);
      break;
    }
    case 'fillJobs':
      state.messages.unshift(`${label}: Vacant coach and GM chairs are filled around the league.`);
      break;
    case 'contractNegotiations':
      state.messages.unshift(`${label}: Expiring contracts hit the table.`);
      break;
    case 'contractDeadline':
      state.messages.unshift(`${label}: Final contract decisions lock in before Free Agency.`);
      break;
    case 'freeAgency':
      state.messages.unshift(`${label}: Free agency week continues.`);
      break;
    case 'scoutingReport':
    case 'scoutingReview':
      state.messages.unshift(`${label}: Scouting notes filed.`);
      break;
    default:
      state.messages.unshift(`${label}: Week complete.`);
  }
}

function rollToNextSeason(state: LeagueState): void {
  applyDevelopment(state);

  for (const c of Object.values(state.coaches)) {
    c.contractYears -= 1;
    if (c.contractYears <= 0) {
      c.contractYears = randInt(createRng(hash(c.id) + state.season), 2, 4);
    }
  }

  for (const t of state.teams) {
    t.wins = 0;
    t.losses = 0;
    t.ties = 0;
    t.pointsFor = 0;
    t.pointsAgainst = 0;
    const futureYear = state.season + 2;
    for (let round = 1; round <= 7; round++) {
      const exists = t.draftPicks.some(
        (pk) => pk.year === futureYear && pk.round === round && pk.originalTeamId === t.id,
      );
      if (!exists) {
        t.draftPicks.push({
          year: futureYear,
          round,
          originalTeamId: t.id,
          ownerTeamId: t.id,
        });
      }
    }
  }

  // Clear leftover prospects from prior draft
  for (const p of Object.values(state.players)) {
    if (p.isProspect && !p.teamId) delete state.players[p.id];
  }

  state.season += 1;
  state.calendarIndex = 0;
  state.championId = null;
  const rng = createRng(state.season * 9001);
  state.schedule = buildSchedule(state, rng);
  refreshTeamCapHits(state);
  syncFromCalendar(state);
  state.messages.unshift(
    `${state.season} league year opens — April Free Agency Week 1.`,
  );
}

/** Advance one calendar week after the current event is resolved. */
export function advanceCalendar(state: LeagueState): void {
  const leaving = currentCalendar(state);
  if (leaving.playAction === 'gameday') {
    completeOpenGamesForSlot(state, leaving);
  } else if (leaving.kind === 'draft') {
    if (currentDraftPick(state)) {
      runFullAiDraft(state);
      state.messages.unshift('Remaining draft picks are in.');
    }
    state.phase = 'draft';
    state.messages.unshift('Draft week wraps — grades posting next.');
  } else {
    resolveNonGameWeek(state, leaving);
  }

  tickInjuries(state);

  if (leaving.index >= CALENDAR_LENGTH - 1) {
    rollToNextSeason(state);
    return;
  }

  state.calendarIndex += 1;
  onEnterWeek(state);
}

function completeOpenGamesForSlot(state: LeagueState, slot: CalendarSlot): void {
  for (const g of gamesForSlot(state, slot)) {
    if (slot.preseason || slot.playoff) simulateExhibitionGame(state, g);
    else simulateGame(state, g);
  }
  if (slot.kind === 'superBowl') {
    const sb = state.schedule.find((g) => g.playoff && g.week === 4 && g.played);
    if (sb) {
      state.championId = sb.homeScore >= sb.awayScore ? sb.homeId : sb.awayId;
      const champ = state.teams.find((t) => t.id === state.championId)!;
      state.messages.unshift(`${champ.city} ${champ.name} win the Gridiron Cup!`);
      if (state.championId === state.userTeamId) {
        state.messages.unshift('Dynasty moment: you are champions.');
      }
    }
  }
}

/** Preseason / playoff: score the game but do not change regular-season standings. */
function simulateExhibitionGame(state: LeagueState, game: GameResult): void {
  if (game.played) return;
  const home = state.teams.find((t) => t.id === game.homeId)!;
  const away = state.teams.find((t) => t.id === game.awayId)!;
  const snap = {
    hw: home.wins,
    hl: home.losses,
    ht: home.ties,
    hpf: home.pointsFor,
    hpa: home.pointsAgainst,
    aw: away.wins,
    al: away.losses,
    at: away.ties,
    apf: away.pointsFor,
    apa: away.pointsAgainst,
  };
  simulateGame(state, game);
  home.wins = snap.hw;
  home.losses = snap.hl;
  home.ties = snap.ht;
  home.pointsFor = snap.hpf;
  home.pointsAgainst = snap.hpa;
  away.wins = snap.aw;
  away.losses = snap.al;
  away.ties = snap.at;
  away.pointsFor = snap.apf;
  away.pointsAgainst = snap.apa;
}

/** Resolve Play Now for non-gameday weeks (advances calendar). */
export function playCalendarWeek(state: LeagueState): void {
  const slot = currentCalendar(state);
  if (slot.playAction === 'gameday') return;
  if (slot.kind === 'draft' && currentDraftPick(state)) return;
  advanceCalendar(state);
}

/** Commit a watched live game, sim remaining slate for the slot, advance calendar. */
export function completeLiveGameWeek(state: LeagueState, live: LiveGameState): void {
  const slot = currentCalendar(state);
  if (slot.playAction !== 'gameday') return;
  const game = state.schedule.find((g) => g.id === live.gameId);
  if (!game) return;

  if (slot.preseason || slot.playoff) {
    game.homeScore = live.homeScore;
    game.awayScore = live.awayScore;
    game.played = true;
    const tag = slot.preseason ? 'preseason' : 'playoffs';
    state.messages.unshift(
      `${formatCalendarLabel(slot, state.season)}: ${describeGame(state, game)} (${tag})`,
    );
  } else {
    applyCompletedGame(state, game, live.homeScore, live.awayScore);
    state.messages.unshift(
      `${formatCalendarLabel(slot, state.season)}: ${describeGame(state, game)}`,
    );
  }

  for (const g of gamesForSlot(state, slot)) {
    if (slot.preseason || slot.playoff) simulateExhibitionGame(state, g);
    else simulateGame(state, g);
  }

  if (slot.kind === 'superBowl') {
    state.championId = game.homeScore >= game.awayScore ? game.homeId : game.awayId;
    const champ = state.teams.find((t) => t.id === state.championId)!;
    state.messages.unshift(`${champ.city} ${champ.name} win the Gridiron Cup!`);
  }

  tickInjuries(state);
  state.calendarIndex += 1;
  if (state.calendarIndex >= CALENDAR_LENGTH) {
    state.calendarIndex = CALENDAR_LENGTH - 1;
    rollToNextSeason(state);
    return;
  }
  onEnterWeek(state);
}

/** @deprecated use advanceCalendar — kept for tests simulating full RS quickly */
export function beginSeason(state: LeagueState): void {
  const idx = calendarSlot(0).kind === 'regularSeason'
    ? 0
    : (() => {
        const i = Array.from({ length: CALENDAR_LENGTH }, (_, n) => n).find(
          (n) => calendarSlot(n).kind === 'regularSeason' && calendarSlot(n).seasonWeek === 1,
        );
        return i ?? 20;
      })();
  state.calendarIndex = idx;
  syncFromCalendar(state);
  state.messages.unshift(`Season ${state.season} Week 1 kicks off.`);
}

/** Sim one regular-season week and advance (test helper / quick sim). */
export function advanceWeek(state: LeagueState): void {
  const slot = currentCalendar(state);
  if (slot.kind !== 'regularSeason') {
    // Jump to RS if somehow elsewhere
    if (state.phase !== 'regular') beginSeason(state);
  }
  const current = currentCalendar(state);
  completeOpenGamesForSlot(state, current);
  const userGame = state.schedule.find(
    (g) =>
      !g.preseason &&
      !g.playoff &&
      g.week === current.seasonWeek &&
      (g.homeId === state.userTeamId || g.awayId === state.userTeamId),
  );
  if (userGame) {
    state.messages.unshift(`Week ${current.seasonWeek}: ${describeGame(state, userGame)}`);
  }
  tickInjuries(state);
  state.calendarIndex += 1;
  if (state.calendarIndex >= CALENDAR_LENGTH) {
    rollToNextSeason(state);
    return;
  }
  onEnterWeek(state);
}

export function enterDraft(state: LeagueState): void {
  const draftIdx = Array.from({ length: CALENDAR_LENGTH }, (_, n) => n).find(
    (n) => calendarSlot(n).kind === 'draft',
  );
  if (draftIdx != null) state.calendarIndex = draftIdx;
  prepareDraftClass(state);
  state.phase = 'draft';
  state.messages.unshift(`The ${state.season} Gridiron Draft is open.`);
  autoPickUntilUser(state);
}

/** Finish an interactive week from FA / draft UI and move the calendar forward. */
export function continueCalendarFromHub(state: LeagueState): void {
  advanceCalendar(state);
}

export function completeOffseasonToNextSeason(state: LeagueState): void {
  // Legacy hook from FA finish button — advance through remaining FA into May
  const slot = currentCalendar(state);
  if (slot.phase === 'freeAgency') {
    advanceCalendar(state);
    return;
  }
  rollToNextSeason(state);
}

export function signFreeAgent(state: LeagueState, playerId: string, years = 2): string | null {
  const player = state.players[playerId];
  if (!player || player.teamId || player.isProspect) return 'Player unavailable.';
  if (state.phase !== 'freeAgency') return 'Free agency is not open this week.';

  const contract = suggestedContract(player.overall, player.age, years);
  const projected = teamCapHit(state, state.userTeamId) + contract.annualSalary;
  if (projected > maxAllowedCap(state)) {
    return 'Signing would exceed the salary cap for this difficulty.';
  }

  player.teamId = state.userTeamId;
  player.contract = { ...contract, yearsRemaining: years };
  player.morale = Math.min(99, player.morale + 8);
  refreshTeamCapHits(state);
  state.messages.unshift(
    `Signed ${playerName(player)} for ${years} yr / $${(contract.annualSalary / 1e6).toFixed(1)}M.`,
  );
  return null;
}

export function releasePlayer(state: LeagueState, playerId: string): string | null {
  const player = state.players[playerId];
  if (!player || player.teamId !== state.userTeamId) return 'Not on your roster.';
  const name = playerName(player);
  player.teamId = null;
  player.contract = null;
  refreshTeamCapHits(state);
  state.messages.unshift(`Released ${name}.`);
  return null;
}

export function aiSignFreeAgents(state: LeagueState): void {
  const rng = createRng(state.season * 42 + 7);
  const agents = freeAgents(state).filter((p) => p.overall >= 70);
  const teams = shuffle(
    rng,
    state.teams.filter((t) => t.id !== state.userTeamId),
  );

  for (const team of teams) {
    if (teamCapSpace(state, team.id) < 2_000_000) continue;
    const needs = positionalNeed(state, team.id);
    const target = agents.find((p) => {
      if (p.teamId) return false;
      if (!needs.slice(0, 4).includes(p.position)) return false;
      const sal = suggestedContract(p.overall, p.age).annualSalary;
      return teamCapHit(state, team.id) + sal <= maxAllowedCap(state);
    });
    if (!target) continue;
    const c = suggestedContract(target.overall, target.age, 2);
    target.teamId = team.id;
    target.contract = { ...c, yearsRemaining: 2 };
  }
  refreshTeamCapHits(state);
}

export function hireCoachHint(state: LeagueState): string {
  const team = state.teams.find((t) => t.id === state.userTeamId)!;
  const coaches = team.coachIds.map((id) => state.coaches[id]!);
  const hc = coaches.find((c) => c.role === 'HC');
  const cfg = getDifficulty(state.difficulty);
  if (!hc) return 'Hire a head coach to stabilize the locker room.';
  if (cfg.schemeMatter < 0.3) {
    return `${hc.name} runs a ${hc.scheme} system — scheme fit is soft on this difficulty.`;
  }
  return `${hc.name} (${hc.scheme}) — match OC/DC schemes for bigger in-game bonuses.`;
}

export function userTeam(state: LeagueState) {
  return state.teams.find((t) => t.id === state.userTeamId)!;
}

export function standings(state: LeagueState) {
  return [...state.teams].sort(standingsSort);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
