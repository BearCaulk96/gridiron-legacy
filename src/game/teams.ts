import type { Team } from './types';

type TeamTemplate = Omit<
  Team,
  'capHit' | 'wins' | 'losses' | 'ties' | 'pointsFor' | 'pointsAgainst' | 'draftPicks' | 'coachIds'
>;

/** 32 franchises — American / National conferences with custom identities. */
export const TEAM_TEMPLATES: TeamTemplate[] = [
  // American Conference — North
  { id: 'pit', city: 'Pittsburgh', name: 'Iron', abbrev: 'PIT', conference: 'American', division: 'North', primary: '#101820', secondary: '#FFB612', accent: '#A5ACAF' },
  { id: 'cle', city: 'Cleveland', name: 'Rockers', abbrev: 'CLE', conference: 'American', division: 'North', primary: '#C8102E', secondary: '#101820', accent: '#8A8D8F' },
  { id: 'cin', city: 'Cincinnati', name: 'Rivermen', abbrev: 'CIN', conference: 'American', division: 'North', primary: '#0B7A4B', secondary: '#FFFFFF', accent: '#7EC8E3' },
  { id: 'bal', city: 'Baltimore', name: 'Armada', abbrev: 'BAL', conference: 'American', division: 'North', primary: '#4B0082', secondary: '#101820', accent: '#C0C0C0' },

  // American Conference — East
  { id: 'bos', city: 'Boston', name: 'Phantoms', abbrev: 'BOS', conference: 'American', division: 'East', primary: '#0C2340', secondary: '#C8102E', accent: '#FFFFFF' },
  { id: 'nyc', city: 'New York City', name: 'Liberties', abbrev: 'NYC', conference: 'American', division: 'East', primary: '#0B2265', secondary: '#A5ACAF', accent: '#2E8B57' },
  { id: 'mia', city: 'Miami', name: 'Cyclones', abbrev: 'MIA', conference: 'American', division: 'East', primary: '#008E97', secondary: '#FC4C02', accent: '#FFFFFF' },
  { id: 'buf', city: 'Buffalo', name: 'Blizzards', abbrev: 'BUF', conference: 'American', division: 'East', primary: '#00338D', secondary: '#FFFFFF', accent: '#101820' },

  // American Conference — South
  { id: 'jax', city: 'Jacksonville', name: 'Jaxs', abbrev: 'JAX', conference: 'American', division: 'South', primary: '#006778', secondary: '#D7A22A', accent: '#101820' },
  { id: 'nas', city: 'Nashville', name: 'Black Bears', abbrev: 'NAS', conference: 'American', division: 'South', primary: '#101820', secondary: '#FF6A00', accent: '#C0C0C0' },
  { id: 'hou', city: 'Houston', name: 'Apollos', abbrev: 'HOU', conference: 'American', division: 'South', primary: '#0C2340', secondary: '#C8102E', accent: '#FFFFFF' },
  { id: 'ind', city: 'Indianapolis', name: 'Racers', abbrev: 'IND', conference: 'American', division: 'South', primary: '#0033A0', secondary: '#FFFFFF', accent: '#A2AAAD' },

  // American Conference — West
  { id: 'lv', city: 'Las Vegas', name: 'Raptors', abbrev: 'LV', conference: 'American', division: 'West', primary: '#101820', secondary: '#C0C0C0', accent: '#FFB612' },
  { id: 'sd', city: 'San Diego', name: 'Koalas', abbrev: 'SD', conference: 'American', division: 'West', primary: '#F5F7FA', secondary: '#708090', accent: '#A7C7E7' },
  { id: 'den', city: 'Denver', name: 'Peaks', abbrev: 'DEN', conference: 'American', division: 'West', primary: '#FB4F14', secondary: '#0C2340', accent: '#FFFFFF' },
  { id: 'kc', city: 'Kansas City', name: 'Stampede', abbrev: 'KC', conference: 'American', division: 'West', primary: '#E31837', secondary: '#FFB81C', accent: '#101820' },

  // National Conference — North
  { id: 'chi', city: 'Chicago', name: 'Blaze', abbrev: 'CHI', conference: 'National', division: 'North', primary: '#0B162A', secondary: '#C83803', accent: '#FFFFFF' },
  { id: 'det', city: 'Detroit', name: 'Motors', abbrev: 'DET', conference: 'National', division: 'North', primary: '#B0B7BC', secondary: '#0076B6', accent: '#101820' },
  { id: 'gb', city: 'Green Bay', name: 'Lumberjacks', abbrev: 'GB', conference: 'National', division: 'North', primary: '#203731', secondary: '#FFB612', accent: '#FFFFFF' },
  { id: 'min', city: 'Minnesota', name: 'Northmen', abbrev: 'MIN', conference: 'National', division: 'North', primary: '#4F2683', secondary: '#FFC62F', accent: '#FFFFFF' },

  // National Conference — East
  { id: 'dal', city: 'Dallas', name: 'Wranglers', abbrev: 'DAL', conference: 'National', division: 'East', primary: '#0C2340', secondary: '#869397', accent: '#FFFFFF' },
  { id: 'phi', city: 'Philadelphia', name: 'Founders', abbrev: 'PHI', conference: 'National', division: 'East', primary: '#004C54', secondary: '#101820', accent: '#A5ACAF' },
  { id: 'was', city: 'Washington', name: 'Sentinels', abbrev: 'WAS', conference: 'National', division: 'East', primary: '#5A1414', secondary: '#FFB612', accent: '#FFFFFF' },
  { id: 'ric', city: 'Richmond', name: 'Renegades', abbrev: 'RIC', conference: 'National', division: 'East', primary: '#002868', secondary: '#BF0A30', accent: '#FFFFFF' },

  // National Conference — West
  { id: 'sea', city: 'Seattle', name: 'Emeralds', abbrev: 'SEA', conference: 'National', division: 'West', primary: '#046A38', secondary: '#0C2340', accent: '#FFFFFF' },
  { id: 'cal', city: 'California', name: 'Condors', abbrev: 'CAL', conference: 'National', division: 'West', primary: '#AA0000', secondary: '#B3995D', accent: '#101820' },
  { id: 'la', city: 'Los Angeles', name: 'Stars', abbrev: 'LA', conference: 'National', division: 'West', primary: '#1D4ED8', secondary: '#F5C518', accent: '#FFFFFF' },
  { id: 'ari', city: 'Arizona', name: 'Scorpions', abbrev: 'ARI', conference: 'National', division: 'West', primary: '#9B111E', secondary: '#101820', accent: '#C2B280' },

  // National Conference — South
  { id: 'atl', city: 'Atlanta', name: 'Phoenix', abbrev: 'ATL', conference: 'National', division: 'South', primary: '#A71930', secondary: '#101820', accent: '#FFB612' },
  { id: 'car', city: 'Carolina', name: 'Waves', abbrev: 'CAR', conference: 'National', division: 'South', primary: '#0085CA', secondary: '#A5ACAF', accent: '#101820' },
  { id: 'tb', city: 'Tampa Bay', name: 'Tritons', abbrev: 'TB', conference: 'National', division: 'South', primary: '#D50A0A', secondary: '#FFB612', accent: '#101820' },
  { id: 'no', city: 'New Orleans', name: 'Voodoos', abbrev: 'NO', conference: 'National', division: 'South', primary: '#4B0082', secondary: '#C9A227', accent: '#101820' },
];

export function teamDisplayName(team: Pick<Team, 'city' | 'name'>): string {
  return `${team.city} ${team.name}`;
}

export function teamsByConference(conference: Team['conference']): TeamTemplate[] {
  return TEAM_TEMPLATES.filter((t) => t.conference === conference);
}
