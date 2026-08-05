import type { Phase } from './types';

export type CalendarMonth =
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December'
  | 'January'
  | 'February'
  | 'March';

export type CalendarKind =
  | 'freeAgency'
  | 'freeAgencyRecap'
  | 'scoutingReport'
  | 'scoutingReview'
  | 'draft'
  | 'draftRecap'
  | 'gmStadium'
  | 'gmCoaching'
  | 'coachWeek'
  | 'rest'
  | 'trainingCamp'
  | 'preseasonGame'
  | 'finalizeRoster'
  | 'regularSeason'
  | 'playoffWildcard'
  | 'playoffDivisional'
  | 'playoffConference'
  | 'hallOfFame'
  | 'superBowl'
  | 'seasonRecap'
  | 'retirements'
  | 'fillJobs'
  | 'contractNegotiations'
  | 'contractDeadline';

export type PlayNowAction =
  | 'freeAgency'
  | 'draft'
  | 'roster'
  | 'coaches'
  | 'gameday'
  | 'resolve'
  | 'standings'
  | 'contracts';

export interface CalendarSlot {
  index: number;
  month: CalendarMonth;
  weekOfMonth: 1 | 2 | 3 | 4;
  kind: CalendarKind;
  /** Full label for the week. */
  title: string;
  /** Short label for ticker cards. */
  shortTitle: string;
  phase: Phase;
  playAction: PlayNowAction;
  playLabel: string;
  /** Regular / preseason / playoff game week number on the schedule. */
  seasonWeek?: number;
  preseason?: boolean;
  playoff?: boolean;
  /** Training camp focus line. */
  detail?: string;
}

const MONTHS: CalendarMonth[] = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
];

type SlotDef = Omit<CalendarSlot, 'index' | 'month' | 'weekOfMonth'>;

function slot(
  kind: CalendarKind,
  title: string,
  shortTitle: string,
  phase: Phase,
  playAction: PlayNowAction,
  playLabel: string,
  extra: Partial<SlotDef> = {},
): SlotDef {
  return { kind, title, shortTitle, phase, playAction, playLabel, ...extra };
}

