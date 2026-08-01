import { getDifficulty } from './difficulty';
import { createRng, clamp, randInt } from './rng';
import { teamPower } from './ratings';
import { rosterPlayers } from './salary';
import type { GameResult, LeagueState, Player, Position } from './types';

function scoreFromPower(rng: () => number, power: number, oppPower: number): number {
  const edge = (power - oppPower) / 6;
  const base = 20 + edge + rng() * 10;
  const variance = (rng() - 0.5) * 18;
  return clamp(Math.round(base + variance), 3, 55);
}

function awardStats(players: Player[], score: number, oppScore: number, rng: () => number): void {
  const byPos = (pos: Position) =>
    players.filter((p) => p.position === pos && p.injuryWeeks === 0).sort((a, b) => b.overall - a.overall);

  const qb = byPos('QB')[0];
  const rb = byPos('RB')[0];
  const wrs = byPos('WR').slice(0, 3);
  const te = byPos('TE')[0];
  const defenders = players
    .filter((p) => ['DL', 'LB', 'CB', 'S'].includes(p.position) && p.injuryWeeks === 0)
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 6);

  for (const p of players) {
    if (p.injuryWeeks === 0) p.stats.games += 1;
  }

  if (qb) {
    qb.stats.passYards += Math.round(180 + score * 6 + rng() * 80);
    qb.stats.passTd += Math.max(0, Math.round(score / 10 + rng() * 2 - 0.5));
  }
  if (rb) {
    rb.stats.rushYards += Math.round(50 + score * 2 + rng() * 40);
    rb.stats.rushTd += rng() > 0.55 ? 1 : 0;
  }
  wrs.forEach((wr, i) => {
    wr.stats.recYards += Math.round(40 + score * (1.2 - i * 0.25) + rng() * 30);
    if (rng() > 0.65) wr.stats.recTd += 1;
  });
  if (te) {
    te.stats.recYards += Math.round(25 + rng() * 35);
    if (rng() > 0.75) te.stats.recTd += 1;
  }
  defenders.forEach((d) => {
    d.stats.tackles += randInt(rng, 2, 9);
    if (d.position === 'DL' || d.position === 'LB') {
      if (rng() > 0.72) d.stats.sacks += 1;
    }
    if (d.position === 'CB' || d.position === 'S') {
      if (rng() > 0.82) d.stats.ints += 1;
    }
  });

  // morale nudge
  const win = score > oppScore;
  for (const p of players) {
    p.morale = clamp(p.morale + (win ? 1 : -1) + randInt(rng, -1, 1), 35, 99);
  }
}

function applyInjuries(state: LeagueState, teamId: string, rng: () => number): string[] {
  const cfg = getDifficulty(state.difficulty);
  const notes: string[] = [];
  const roster = rosterPlayers(state, teamId).filter((p) => p.injuryWeeks === 0);
  for (const p of roster) {
    const risk = cfg.injuryRate * (1.15 - p.durability / 100);
    if (rng() < risk) {
      p.injuryWeeks = randInt(rng, 1, cfg.id === 'veteran' ? 6 : 4);
      notes.push(`${p.firstName} ${p.lastName} (${p.position}) out ${p.injuryWeeks} wk`);
    }
  }
  return notes;
}

export function simulateGame(state: LeagueState, game: GameResult): void {
  if (game.played) return;
  const seed = hashString(game.id + state.season + state.week);
  const rng = createRng(seed);

  const homePower = teamPower(state, game.homeId) + 2.5; // home field
  const awayPower = teamPower(state, game.awayId);

  let homeScore = scoreFromPower(rng, homePower, awayPower);
  let awayScore = scoreFromPower(rng, awayPower, homePower);

  // Avoid too many ties; overtime-ish
  if (homeScore === awayScore && rng() > 0.12) {
    if (rng() > 0.5) homeScore += 3;
    else awayScore += 3;
  }

  game.homeScore = homeScore;
  game.awayScore = awayScore;
  game.played = true;

  const home = state.teams.find((t) => t.id === game.homeId)!;
  const away = state.teams.find((t) => t.id === game.awayId)!;
  home.pointsFor += homeScore;
  home.pointsAgainst += awayScore;
  away.pointsFor += awayScore;
  away.pointsAgainst += homeScore;

  if (homeScore > awayScore) {
    home.wins += 1;
    away.losses += 1;
  } else if (awayScore > homeScore) {
    away.wins += 1;
    home.losses += 1;
  } else {
    home.ties += 1;
    away.ties += 1;
  }

  awardStats(rosterPlayers(state, home.id), homeScore, awayScore, rng);
  awardStats(rosterPlayers(state, away.id), awayScore, homeScore, rng);

  const injuries = [
    ...applyInjuries(state, home.id, rng).map((n) => `${home.abbrev}: ${n}`),
    ...applyInjuries(state, away.id, rng).map((n) => `${away.abbrev}: ${n}`),
  ];
  if (injuries.length && (game.homeId === state.userTeamId || game.awayId === state.userTeamId)) {
    state.messages.unshift(...injuries.slice(0, 3));
  }
}

export function simulateWeek(state: LeagueState): GameResult[] {
  const weekGames = state.schedule.filter((g) => g.week === state.week && !g.played);
  for (const g of weekGames) simulateGame(state, g);

  // heal injuries one week
  for (const p of Object.values(state.players)) {
    if (p.injuryWeeks > 0) p.injuryWeeks -= 1;
  }

  return weekGames;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function describeGame(state: LeagueState, game: GameResult): string {
  const home = state.teams.find((t) => t.id === game.homeId)!;
  const away = state.teams.find((t) => t.id === game.awayId)!;
  if (!game.played) return `${away.abbrev} @ ${home.abbrev}`;
  return `${away.abbrev} ${game.awayScore} — ${home.abbrev} ${game.homeScore}`;
}
