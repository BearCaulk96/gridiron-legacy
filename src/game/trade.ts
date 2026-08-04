import { getDifficulty } from './difficulty';
import { positionalNeed } from './ratings';
import {
  isOverCap,
  maxAllowedCap,
  playerCapHit,
  teamCapHit,
  refreshTeamCapHits,
} from './salary';
import type { DraftPick, LeagueState, Player, TradeAsset, TradeOffer } from './types';
import { playerName } from './generate';

export function assetValue(state: LeagueState, asset: TradeAsset, viewerTeamId: string): number {
  const cfg = getDifficulty(state.difficulty);
  if (asset.type === 'player' && asset.playerId) {
    const p = state.players[asset.playerId];
    if (!p) return 0;
    const agePenalty = p.age >= 29 ? (p.age - 28) * 3 : 0;
    const need = positionalNeed(state, viewerTeamId);
    const needBonus = Math.max(0, 8 - need.indexOf(p.position)) * 2;
    return p.overall * 1.4 + p.potential * 0.4 - agePenalty + needBonus - playerCapHit(p) / 8_000_000;
  }
  if (asset.type === 'pick' && asset.pick) {
    const yearFactor = 1 - (asset.pick.year - state.season) * 0.12;
    const roundValue = [0, 42, 28, 18, 12, 8, 5, 3][asset.pick.round] ?? 2;
    return roundValue * yearFactor * (0.9 + cfg.tradeGenerosity * 0.05);
  }
  return 0;
}

export function evaluateTrade(
  state: LeagueState,
  offer: TradeOffer,
): { accept: boolean; reason: string; theirGain: number; yourGain: number } {
  const cfg = getDifficulty(state.difficulty);
  const aiTeam = offer.toTeamId;

  const valueToAi =
    offer.offer.reduce((s, a) => s + assetValue(state, a, aiTeam), 0) -
    offer.request.reduce((s, a) => s + assetValue(state, a, aiTeam), 0);

  const threshold = 0 * cfg.aiTradeStrictness;
  // AI wants non-negative value after generosity adjustment
  const adjusted = valueToAi + (cfg.tradeGenerosity - 1) * 12;

  // Cap check for AI
  const aiCapDelta =
    offer.offer
      .filter((a) => a.type === 'player')
      .reduce((s, a) => s + playerCapHit(state.players[a.playerId!]!), 0) -
    offer.request
      .filter((a) => a.type === 'player')
      .reduce((s, a) => s + playerCapHit(state.players[a.playerId!]!), 0);

  if (teamCapHit(state, aiTeam) + aiCapDelta > maxAllowedCap(state) && cfg.capSoftPercent <= 1.05) {
    return {
      accept: false,
      reason: 'They would blow past the salary cap.',
      theirGain: adjusted,
      yourGain: -adjusted,
    };
  }

  if (adjusted < threshold) {
    return {
      accept: false,
      reason:
        cfg.id === 'veteran'
          ? 'They want more — stars cost premium picks on Veteran.'
          : cfg.id === 'casual'
            ? 'Even in Casual, this is too lopsided.'
            : 'Not enough value for their side.',
      theirGain: adjusted,
      yourGain: -adjusted,
    };
  }

  // Don't let AI give away their best player cheaply on higher difficulties
  const requestedStars = offer.request
    .filter((a) => a.type === 'player')
    .map((a) => state.players[a.playerId!])
    .filter(Boolean) as Player[];
  const topStar = requestedStars.sort((a, b) => b.overall - a.overall)[0];
  if (topStar && topStar.overall >= 88 && cfg.aiTradeStrictness >= 1 && adjusted < 8) {
    return {
      accept: false,
      reason: `${playerName(topStar)} is untouchable without a haul.`,
      theirGain: adjusted,
      yourGain: -adjusted,
    };
  }

  return {
    accept: true,
    reason: cfg.id === 'casual' ? 'They like the deal.' : 'Trade accepted.',
    theirGain: adjusted,
    yourGain: -adjusted,
  };
}

export function executeTrade(state: LeagueState, offer: TradeOffer): boolean {
  const result = evaluateTrade(state, offer);
  if (!result.accept) return false;

  const movePlayer = (playerId: string, toTeam: string) => {
    const p = state.players[playerId];
    if (!p) return;
    p.teamId = toTeam;
    p.morale = Math.min(99, p.morale + 2);
  };

  const movePick = (pick: DraftPick, toTeam: string) => {
    // Remove from current owner inventory and add to new owner
    for (const team of state.teams) {
      const idx = team.draftPicks.findIndex(
        (pk) =>
          pk.year === pick.year &&
          pk.round === pick.round &&
          pk.originalTeamId === pick.originalTeamId &&
          pk.ownerTeamId === pick.ownerTeamId,
      );
      if (idx >= 0) {
        team.draftPicks.splice(idx, 1);
        break;
      }
    }
    const dest = state.teams.find((t) => t.id === toTeam)!;
    dest.draftPicks.push({ ...pick, ownerTeamId: toTeam });
  };

  for (const asset of offer.offer) {
    if (asset.type === 'player' && asset.playerId) movePlayer(asset.playerId, offer.toTeamId);
    if (asset.type === 'pick' && asset.pick) movePick(asset.pick, offer.toTeamId);
  }
  for (const asset of offer.request) {
    if (asset.type === 'player' && asset.playerId) movePlayer(asset.playerId, offer.fromTeamId);
    if (asset.type === 'pick' && asset.pick) movePick(asset.pick, offer.fromTeamId);
  }

  refreshTeamCapHits(state);
  const from = state.teams.find((t) => t.id === offer.fromTeamId)!;
  const to = state.teams.find((t) => t.id === offer.toTeamId)!;
  state.messages.unshift(`Trade: ${from.abbrev} ⇄ ${to.abbrev} completed.`);
  return true;
}

export function canUserAffordIncoming(state: LeagueState, offer: TradeOffer): boolean {
  const incoming = offer.request
    .filter((a) => a.type === 'player')
    .reduce((s, a) => s + playerCapHit(state.players[a.playerId!]!), 0);
  const outgoing = offer.offer
    .filter((a) => a.type === 'player')
    .reduce((s, a) => s + playerCapHit(state.players[a.playerId!]!), 0);
  const projected = teamCapHit(state, state.userTeamId) + incoming - outgoing;
  return projected <= maxAllowedCap(state);
}

export function pickKey(p: DraftPick): string {
  return `${p.year}-R${p.round}-${p.originalTeamId}`;
}

export function formatPick(p: DraftPick): string {
  return `${p.year} Rd ${p.round} (${p.originalTeamId.toUpperCase()})`;
}

export function tradeDifficultyBlurb(difficulty: LeagueState['difficulty']): string {
  switch (difficulty) {
    case 'casual':
      return 'Partners are generous and will green-light slightly uneven deals.';
    case 'rookie':
      return 'AI expects roughly even value with a little room to negotiate.';
    case 'pro':
      return 'Teams trade to fill needs and protect the cap — bring fair offers.';
    case 'veteran':
      return 'Ruthless market. Stars demand premium draft capital.';
  }
}

export { isOverCap };
