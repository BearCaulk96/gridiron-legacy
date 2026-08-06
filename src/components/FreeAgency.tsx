import { useMemo, useState, type CSSProperties } from 'react';
import type { ContractOfferTerms, LeagueState, Position } from '../game/types';
import { currentCalendar, formatCalendarLabel } from '../game/calendar';
import { visibleTraitGrades } from '../game/draft';
import { playerName } from '../game/generate';
import { freeAgents, formatCapSpace, formatMoney } from '../game/salary';
import { userTeam } from '../game/season';
import { ensurePlayerTraits } from '../game/traits';
import {
  FA_POSITION_TABS,
  contractDemand,
  interestInTeam,
  interestLabel,
  interestMotivations,
  matchesPositionTab,
  type Interest,
} from '../game/freeAgencyMarket';
import { ContractOfferForm } from './ContractOfferForm';

interface Props {
  state: LeagueState;
  onSign: (id: string, offer: ContractOfferTerms) => void;
  onFinish: () => void;
  onBack: () => void;
}

function Stars({ level }: { level: Interest }) {
  const color = level === 3 ? '#3ddc84' : level === 2 ? '#f0a202' : '#e63946';
  return (
    <span className="fa-stars" style={{ color }} aria-label={`${level} star interest`}>
      {'★'.repeat(level)}
      <span className="fa-stars-empty">{'★'.repeat(3 - level)}</span>
    </span>
  );
}

export function FreeAgency({ state, onSign, onFinish, onBack }: Props) {
  const team = userTeam(state);
  const cal = currentCalendar(state);
  const capLabel = formatCapSpace(state, team.id);
  const open = state.phase === 'freeAgency';

  const [posTab, setPosTab] = useState<Position | 'ALL' | 'DB'>('ALL');
  const [negotiateId, setNegotiateId] = useState<string | null>(null);

  const agents = useMemo(() => {
    const list = freeAgents(state);
    for (const p of list) ensurePlayerTraits(p);
    return list;
  }, [state]);

  const filtered = useMemo(
    () => agents.filter((p) => matchesPositionTab(p, posTab)),
    [agents, posTab],
  );

  const negotiating = negotiateId ? (state.players[negotiateId] ?? null) : null;
  // Only negotiate unsigned free agents still on the board
  const activeDeal =
    negotiating && !negotiating.teamId && !negotiating.isProspect ? negotiating : null;

  if (activeDeal) {
    const demand = contractDemand(activeDeal);
    const interest = interestInTeam(state, activeDeal);
    const traits = visibleTraitGrades(state, activeDeal);

    return (
      <div
        className="fa-root fa-negotiate"
        style={
          {
            '--fa-primary': team.primary,
            '--fa-secondary': team.secondary,
            '--fa-accent': team.accent,
          } as CSSProperties
        }
      >
        <header className="fa-neg-top">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setNegotiateId(null)}>
            ← Agents
          </button>
          <div className="fa-neg-title">
            <p className="fa-eyebrow">Negotiation</p>
            <h2>{playerName(activeDeal)}</h2>
          </div>
          <span className="fa-cap-chip">{capLabel}</span>
        </header>

        <div className="fa-neg-scroll">
          <section className="fa-neg-player">
            <div className="fa-neg-id">
              <strong>
                {activeDeal.position} · Age {activeDeal.age}
              </strong>
              <div className="fa-neg-ratings">
                <span>
                  <small>OVR</small>
                  <b>{activeDeal.overall}</b>
                </span>
                <span>
                  <small>POT</small>
                  <b>{activeDeal.potential}</b>
                </span>
              </div>
            </div>
            <div className="fa-neg-traits" aria-label="Traits">
              {traits.map((t) => (
                <span key={t.key} className="fa-trait-chip">
                  <small>{t.key}</small>
                  <strong>{t.grade}</strong>
                </span>
              ))}
            </div>
            <div className="fa-neg-interest">
              <p>{interestLabel(interest)}</p>
              <Stars level={interest} />
              <ul>
                {interestMotivations(state, activeDeal, interest).map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="fa-contract-box">
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
          </section>

          <ContractOfferForm
            key={activeDeal.id}
            state={state}
            player={activeDeal}
            disabled={!open}
            disabledReason="FREE AGENCY CLOSED"
            onSubmit={(offer) => {
              onSign(activeDeal.id, offer);
              setNegotiateId(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fa-root fa-list-mode"
      style={
        {
          '--fa-primary': team.primary,
          '--fa-secondary': team.secondary,
          '--fa-accent': team.accent,
        } as CSSProperties
      }
    >
      <header className="fa-list-top">
        <button type="button" className="btn btn-ghost btn-small" onClick={onBack}>
          ← Office
        </button>
        <div className="fa-list-heading">
          <h1>Available Free Agents</h1>
          <p>
            {formatCalendarLabel(cal, state.season)} · {filtered.length} players · Cap {capLabel}
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-small" onClick={onFinish} disabled={!open}>
          Advance
        </button>
      </header>

      <nav className="fa-pos-strip" aria-label="Filter by position">
        {FA_POSITION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={posTab === tab.id ? 'active' : ''}
            onClick={() => setPosTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="fa-agent-list" role="list">
        {!filtered.length && (
          <p className="fa-empty">No free agents available{posTab !== 'ALL' ? ' at this position' : ''}.</p>
        )}
        {filtered.map((p) => {
          const interest = interestInTeam(state, p);
          const traits = visibleTraitGrades(state, p);
          return (
            <button
              key={p.id}
              type="button"
              className="fa-agent-row"
              role="listitem"
              onClick={() => setNegotiateId(p.id)}
            >
              <div className="fa-agent-main">
                <strong className="fa-agent-name">{playerName(p)}</strong>
                <span className="fa-agent-meta">
                  {p.position} · Age {p.age}
                </span>
              </div>

              <div className="fa-agent-ratings" aria-label="Ratings">
                <span>
                  <small>OVR</small>
                  <b>{p.overall}</b>
                </span>
                <span>
                  <small>POT</small>
                  <b>{p.potential}</b>
                </span>
              </div>

              <div className="fa-agent-traits" aria-label="Traits">
                {traits.map((t) => (
                  <span key={t.key} title={t.key}>
                    {t.grade}
                  </span>
                ))}
              </div>

              <div className="fa-agent-interest">
                <Stars level={interest} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
