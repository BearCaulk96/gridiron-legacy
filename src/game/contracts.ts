import type { Contract, ContractOfferTerms, LeagueState, Player } from './types';
import { contractDemand, interestInTeam, schemeFit, type Interest } from './freeAgencyMarket';
import { VETERAN_MINIMUM, formatMoney, playerCapHit } from './salary';

export function offerCapHit(offer: ContractOfferTerms): number {
  const years = Math.max(1, offer.years);
  return offer.annualSalary + Math.round(offer.signingBonus / years);
}

export function offerTotalValue(offer: ContractOfferTerms): number {
  return offer.annualSalary * offer.years + offer.signingBonus;
}

export function defaultOfferFromDemand(player: Player): ContractOfferTerms {
  const d = contractDemand(player);
  return {
    years: d.years,
    annualSalary: d.annualSalary,
    signingBonus: d.signingBonus,
  };
}

/** Interest when extending an expiring player already on the roster. */
export function resignInterest(state: LeagueState, player: Player): Interest {
  const team = state.teams.find((t) => t.id === state.userTeamId)!;
  const winPct = (team.wins + team.ties * 0.5) / Math.max(1, team.wins + team.losses + team.ties);
  let score = 1;
  if (player.morale >= 70) score += 1;
  else if (player.morale >= 50) score += 0.5;
  if (winPct >= 0.55 || team.wins >= 10) score += 1;
  if (schemeFit(state, player) >= 70) score += 0.5;
  if (player.overall >= 90) score -= 0.5; // stars push for market
  if (player.age >= 32) score += 0.5; // want security / familiar home
  if (score >= 2.5) return 3;
  if (score <= 1.2) return 1;
  return 2;
}

export function roundMoney(n: number, step = 50_000): number {
  return Math.round(n / step) * step;
}

export interface OfferVerdict {
  accept: boolean;
  message: string;
  /** Soft UI hint before submitting. */
  lean: 'likely' | 'possible' | 'unlikely';
  score: number;
  threshold: number;
}

/**
 * Decide if a player takes the deal.
 * High interest can accept below asking; low interest needs an overpay.
 * A fat enough overpay can still buy a reluctant player.
 */
export function evaluateContractOffer(
  state: LeagueState,
  player: Player,
  offer: ContractOfferTerms,
  opts: { resigning?: boolean } = {},
): OfferVerdict {
  if (offer.years < 1 || offer.years > 7) {
    return {
      accept: false,
      message: 'Contracts must be between 1 and 7 years.',
      lean: 'unlikely',
      score: 0,
      threshold: 1,
    };
  }
  if (offer.annualSalary < Math.round(VETERAN_MINIMUM * 0.9)) {
    return {
      accept: false,
      message: `Annual salary must be at least ${formatMoney(Math.round(VETERAN_MINIMUM * 0.9))}.`,
      lean: 'unlikely',
      score: 0,
      threshold: 1,
    };
  }
  if (offer.signingBonus < 0) {
    return {
      accept: false,
      message: 'Signing bonus cannot be negative.',
      lean: 'unlikely',
      score: 0,
      threshold: 1,
    };
  }

  const demand = contractDemand(player);
  const interest = opts.resigning ? resignInterest(state, player) : interestInTeam(state, player);

  const salaryRatio = offer.annualSalary / Math.max(1, demand.annualSalary);
  const bonusRatio = offer.signingBonus / Math.max(1, demand.signingBonus);
  const totalRatio = offerTotalValue(offer) / Math.max(1, demand.totalValue);
  const yearsDelta = offer.years - demand.years;

  let score = salaryRatio * 0.5 + bonusRatio * 0.25 + totalRatio * 0.25;

  if (yearsDelta === 0) score += 0.04;
  else if (yearsDelta > 0 && player.age <= 28) score += 0.05;
  else if (yearsDelta < 0 && player.age >= 30) score += 0.04;
  else if (Math.abs(yearsDelta) >= 2) score -= 0.08;

  if (opts.resigning) {
    score += 0.04;
    if (player.morale >= 70) score += 0.05;
  }

  // Interest sets how close to asking you must get
  let threshold = interest === 3 ? 0.84 : interest === 2 ? 0.96 : 1.1;

  // Hometown / scheme discount already baked into interest; big money can buy low interest
  if (interest === 1 && totalRatio >= 1.2) score += 0.14;
  if (interest === 3 && totalRatio >= 0.78) score += 0.05;

  const lean: OfferVerdict['lean'] =
    score >= threshold + 0.06 ? 'likely' : score >= threshold - 0.05 ? 'possible' : 'unlikely';

  if (score >= threshold) {
    let message = 'Offer accepted.';
    if (salaryRatio < 0.92 && interest >= 3) {
      message = 'Accepted — he wanted your team enough to take less than market.';
    } else if (totalRatio >= 1.12 && interest <= 2) {
      message = 'Accepted — the bigger paycheck outweighed his doubts.';
    } else if (opts.resigning && salaryRatio < 0.95) {
      message = 'Re-signed — loyalty and familiarity closed the gap.';
    }
    return { accept: true, message, lean, score, threshold };
  }

  if (salaryRatio < 0.85) {
    return {
      accept: false,
      message: `He wants closer to ${formatMoney(demand.annualSalary)} per year.`,
      lean,
      score,
      threshold,
    };
  }
  if (bonusRatio < 0.65) {
    return {
      accept: false,
      message: `He wants a larger signing bonus (asking ${formatMoney(demand.signingBonus)}).`,
      lean,
      score,
      threshold,
    };
  }
  if (interest === 1) {
    return {
      accept: false,
      message: 'Low interest — overpay on salary or bonus to change his mind.',
      lean,
      score,
      threshold,
    };
  }
  return {
    accept: false,
    message: 'He declined. Nudge years, AAV, or the signing bonus closer to his ask.',
    lean,
    score,
    threshold,
  };
}

export function buildContract(offer: ContractOfferTerms, player: Player): Contract {
  const years = Math.max(1, Math.min(7, Math.round(offer.years)));
  const annualSalary = roundMoney(Math.max(0, offer.annualSalary));
  const signingBonus = roundMoney(Math.max(0, offer.signingBonus));
  return {
    years,
    annualSalary,
    signingBonus,
    guaranteed: Math.round(annualSalary * years * (player.overall >= 85 ? 0.55 : 0.35) + signingBonus),
    yearsRemaining: years,
  };
}

export function expiringPlayers(state: LeagueState, teamId: string = state.userTeamId): Player[] {
  return Object.values(state.players)
    .filter(
      (p) =>
        p.teamId === teamId &&
        !p.isProspect &&
        p.contract &&
        p.contract.yearsRemaining === 1,
    )
    .sort((a, b) => b.overall - a.overall);
}

export function leanLabel(lean: OfferVerdict['lean']): string {
  if (lean === 'likely') return 'Likely to accept';
  if (lean === 'possible') return 'On the fence';
  return 'Likely to decline';
}

/** Cap delta if replacing an existing contract (re-sign) or adding a new one (FA). */
export function projectedCapAfterOffer(
  state: LeagueState,
  player: Player,
  offer: ContractOfferTerms,
): number {
  const currentHit = player.teamId === state.userTeamId ? playerCapHit(player) : 0;
  return offerCapHit(offer) - currentHit;
}