/** April → March, 4 weeks each (48 calendar weeks). */
const DEFS: SlotDef[] = [
  // April
  slot('freeAgency', 'Free Agency', 'Free Agency', 'freeAgency', 'freeAgency', 'OPEN MARKET'),
  slot('freeAgency', 'Free Agency', 'Free Agency', 'freeAgency', 'freeAgency', 'OPEN MARKET'),
  slot('freeAgency', 'Free Agency', 'Free Agency', 'freeAgency', 'freeAgency', 'OPEN MARKET'),
  slot('freeAgencyRecap', 'Free Agency Recap', 'FA Recap', 'freeAgency', 'resolve', 'FA RECAP'),
  // May
  slot('scoutingReport', 'Scouting Report', 'Scouting', 'scouting', 'draft', 'SCOUTING REPORT'),
  slot('scoutingReview', 'Scouting Review', 'Scout Review', 'scouting', 'draft', 'SCOUTING REVIEW'),
  slot('draft', 'Draft', 'Draft', 'draft', 'draft', 'DRAFT BOARD'),
  slot('draftRecap', 'Draft Recap', 'Draft Recap', 'draft', 'resolve', 'DRAFT RECAP'),
  // June
  slot('gmStadium', 'GM Week / Stadium and Sales', 'Stadium & Sales', 'gm', 'resolve', 'GM WEEK'),
  slot('gmCoaching', 'GM Week / Coaching Staff', 'Coaching Staff', 'gm', 'coaches', 'COACHING STAFF'),
  slot('coachWeek', 'Coach Week', 'Coach Week', 'coaching', 'coaches', 'COACH WEEK'),
  slot('rest', 'Rest', 'Rest', 'gm', 'resolve', 'REST WEEK'),
  // July
  slot(
    'trainingCamp',
    "Training Camp / QB's, RB's and WR's",
    'Camp · Skill',
    'trainingCamp',
    'resolve',
    'TRAINING CAMP',
    { detail: 'QB, RB, WR' },
  ),
  slot(
    'trainingCamp',
    "Training Camp / TE's and OL",
    'Camp · Line',
    'trainingCamp',
    'resolve',
    'TRAINING CAMP',
    { detail: 'TE, OL' },
  ),
  slot(
    'trainingCamp',
    "Training Camp / DE's, DT's and LB's",
    'Camp · Front',
    'trainingCamp',
    'resolve',
    'TRAINING CAMP',
    { detail: 'DL, LB' },
  ),
  slot(
    'trainingCamp',
    "Training Camp / FS's, SS's, CB's, Punters and Kickers",
    'Camp · Back',
    'trainingCamp',
    'resolve',
    'TRAINING CAMP',
    { detail: 'S, CB, P, K' },
  ),
  // August
  slot('preseasonGame', 'Preseason Game', 'Preseason', 'preseason', 'gameday', 'PRESEASON', {
    seasonWeek: 1,
    preseason: true,
  }),
  slot('preseasonGame', 'Preseason Game', 'Preseason', 'preseason', 'gameday', 'PRESEASON', {
    seasonWeek: 2,
    preseason: true,
  }),
  slot('preseasonGame', 'Preseason Game', 'Preseason', 'preseason', 'gameday', 'PRESEASON', {
    seasonWeek: 3,
    preseason: true,
  }),
  slot(
    'finalizeRoster',
    'Finalize 53 Roster and Elect Starters',
    'Cut to 53',
    'preseason',
    'roster',
    'SET ROSTER',
  ),
  // September — Regular Season 1–4
  ...[1, 2, 3, 4].map((w) =>
    slot('regularSeason', `Regular Season Week ${w}`, `RS Week ${w}`, 'regular', 'gameday', `WEEK ${w}`, {
      seasonWeek: w,
    }),
  ),
  // October — 5–8
  ...[5, 6, 7, 8].map((w) =>
    slot('regularSeason', `Regular Season Week ${w}`, `RS Week ${w}`, 'regular', 'gameday', `WEEK ${w}`, {
      seasonWeek: w,
    }),
  ),
  // November — 9–12
  ...[9, 10, 11, 12].map((w) =>
    slot('regularSeason', `Regular Season Week ${w}`, `RS Week ${w}`, 'regular', 'gameday', `WEEK ${w}`, {
      seasonWeek: w,
    }),
  ),
  // December — 13–16
  ...[13, 14, 15, 16].map((w) =>
    slot('regularSeason', `Regular Season Week ${w}`, `RS Week ${w}`, 'regular', 'gameday', `WEEK ${w}`, {
      seasonWeek: w,
    }),
  ),
  // January — 17–18 + playoffs
  slot('regularSeason', 'Regular Season Week 17', 'RS Week 17', 'regular', 'gameday', 'WEEK 17', {
    seasonWeek: 17,
  }),
  slot('regularSeason', 'Regular Season Week 18', 'RS Week 18', 'regular', 'gameday', 'WEEK 18', {
    seasonWeek: 18,
  }),
  slot('playoffWildcard', 'Playoffs Wildcard', 'Wildcard', 'playoffs', 'gameday', 'WILDCARD', {
    seasonWeek: 1,
    playoff: true,
  }),
  slot('playoffDivisional', 'Playoffs Divisional', 'Divisional', 'playoffs', 'gameday', 'DIVISIONAL', {
    seasonWeek: 2,
    playoff: true,
  }),
  // February
  slot(
    'playoffConference',
    'Playoffs Conference',
    'Conference',
    'playoffs',
    'resolve',
    'CONFERENCE CHAMPS',
    { seasonWeek: 3, playoff: true },
  ),
  slot('hallOfFame', 'Hall of Fame / Season Awards', 'Awards', 'awards', 'resolve', 'AWARDS NIGHT'),
  slot('superBowl', 'Super Bowl', 'Super Bowl', 'playoffs', 'gameday', 'SUPER BOWL', {
    seasonWeek: 4,
    playoff: true,
  }),
  slot('seasonRecap', 'Season Recap', 'Season Recap', 'awards', 'resolve', 'SEASON RECAP'),
  // March
  slot('retirements', 'Retirements', 'Retirements', 'offseason', 'resolve', 'RETIREMENTS'),
  slot('fillJobs', 'Filling Coach/GM Jobs', 'Fill Jobs', 'offseason', 'coaches', 'FILL JOBS'),
  slot(
    'contractNegotiations',
    'Contract Negotiations for Expiring Contracts',
    'Contracts',
    'offseason',
    'contracts',
    'NEGOTIATE',
  ),
  slot(
    'contractDeadline',
    'Last Chance for Contract Negotiations',
    'Deadline',
    'offseason',
    'contracts',
    'DEADLINE',
  ),
];

export const CALENDAR_LENGTH = 48;

export const YEAR_CALENDAR: CalendarSlot[] = DEFS.map((def, index) => ({
  ...def,
  index,
  month: MONTHS[Math.floor(index / 4)]!,
  weekOfMonth: ((index % 4) + 1) as 1 | 2 | 3 | 4,
}));

export function calendarSlot(index: number): CalendarSlot {
  const i = ((index % CALENDAR_LENGTH) + CALENDAR_LENGTH) % CALENDAR_LENGTH;
  return YEAR_CALENDAR[i]!;
}

export function currentCalendar(state: { calendarIndex: number }): CalendarSlot {
  return calendarSlot(state.calendarIndex);
}

export function formatCalendarLabel(slot: CalendarSlot, season: number): string {
  // Cross-year label: Apr–Dec use season year; Jan–Mar use season+1
  const year =
    slot.month === 'January' || slot.month === 'February' || slot.month === 'March'
      ? season + 1
      : season;
  return `${slot.month} ${year} · Week ${slot.weekOfMonth}`;
}

export function calendarCardLabel(slot: CalendarSlot): string {
  return `${slot.month.slice(0, 3).toUpperCase()} W${slot.weekOfMonth}`;
}

/** First calendar index for regular season week 1 (September week 1). */
export const REGULAR_SEASON_START_INDEX = YEAR_CALENDAR.findIndex(
  (s) => s.kind === 'regularSeason' && s.seasonWeek === 1,
);

export const FREE_AGENCY_START_INDEX = 0;
