import { useEffect, useMemo, useState } from 'react';
import type { ContractOfferTerms, LeagueState, Player } from '../game/types';
import {
  defaultOfferFromDemand,
  evaluateContractOffer,
  leanLabel,
  offerCapHit,
  offerTotalValue,
  roundMoney,
} from '../game/contracts';
import { formatMoney, playerCapHit, teamCapSpace } from '../game/salary';

interface Props {
  state: LeagueState;
  player: Player;
  resigning?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onSubmit: (offer: ContractOfferTerms) => void;
}

export function ContractOfferForm({
  state,
  player,
  resigning = false,
  disabled = false,
  disabledReason,
  onSubmit,
}: Props) {
  const seed = useMemo(() => defaultOfferFromDemand(player), [player.id]);
  const [years, setYears] = useState(seed.years);
  const [annual, setAnnual] = useState(seed.annualSalary);
  const [bonus, setBonus] = useState(seed.signingBonus);

  useEffect(() => {
    setYears(seed.years);
    setAnnual(seed.annualSalary);
    setBonus(seed.signingBonus);
  }, [seed.years, seed.annualSalary, seed.signingBonus, player.id]);

  const offer: ContractOfferTerms = {
    years,
    annualSalary: annual,
    signingBonus: bonus,
  };

  const verdict = evaluateContractOffer(state, player, offer, { resigning });
  const newHit = offerCapHit(offer);
  const oldHit = resigning && player.teamId === state.userTeamId ? playerCapHit(player) : 0;
  const space = teamCapSpace(state, state.userTeamId);
  const overCap =
    Number.isFinite(space) && space < 1e14 && newHit - oldHit > space;

  const nudgeAnnual = (delta: number) => setAnnual((v) => Math.max(0, roundMoney(v + delta)));
  const nudgeBonus = (delta: number) => setBonus((v) => Math.max(0, roundMoney(v + delta)));

  return (
    <div className="offer-form">
      <h4>{resigning ? 'EXTENSION OFFER' : 'YOUR OFFER'}</h4>

      <label className="offer-field">
        <span>Contract Years</span>
        <div className="offer-stepper">
          <button type="button" onClick={() => setYears((y) => Math.max(1, y - 1))} aria-label="Fewer years">
            −
          </button>
          <strong>{years}</strong>
          <button type="button" onClick={() => setYears((y) => Math.min(7, y + 1))} aria-label="More years">
            +
          </button>
        </div>
      </label>

      <label className="offer-field">
        <span>Annual Salary (AAV)</span>
        <div className="offer-money-row">
          <button type="button" onClick={() => nudgeAnnual(-250_000)}>
            −250K
          </button>
          <input
            type="number"
            min={0}
            step={50_000}
            value={annual}
            onChange={(e) => setAnnual(Math.max(0, Number(e.target.value) || 0))}
          />
          <button type="button" onClick={() => nudgeAnnual(250_000)}>
            +250K
          </button>
        </div>
        <small>{formatMoney(annual)} / year</small>
      </label>

      <label className="offer-field">
        <span>Signing Bonus</span>
        <div className="offer-money-row">
          <button type="button" onClick={() => nudgeBonus(-250_000)}>
            −250K
          </button>
          <input
            type="number"
            min={0}
            step={50_000}
            value={bonus}
            onChange={(e) => setBonus(Math.max(0, Number(e.target.value) || 0))}
          />
          <button type="button" onClick={() => nudgeBonus(250_000)}>
            +250K
          </button>
        </div>
        <small>{formatMoney(bonus)} total · ~{formatMoney(Math.round(bonus / Math.max(1, years)))} / yr on cap</small>
      </label>

      <dl className="offer-summary">
        <div>
          <dt>Total Value</dt>
          <dd>{formatMoney(offerTotalValue(offer))}</dd>
        </div>
        <div>
          <dt>Cap Hit / Year</dt>
          <dd>{formatMoney(newHit)}</dd>
        </div>
      </dl>

      <p className={`offer-lean lean-${verdict.lean}`}>{leanLabel(verdict.lean)}</p>

      <button
        type="button"
        className="fa-offer"
        disabled={disabled || overCap}
        onClick={() =>
          onSubmit({
            years,
            annualSalary: roundMoney(annual),
            signingBonus: roundMoney(bonus),
          })
        }
      >
        {disabled
          ? disabledReason ?? 'CLOSED'
          : overCap
            ? 'OVER THE CAP'
            : resigning
              ? 'SUBMIT EXTENSION'
              : 'SUBMIT OFFER'}
      </button>
    </div>
  );
}
