import { COACH_FIRST, COACH_LAST, FIRST_NAMES, LAST_NAMES } from './names';
import { createRng, pick, randInt, clamp, shuffle } from './rng';
import { TEAM_TEMPLATES } from './teams';
import { suggestedContract, BASE_SALARY_CAP, refreshTeamCapHits } from './salary';
import { getDifficulty } from './difficulty';
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
const ROSTER_SHAPE: Record<Position, number> = {
  QB: 2,
  RB: 3,
  WR: 5,
  TE: 2,
  OL: 7,
  DL: 5,
  LB: 5,
  CB: 4,
  S: 3,
  K: 1,
  P: 1,
};

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
  },
): Player {
  const overall = opts.overall ?? randInt(rng, 58, 88);
  const potential = opts.potential ?? clamp(overall + randInt(rng, 0, 12), 60, 99);
  const age = opts.age ?? randInt(rng, 21, 32);
  const contract =
    opts.teamId && !opts.isProspect
      ? {
          ...suggestedContract(overall, age, randInt(rng, 1, 4)),
          yearsRemaining: randInt(rng, 1, 4),
        }
      : null;

  if (contract) {
    contract.years = Math.max(contract.years, contract.yearsRemaining);
  }

  return {
    id: nextId('p'),
    firstName: pick(rng, FIRST_NAMES),
    lastName: pick(rng, LAST_NAMES),
    position: opts.position,
    age,
    overall,
    potential,
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

  // Free agent pool
  for (let i = 0; i < 80; i++) {
    const player = makePlayer(rng, {
      position: pick(rng, POSITIONS),
      teamId: null,
      overall: randInt(rng, 58, 84),
      age: randInt(rng, 23, 34),
    });
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
    version: 1,
    season: 2026,
    week: 0,
    phase: 'preseason',
    difficulty,
    userTeamId,
    teams,
    players,
    coaches,
    schedule: [],
    messages: [
      `Welcome to Gridiron Legacy. You take the helm of the ${teams.find((t) => t.id === userTeamId)?.city} ${teams.find((t) => t.id === userTeamId)?.name}.`,
      `Difficulty: ${cfg.label}. ${cfg.tagline}`,
      'No microtransactions. No pay-to-win. Pure football decisions.',
    ],
    scoutingPoints: difficulty === 'veteran' ? 6 : difficulty === 'pro' ? 10 : 18,
    salaryCap: BASE_SALARY_CAP,
    createdAt: new Date().toISOString(),
  };

  state.schedule = buildSchedule(state, rng);
  refreshTeamCapHits(state);
  return state;
}

export function generateDraftClass(rng: () => number, _season: number): Player[] {
  const classSize = 224; // 32 * 7
  const skillPositions = POSITIONS.filter((p) => p !== 'K' && p !== 'P');
  const prospects: Player[] = [];
  for (let i = 0; i < classSize; i++) {
    const elite = i < 12;
    const overall = elite ? randInt(rng, 78, 90) : randInt(rng, 58, 82);
    const boomBust = randInt(rng, -5, 14);
    let position: Position = pick(rng, skillPositions);
    if (i % 40 === 0) position = 'K';
    if (i % 40 === 1) position = 'P';
    const player = makePlayer(rng, {
      position,
      teamId: null,
      overall,
      potential: clamp(overall + boomBust, 60, 99),
      age: randInt(rng, 20, 23),
      isProspect: true,
    });
    player.contract = null;
    prospects.push(player);
  }
  return prospects;
}

/** 17-week round-robin-ish schedule: each team plays 17 games. */
export function buildSchedule(state: LeagueState, rng: () => number): import('./types').GameResult[] {
  const games: import('./types').GameResult[] = [];
  const teamIds = state.teams.map((t) => t.id);

  for (let week = 1; week <= 17; week++) {
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
