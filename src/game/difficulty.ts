import type { Difficulty, DifficultyConfig } from './types';

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  casual: {
    id: 'casual',
    label: 'Casual',
    tagline: 'Build freely. Win often.',
    description:
      'Soft salary cap, crystal-clear draft boards, generous trade partners, and a friendly sim. Perfect for learning the ropes without grind.',
    capSoftPercent: 1.15,
    tradeGenerosity: 1.22,
    simUserBoost: 8,
    injuryRate: 0.035,
    draftFog: 0,
    freeScoutedProspects: 999,
    showProspectOverall: true,
    showProspectPotential: true,
    schemeMatter: 0.15,
    aiTradeStrictness: 0.65,
    developmentBonus: 1.35,
  },
  rookie: {
    id: 'rookie',
    label: 'Rookie',
    tagline: 'Guided dynasty with real stakes.',
    description:
      'Draft grades replace raw ratings, trades stay fair, and the cap warns before it bites. A balanced intro to franchise management.',
    capSoftPercent: 1.05,
    tradeGenerosity: 1.08,
    simUserBoost: 3,
    injuryRate: 0.055,
    draftFog: 0.25,
    freeScoutedProspects: 40,
    showProspectOverall: false,
    showProspectPotential: true,
    schemeMatter: 0.35,
    aiTradeStrictness: 0.85,
    developmentBonus: 1.1,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    tagline: 'Scheme, scouting, and cap discipline.',
    description:
      'Hard salary cap, foggy prospect boards until you scout, need-based trade AI, and scheme fit that swings games.',
    capSoftPercent: 1.0,
    tradeGenerosity: 0.98,
    simUserBoost: 0,
    injuryRate: 0.075,
    draftFog: 0.55,
    freeScoutedProspects: 12,
    showProspectOverall: false,
    showProspectPotential: false,
    schemeMatter: 0.7,
    aiTradeStrictness: 1.05,
    developmentBonus: 1.0,
  },
  veteran: {
    id: 'veteran',
    label: 'Veteran',
    tagline: 'Every decision can make or break a dynasty.',
    description:
      'Ruthless trade market, heavy draft uncertainty, tight cap with real dead money, injuries, and coaching IQ deciding close games.',
    capSoftPercent: 1.0,
    tradeGenerosity: 0.9,
    simUserBoost: -2,
    injuryRate: 0.1,
    draftFog: 0.8,
    freeScoutedProspects: 4,
    showProspectOverall: false,
    showProspectPotential: false,
    schemeMatter: 1.0,
    aiTradeStrictness: 1.25,
    developmentBonus: 0.85,
  },
};

export function getDifficulty(id: Difficulty): DifficultyConfig {
  return DIFFICULTIES[id];
}
