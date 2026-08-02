export type Difficulty = 'casual' | 'rookie' | 'pro' | 'veteran';

export type Position =
  | 'QB'
  | 'RB'
  | 'WR'
  | 'TE'
  | 'OL'
  | 'DL'
  | 'LB'
  | 'CB'
  | 'S'
  | 'K'
  | 'P';

export type Phase =
  | 'setup'
  | 'preseason'
  | 'regular'
  | 'playoffs'
  | 'offseason'
  | 'draft'
  | 'freeAgency';

export type Conference = 'American' | 'National';
export type Division = 'North' | 'South' | 'East' | 'West';

export interface Contract {
  years: number;
  annualSalary: number;
  guaranteed: number;
  yearsRemaining: number;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: Position;
  age: number;
  overall: number;
  potential: number;
  speed: number;
  strength: number;
  awareness: number;
  durability: number;
  morale: number;
  teamId: string | null;
  contract: Contract | null;
  draftRound?: number;
  draftPick?: number;
  isProspect?: boolean;
  scouted?: boolean;
  injuryWeeks: number;
  seasonsPlayed: number;
  stats: SeasonStats;
}

export interface SeasonStats {
  games: number;
  passYards: number;
  passTd: number;
  rushYards: number;
  rushTd: number;
  recYards: number;
  recTd: number;
  tackles: number;
  sacks: number;
  ints: number;
}

export interface Coach {
  id: string;
  name: string;
  role: 'HC' | 'OC' | 'DC';
  offense: number;
  defense: number;
  development: number;
  scheme: 'power' | 'spread' | 'balanced' | 'blitz' | 'cover';
  contractYears: number;
  salary: number;
  teamId: string | null;
}

export interface Team {
  id: string;
  city: string;
  name: string;
  abbrev: string;
  conference: Conference;
  division: Division;
  primary: string;
  secondary: string;
  accent: string;
  capHit: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  draftPicks: DraftPick[];
  coachIds: string[];
}

export interface DraftPick {
  year: number;
  round: number;
  originalTeamId: string;
  ownerTeamId: string;
}

export interface GameResult {
  id: string;
  week: number;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  played: boolean;
  playoff?: boolean;
}

export interface TradeAsset {
  type: 'player' | 'pick';
  playerId?: string;
  pick?: DraftPick;
}

export interface TradeOffer {
  fromTeamId: string;
  toTeamId: string;
  offer: TradeAsset[];
  request: TradeAsset[];
}

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  tagline: string;
  description: string;
  capSoftPercent: number;
  tradeGenerosity: number;
  simUserBoost: number;
  injuryRate: number;
  draftFog: number;
  freeScoutedProspects: number;
  showProspectOverall: boolean;
  showProspectPotential: boolean;
  schemeMatter: number;
  aiTradeStrictness: number;
  developmentBonus: number;
}

export interface LeagueState {
  version: 1;
  season: number;
  week: number;
  phase: Phase;
  difficulty: Difficulty;
  userTeamId: string;
  teams: Team[];
  players: Record<string, Player>;
  coaches: Record<string, Coach>;
  schedule: GameResult[];
  messages: string[];
  scoutingPoints: number;
  salaryCap: number;
  createdAt: string;
}
