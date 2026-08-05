import { useMemo, useState } from 'react';
import type { ContractOfferTerms, LeagueState, Player } from '../game/types';
import { currentCalendar, formatCalendarLabel } from '../game/calendar';
import {
  defaultOfferFromDemand,
  expiringPlayers,
  resignInterest,
} from '../game/contracts';
import { playerName } from '../game/generate';
import { formatMoney, formatCapSpace } from '../game/salary';
import { contractDemand, interestLabel } from '../game/freeAgencyMarket';
import { TeamLogo } from './TeamLogo';
import { ContractOfferForm } from './ContractOfferForm';

interface Props {
  state: LeagueState;
  onResign: (playerId: string, offer: ContractOfferTerms) => void;
  onBack: () => void;
}

export function Contracts({ state, onResign, onBack }: Props) {
  const cal = currentCalendar(state);
  const open = cal.kind === 'contractNegotiations' || cal.kind === 'contractDeadline';
  const team = state.teams.find((t) => t.id === state.userTeamId)!;
  const list = useMemo(() => expiringPlayers(state), [state]);
  const [selectedId, setSelectedId] = useState<string | null>(list[0]?.id ?? null);
  const selected: Player | null = selectedId ? state.players[selectedId] ?? null : null;
  const demand = selected ? contractDemand(selected) : null;
  const interest = selected ? resignInterest(state, selected) : 1;

  return (
    <div className="fa-root contracts-root">
      <header className="fa-top fa-top-compact">
        <button type="button" className="btn btn-ghost fa-back" onClick={onBack}>
          Office
        </button>
        <div className="fa-title-block">
          <p className="fa-eyebrow">{formatCalendarLabel(cal, state.season)}</p>
          <h2>CONTRACTS</h2>
        </div>
        <div className="fa-cap-chip">
          <TeamLogo team={team} size={22} />
          <span>{formatCapSpace(state, team.id)}</span>
        </div>
      </header>

      <p className="contracts-intro">
        {open
          ? 'Players in the final year of their deal. Build an extension — years, annual salary, and signing bonus.'
          : 'Contract negotiations are closed this week. Return during March negotiation weeks.'}
      </p>

      <div className="contracts-layout">
        <section className="contracts-list" aria-label="Expiring contracts">
          {!list.length && (
            <p className="fa-empty">No players on your roster are in the final year of a contract.</p>
          )}
          {list.map((p) => {
            const d = contractDemand(p);
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                className={`contracts-row ${active ? 'selected' : ''}`}
                onClick={() => setSelectedId(p.id)}
              >
                <span className="contracts-row-id">
                  <strong>
                    {p.position} {playerName(p)}
                  </strong>
                  <small>
                    OVR {p.overall} · Age {p.age} · Asking {formatMoney(d.annualSalary)}/yr
                  </small>
                </span>
                <span className="contracts-row-ask">
                  {d.years} yr · {formatMoney(d.signingBonus)} SB
                </span>
              </button>
            );
          })}
        </section>

        <aside className="fa-detail contracts-detail">
          {selected && demand ? (
            <>
              <div className="fa-detail-head">
                <div className="fa-detail-id">
                  <h3>{playerName(selected)}</h3>
                  <p>
                    {selected.position} · Age {selected.age} · OVR {selected.overall}
                  </p>
                  <p>{interestLabel(interest)}</p>
                </div>
              </div>

              <div className="fa-contract-box">
                <h4>WHAT HE WANTS</h4>
                <dl>
                  <div>
                    <dt>Years</dt>
                    <dd>{demand.years}</dd>
                  </div>
                  <div>
                    <dt>Annual</dt>
                    <dd>{formatMoney(demand.annualSalary)}</dd>
                  </div>
                  <div>
                    <dt>Signing Bonus</dt>
                    <dd>{formatMoney(demand.signingBonus)}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{formatMoney(demand.totalValue)}</dd>
                  </div>
                </dl>
              </div>

              <ContractOfferForm
                key={selected.id}
                state={state}
                player={selected}
                resigning
                disabled={!open}
                disabledReason="NEGOTIATIONS CLOSED"
                onSubmit={(offer) => onResign(selected.id, offer)}
              />
              <p className="contracts-hint">
                Default ask: {defaultOfferFromDemand(selected).years} yr /{' '}
                {formatMoney(defaultOfferFromDemand(selected).annualSalary)}. High interest may
                take less; a big overpay can still land a reluctant vet.
              </p>
            </>
          ) : (
            <p className="fa-empty">Select an expiring player to negotiate.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
