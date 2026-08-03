import { COACH_FIRST, COACH_LAST, FIRST_NAMES, LAST_NAMES } from './names';
import { createRng, pick, randInt, clamp, shuffle } from './rng';
import { TEAM_TEMPLATES } from './teams';
import { suggestedContract, BASE_SALARY_CAP, refreshTeamCapHits, ROSTER_LIMIT } from './salary';
import { getDifficulty } from './difficulty';
import { buildTraits, overallFromTraits, syncPhysicalFromTraits } from './traits';
import type {
  Coach,
  Difficulty,
  DraftPick,
  LeagueState,
  Player,
  Position,
  SeasonStats,
  Team,
} from './types';

const POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'];

/** Counts sum to 53 — NFL active roster shape. */
const ROSTER_SHAPE: Record<Position, number> = {
  QB: 3,
  RB: 4,
  WR: 6,
  TE: 3,
  OL: 9,
  DL: 9,
  LB: 7,
  CB: 6,
  S: 4,
  K: 1,
  P: 1,
};

export { ROSTER_LIMIT };

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}`;
}

function emptyStats(): SeasonStats {
  return {
    games: 0,
    passYards: 0,
    passTd: 0,
    rushYards: 0,
    rushTd: 0,
    recYards: 0,
    recTd: 0,
    tackles: 0,
    sacks: 0,
    ints: 0,
  };
}

function makePlayer(
  rng: () => number,
  opts: {
    position: Position;
    age?: number;
    overall?: number;
    potential?: number;
    teamId: string | null;
    isProspect?: boolean;
    traits?: Record<string, number>;
  },
): Player {
  const traits = opts.traits ?? buildTraits(opts.position, opts.overall ?? randInt(rng, 58, 88), rng);
  const overall = opts.overall ?? overallFromTraits(traits);
  const potential = opts.potential ?? clamp(overall + randInt(rng, 0, 12), 60, 99);
  const age = opts.age ?? randInt(rng, 21, 32);
  const contract =
    opts.teamId && !opts.isProspect
      ? {
          ...suggestedContract(overall, age, randInt(rng, 1, 4), opts.position),
          yearsRemaining: randInt(rng, 1, 4),
        }
      : null;

  if (contract) {
    contract.years = Math.max(contract.years, contract.yearsRemaining);
  }

  const player: Player = {
    id: nextId('p'),
    firstName: pick(rng, FIRST_NAMES),
    lastName: pick(rng, LAST_NAMES),
    position: opts.position,
    age,
    overall,
    potential,
    traits,
    speed: clamp(overall + randInt(rng, -8, 8), 40, 99),
    strength: clamp(overall + randInt(rng, -8, 8), 40, 99),
    awareness: clamp(overall + randInt(rng, -10, 6), 40, 99),
    durability: randInt(rng, 55, 95),
    morale: randInt(rng, 60, 90),
    teamId: opts.teamId,
    contract,
    isProspect: opts.isProspect ?? false,
    scouted: false,
    injuryWeeks: 0,
    seasonsPlayed: Math.max(0, age - 21),
    stats: emptyStats(),
  };
  syncPhysicalFromTraits(player);
  return player;
}

function makeCoach(rng: () => number, teamId: string, role: Coach['role']): Coach {
  const schemes: Coach['scheme'][] = ['power', 'spread', 'balanced', 'blitz', 'cover'];
  const offense = randInt(rng, 55, 92);
  const defense = randInt(rng, 55, 92);
  const development = randInt(rng, 50, 90);
  return {
    id: nextId('c'),
    name: `${pick(rng, COACH_FIRST)} ${pick(rng, COACH_LAST)}`,
    role,
    offense,
    defense,
    development,
    scheme: pick(rng, schemes),
    contractYears: randInt(rng, 2, 5),
    salary: role === 'HC' ? 8_000_000 + randInt(rng, 0, 6) * 500_000 : 2_500_000 + randInt(rng, 0, 8) * 250_000,
    teamId,
  };
}

function buildDraftPicks(teamId: string, season: number): DraftPick[] {
  const picks: DraftPick[] = [];
  for (let yearOffset = 0; yearOffset < 3; yearOffset++) {
    for (let round = 1; round <= 7; round++) {
      picks.push({
        year: season + yearOffset,
        round,
        originalTeamId: teamId,
        ownerTeamId: teamId,
      });
    }
  }
  return picks;
}

export function createLeague(userTeamId: string, difficulty: Difficulty, seed = Date.now()): LeagueState {
  idCounter = 0;
  const rng = createRng(seed);
  const cfg = getDifficulty(difficulty);
  const players: Record<string, Player> = {};
  const coaches: Record<string, Coach> = {};

  const teams: Team[] = TEAM_TEMPLATES.map((t) => ({
    ...t,
    capHit: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    draftPicks: buildDraftPicks(t.id, 2026),
    coachIds: [],
  }));

  // Varied franchise strength tiers so every save feels different
  const strengthOrder = shuffle(
    rng,
    teams.map((t) => t.id),
  );
  const tierByTeam = new Map<string, number>();
  strengthOrder.forEach((id, i) => {
    tierByTeam.set(id, Math.floor(i / 8)); // 0 elite … 3 rebuild
  });

  for (const team of teams) {
    const tier = tierByTeam.get(team.id) ?? 2;
    const overallBias = [8, 3, -2, -7][tier]!;

    for (const pos of POSITIONS) {
      const count = ROSTER_SHAPE[pos];
      for (let i = 0; i < count; i++) {
        const starterBoost = i === 0 ? 6 : i === 1 ? 2 : -4;
        const overall = clamp(randInt(rng, 62, 86) + overallBias + starterBoost, 55, 96);
        const player = makePlayer(rng, {
          position: pos,
          teamId: team.id,
          overall,
          age: randInt(rng, 21, 33),
        });
        players[player.id] = player;
      }
    }

    for (const role of ['HC', 'OC', 'DC'] as const) {
      const coach = makeCoach(rng, team.id, role);
      coaches[coach.id] = coach;
      team.coachIds.push(coach.id);
    }
  }

  // Free agent pool — cut / unwanted / money-chasers before the draft
  for (let i = 0; i < 120; i++) {
    const overall = randInt(rng, 58, 88);
    const player = makePlayer(rng, {
      position: pick(rng, POSITIONS),
      teamId: null,
      overall,
      age: randInt(rng, 23, 34),
    });
    // Some want starter money above their market (motivates FA shopping)
    if (rng() < 0.35 && player.contract == null) {
      const want = suggestedContract(Math.min(99, overall + 4), player.age, 3, player.position);
      player.contract = null;
      player.morale = clamp(player.morale - 8, 35, 99);
      void want;
    }
    players[player.id] = player;
  }

  // Draft class
  const prospects = generateDraftClass(rng, 2026);
  for (const p of prospects) {
    players[p.id] = p;
  }

  // Auto-scout top prospects based on difficulty
  const sortedProspects = prospects.sort((a, b) => b.potential - a.potential);
  sortedProspects.slice(0, cfg.freeScoutedProspects).forEach((p) => {
    p.scouted = true;
  });

  const state: LeagueState = {
    version: 2,
    season: 2026,
    calendarIndex: 0,
    week: 0,
    phase: 'freeAgency',
    difficulty,
    userTeamId,
    teams,
    players,
    coaches,
    schedule: [],
    messages: [
      `Welcome to Gridiron Dynasty. You take the helm of the ${teams.find((t) => t.id === userTeamId)?.city} ${teams.find((t) => t.id === userTeamId)?.name}.`,
      `Difficulty: ${cfg.label}. ${cfg.tagline}`,
      cfg.uncapped
        ? 'Salary cap: uncapped on this difficulty — build the roster you want.'
        : `Salary cap: $${(BASE_SALARY_CAP / 1e6).toFixed(0)}M hard ceiling.`,
      'April Free Agency opens first — then May scouting and a 7-round draft full of late-round gems.',
      'No microtransactions. No pay-to-win. Pure football decisions.',
    ],
    scoutingPoints: difficulty === 'veteran' ? 6 : difficulty === 'pro' ? 10 : 18,
    salaryCap: BASE_SALARY_CAP,
    createdAt: new Date().toISOString(),
    championId: null,
  };

  state.schedule = buildSchedule(state, rng);
  refreshTeamCapHits(state);
  return state;
}

/**
 * 7-round class (224). Talent is shuffled so elites aren't all "first round"
 * and late rounds hide boom-or-bust gems that can become franchise pieces.
 */
export function generateDraftClass(rng: () => number, _season: number): Player[] {
  const classSize = 224; // 32 * 7
  const skillPositions = POSITIONS.filter((p) => p !== 'K' && p !== 'P');

  // Talent pool by tier — then shuffle into draft order so board ≠ round purity
  const targets: { overall: number; potential: number; gem?: boolean }[] = [];
  for (let i = 0; i < 10; i++) {
    const o = randInt(rng, 84, 93);
    targets.push({ overall: o, potential: clamp(o + randInt(rng, 2, 10), 88, 99) });
  }
  for (let i = 0; i < 28; i++) {
    const o = randInt(rng, 78, 86);
    targets.push({ overall: o, potential: clamp(o + randInt(rng, -2, 12), 75, 97) });
  }
  for (let i = 0; i < 50; i++) {
    const o = randInt(rng, 70, 80);
    targets.push({ overall: o, potential: clamp(o + randInt(rng, -4, 14), 68, 96) });
  }
  // Depth + hidden gems (low current, high ceiling)
  while (targets.length < classSize) {
    const gem = rng() < 0.14;
    if (gem) {
      const o = randInt(rng, 58, 72);
      targets.push({
        overall: o,
        potential: randInt(rng, 86, 99),
        gem: true,
      });
    } else {
      const o = randInt(rng, 55, 74);
      targets.push({ overall: o, potential: clamp(o + randInt(rng, -3, 10), 58, 88) });
    }
  }

  const shuffled = shuffle(rng, targets);
  const prospects: Player[] = [];
  for (let i = 0; i < classSize; i++) {
    const slot = shuffled[i]!;
    let position: Position = pick(rng, skillPositions);
    if (i % 48 === 0) position = 'K';
    if (i % 48 === 1) position = 'P';
    const traits = buildTraits(position, slot.overall, rng);
    // Gems: one trait spikes toward potential
    if (slot.gem) {
      const keys = Object.keys(traits);
      const spike = keys[randInt(rng, 0, keys.length - 1)]!;
      traits[spike] = clamp(slot.potential - randInt(rng, 0, 6), 70, 99);
    }
    const overall = overallFromTraits(traits);
    const player = makePlayer(rng, {
      position,
      teamId: null,
      overall,
      potential: slot.potential,
      age: randInt(rng, 20, 23),
      isProspect: true,
      traits,
    });
    player.contract = null;
    prospects.push(player);
  }
  return prospects;
}

/** Preseason (3) + 18-week regular season. Playoff games are added during the calendar. */
export function buildSchedule(state: LeagueState, rng: () => number): import('./types').GameResult[] {
  const games: import('./types').GameResult[] = [];
  const teamIds = state.teams.map((t) => t.id);

  for (let week = 1; week <= 3; week++) {
    const pool = shuffle(rng, teamIds);
    for (let i = 0; i < pool.length; i += 2) {
      const home = pool[i]!;
      const away = pool[i + 1]!;
      games.push({
        id: `ps_${state.season}_${week}_${home}_${away}`,
        week,
        homeId: home,
        awayId: away,
        homeScore: 0,
        awayScore: 0,
        played: false,
        preseason: true,
      });
    }
  }

  for (let week = 1; week <= 18; week++) {
    const pool = shuffle(rng, teamIds);
    for (let i = 0; i < pool.length; i += 2) {
      const home = pool[i]!;
      const away = pool[i + 1]!;
      games.push({
        id: `g_${state.season}_${week}_${home}_${away}`,
        week,
        homeId: home,
        awayId: away,
        homeScore: 0,
        awayScore: 0,
        played: false,
      });
    }
  }
  return games;
}

export function playerName(p: Player): string {
  return `${p.firstName} ${p.lastName}`;
}
