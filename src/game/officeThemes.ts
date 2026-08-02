import { TEAM_TEMPLATES } from './teams';
import type { Team } from './types';

export type OfficeStyle = 'classic-wood' | 'modern-glass' | 'industrial' | 'coastal' | 'neon' | 'rustic' | 'marble';

export interface OfficeTheme {
  teamId: string;
  banner: string;
  style: OfficeStyle;
  skyline: string;
  wood: string;
  panel: string;
  glow: string;
  /** Optional photographic office backdrop in /public/offices/{id}.jpg */
  hasArt: boolean;
  tagline: string;
}

const STYLE_BY_ID: Record<string, OfficeStyle> = {
  pit: 'classic-wood',
  cle: 'industrial',
  cin: 'classic-wood',
  bal: 'industrial',
  bos: 'classic-wood',
  nyc: 'marble',
  mia: 'coastal',
  buf: 'classic-wood',
  jax: 'coastal',
  nas: 'rustic',
  hou: 'modern-glass',
  ind: 'modern-glass',
  lv: 'neon',
  sd: 'coastal',
  den: 'modern-glass',
  kc: 'classic-wood',
  chi: 'industrial',
  det: 'industrial',
  gb: 'rustic',
  min: 'classic-wood',
  dal: 'classic-wood',
  phi: 'classic-wood',
  was: 'marble',
  ric: 'classic-wood',
  sea: 'modern-glass',
  cal: 'modern-glass',
  la: 'neon',
  ari: 'industrial',
  atl: 'modern-glass',
  car: 'coastal',
  tb: 'coastal',
  no: 'marble',
};

const SKYLINE: Record<string, string> = {
  pit: 'Bridges and river steel towers',
  cle: 'Lakefront industrial towers',
  cin: 'Riverbend skyline',
  bal: 'Harbor cranes and ships',
  bos: 'Harbor and brick towers',
  nyc: 'Skyscraper canyon',
  mia: 'Ocean and palm coastline',
  buf: 'Snowbound waterfront',
  jax: 'Atlantic riverfront',
  nas: 'Music City skyline',
  hou: 'Glass towers and bayou haze',
  ind: 'Speedway city skyline',
  lv: 'Neon desert strip',
  sd: 'Bay and pier lights',
  den: 'Peaks beyond the city',
  kc: 'Fountain city skyline',
  chi: 'Wind-cut lake towers',
  det: 'River motors skyline',
  gb: 'Frozen stadium town',
  min: 'Lakes and northern towers',
  dal: 'Wide Texas skyline',
  phi: 'Liberty skyline',
  was: 'Monument skyline',
  ric: 'River capital skyline',
  sea: 'Needle in the mist',
  cal: 'Golden hills and bay',
  la: 'Palm boulevard lights',
  ari: 'Desert ridge skyline',
  atl: 'Southern glass towers',
  car: 'Coastal pines skyline',
  tb: 'Gulf bay skyline',
  no: 'French Quarter roofs',
};

const TAGLINE: Record<string, string> = {
  pit: 'Forged in black & gold.',
  cle: 'Turn it up loud.',
  cin: 'Steer the river.',
  bal: 'Command the harbor.',
  bos: 'Haunt the standings.',
  nyc: 'Raise the torch.',
  mia: 'Ride the storm.',
  buf: 'Winter is an advantage.',
  jax: 'Snap from the coast.',
  nas: 'Roar on Music Row.',
  hou: 'Launch the dynasty.',
  ind: 'Green flag football.',
  lv: 'Hunt under neon.',
  sd: 'Calm claws, sharp play.',
  den: 'Own the altitude.',
  kc: 'Thunder on the plains.',
  chi: 'Burn the tape.',
  det: 'Built to last.',
  gb: 'Chop wood, win games.',
  min: 'North never folds.',
  dal: 'Ride for the star.',
  phi: 'Bell rings for winners.',
  was: 'Stand watch.',
  ric: 'Rebel and rebuild.',
  sea: 'Cut emerald clean.',
  cal: 'Soar over the bay.',
  la: 'Chase every spotlight.',
  ari: 'Strike first.',
  atl: 'Rise again.',
  car: 'Ride the break.',
  tb: 'Rule the gulf.',
  no: 'Spellbound Sundays.',
};

/** Teams with dedicated generated office art under public/offices. */
export const OFFICE_ART_IDS = new Set(TEAM_TEMPLATES.map((t) => t.id));

export function getOfficeTheme(team: Pick<Team, 'id' | 'name' | 'primary' | 'secondary' | 'accent'>): OfficeTheme {
  const style = STYLE_BY_ID[team.id] ?? 'classic-wood';
  return {
    teamId: team.id,
    banner: team.name.replace(/\s+/g, ' ').toUpperCase(),
    style,
    skyline: SKYLINE[team.id] ?? 'City skyline',
    wood: team.primary,
    panel: `color-mix(in srgb, ${team.primary} 72%, #000 28%)`,
    glow: team.secondary,
    hasArt: OFFICE_ART_IDS.has(team.id),
    tagline: TAGLINE[team.id] ?? 'Build the dynasty.',
  };
}

export function allOfficeThemes(): OfficeTheme[] {
  return TEAM_TEMPLATES.map((t) => getOfficeTheme(t));
}
