import type { Team } from './types';

/** 32 franchise cities mirroring NFL markets with original nicknames (no pro trademarks). */
export const TEAM_TEMPLATES: Omit<
  Team,
  'capHit' | 'wins' | 'losses' | 'ties' | 'pointsFor' | 'pointsAgainst' | 'draftPicks' | 'coachIds'
>[] = [
  { id: 'ari', city: 'Arizona', name: 'Saguaros', abbrev: 'ARI', conference: 'West', division: 'West', primary: '#97233F', secondary: '#FFB612' },
  { id: 'atl', city: 'Atlanta', name: 'Magnolias', abbrev: 'ATL', conference: 'East', division: 'South', primary: '#A71930', secondary: '#000000' },
  { id: 'bal', city: 'Baltimore', name: 'Harbormen', abbrev: 'BAL', conference: 'East', division: 'North', primary: '#241773', secondary: '#9E7C0C' },
  { id: 'buf', city: 'Buffalo', name: 'Blizzard', abbrev: 'BUF', conference: 'East', division: 'East', primary: '#00338D', secondary: '#C60C30' },
  { id: 'car', city: 'Carolina', name: 'Lowcountry', abbrev: 'CAR', conference: 'East', division: 'South', primary: '#0085CA', secondary: '#101820' },
  { id: 'chi', city: 'Chicago', name: 'Wind', abbrev: 'CHI', conference: 'West', division: 'North', primary: '#0B162A', secondary: '#C83803' },
  { id: 'cin', city: 'Cincinnati', name: 'Riverbend', abbrev: 'CIN', conference: 'East', division: 'North', primary: '#FB4F14', secondary: '#000000' },
  { id: 'cle', city: 'Cleveland', name: 'Lakefront', abbrev: 'CLE', conference: 'East', division: 'North', primary: '#311D00', secondary: '#FF3C00' },
  { id: 'dal', city: 'Dallas', name: 'Prairie', abbrev: 'DAL', conference: 'West', division: 'East', primary: '#003594', secondary: '#869397' },
  { id: 'den', city: 'Denver', name: 'Alpine', abbrev: 'DEN', conference: 'West', division: 'West', primary: '#FB4F14', secondary: '#002244' },
  { id: 'det', city: 'Detroit', name: 'Assembly', abbrev: 'DET', conference: 'West', division: 'North', primary: '#0076B6', secondary: '#B0B7BC' },
  { id: 'gb', city: 'Green Bay', name: 'Frost', abbrev: 'GB', conference: 'West', division: 'North', primary: '#203731', secondary: '#FFB612' },
  { id: 'hou', city: 'Houston', name: 'Bayou', abbrev: 'HOU', conference: 'East', division: 'South', primary: '#03202F', secondary: '#A71930' },
  { id: 'ind', city: 'Indianapolis', name: 'Circle', abbrev: 'IND', conference: 'East', division: 'South', primary: '#002C5F', secondary: '#A2AAAD' },
  { id: 'jax', city: 'Jacksonville', name: 'Atlantic', abbrev: 'JAX', conference: 'East', division: 'South', primary: '#006778', secondary: '#D7A22A' },
  { id: 'kc', city: 'Kansas City', name: 'Smoke', abbrev: 'KC', conference: 'West', division: 'West', primary: '#E31837', secondary: '#FFB81C' },
  { id: 'lv', city: 'Las Vegas', name: 'Mirage', abbrev: 'LV', conference: 'West', division: 'West', primary: '#000000', secondary: '#A5ACAF' },
  { id: 'lac', city: 'Los Angeles', name: 'Voltage', abbrev: 'LAC', conference: 'West', division: 'West', primary: '#0080C6', secondary: '#FFC20E' },
  { id: 'lar', city: 'Los Angeles', name: 'Canyon', abbrev: 'LAR', conference: 'West', division: 'West', primary: '#003594', secondary: '#FFA300' },
  { id: 'mia', city: 'Miami', name: 'Breeze', abbrev: 'MIA', conference: 'East', division: 'East', primary: '#008E97', secondary: '#FC4C02' },
  { id: 'min', city: 'Minnesota', name: 'Lakes', abbrev: 'MIN', conference: 'West', division: 'North', primary: '#4F2683', secondary: '#FFC62F' },
  { id: 'ne', city: 'New England', name: 'Granite', abbrev: 'NE', conference: 'East', division: 'East', primary: '#002244', secondary: '#C60C30' },
  { id: 'no', city: 'New Orleans', name: 'Delta', abbrev: 'NO', conference: 'East', division: 'South', primary: '#D3BC8D', secondary: '#101820' },
  { id: 'nyg', city: 'New York', name: 'Skyline', abbrev: 'NYG', conference: 'East', division: 'East', primary: '#0B2265', secondary: '#A71930' },
  { id: 'nyj', city: 'New York', name: 'Borough', abbrev: 'NYJ', conference: 'East', division: 'East', primary: '#125740', secondary: '#000000' },
  { id: 'phi', city: 'Philadelphia', name: 'Bell', abbrev: 'PHI', conference: 'East', division: 'East', primary: '#004C54', secondary: '#A5ACAF' },
  { id: 'pit', city: 'Pittsburgh', name: 'Allegheny', abbrev: 'PIT', conference: 'East', division: 'North', primary: '#FFB612', secondary: '#101820' },
  { id: 'sf', city: 'San Francisco', name: 'Bay', abbrev: 'SF', conference: 'West', division: 'West', primary: '#AA0000', secondary: '#B3995D' },
  { id: 'sea', city: 'Seattle', name: 'Rainier', abbrev: 'SEA', conference: 'West', division: 'West', primary: '#002244', secondary: '#69BE28' },
  { id: 'tb', city: 'Tampa Bay', name: 'Citrus', abbrev: 'TB', conference: 'East', division: 'South', primary: '#D50A0A', secondary: '#FF7900' },
  { id: 'ten', city: 'Tennessee', name: 'Smokies', abbrev: 'TEN', conference: 'East', division: 'South', primary: '#0C2340', secondary: '#4B92DB' },
  { id: 'was', city: 'Washington', name: 'Potomac', abbrev: 'WAS', conference: 'East', division: 'East', primary: '#5A1414', secondary: '#FFB612' },
];

export function teamDisplayName(team: Pick<Team, 'city' | 'name'>): string {
  return `${team.city} ${team.name}`;
}
