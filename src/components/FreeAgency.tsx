import { useMemo, useState, type CSSProperties } from 'react';
import type { LeagueState, Player, Position } from '../game/types';
import { currentCalendar } from '../game/calendar';
import { playerName } from '../game/generate';
import { positionalNeed } from '../game/ratings';
import { freeAgents, formatCapSpace, formatMoney } from '../game/salary';
import { userTeam } from '../game/season';
import {
  FA_POSITION_TABS,
  contractDemand,
  displayAttributes,
  fitTone,
  interestInTeam,
  interestLabel,
  interestMotivations,
  matchesPositionTab,
  ovrTone,
  playerBio,
  progressionOf,
  schemeFit,
  type Interest,
  type Progression,
} from '../game/freeAgencyMarket';
interface Props {
  state: LeagueState;
  onSign: (id: string) => void;
  onFinish: () => void;
  onBack: () => void;
}

type OvrFilter = 'ALL' | '90+' | '80-89' | '70-79' | '<70';
type AgeFilter = 'ALL' | '21-25' | '26-29' | '30+';
type ProgFilter = 'ALL' | Progression;
type InterestFilter = 'ALL' | Interest;

function Stars({ level }: { level: Interest }) {
  const color = level === 3 ? '#3dDC84' : level === 2 ? '#f0a202' : '#e63946';
  return (
    <span className="fa-stars" style={{ color }} aria-label={`${level} star interest`}>
      {'★'.repeat(level)}
      <span className="fa-stars-empty">{'★'.repeat(3 - level)}</span>
    </span>
  );
}

function FitRing({ fit }: { fit: number }) {
  const tone = fitTone(fit);
  const deg = Math.round((fit / 100) * 360);
  return (
    <span
      className={`fa-fit fa-fit-${tone}`}
      style={{ '--fit-deg': `${deg}deg` } as CSSProperties}
      title={`${fit}% scheme fit`}
    />
  );
}

function Portrait({ player }: { player: Player }) {
  const initials = `${player.firstName[0] ?? ''}${player.lastName[0] ?? ''}`;
  const hue = (player.overall * 17 + player.age * 11) % 360;
  return (
    <div
      className="fa-portrait"
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 28% 28%), hsl(${(hue + 40) % 360} 35% 14%))`,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

function AttrBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="fa-attr">
      <div className="fa-attr-top">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="fa-attr-track">
        <div
          className={`fa-attr-fill tone-${ovrTone(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function FreeAgency({ state, onSign, onFinish, onBack }: Props) {
  const team = userTeam(state);
  const cal = currentCalendar(state);
  const capLabel = formatCapSpace(state, team.id);
  const needs = positionalNeed(state, team.id).slice(0, 4);

  const [posTab, setPosTab] = useState<Position | 'ALL' | 'DB'>('ALL');
  const [posFilter, setPosFilter] = useState<Position | 'ALL'>('ALL');
  const [ovrFilter, setOvrFilter] = useState<OvrFilter>('ALL');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('ALL');
  const [progFilter, setProgFilter] = useState<ProgFilter>('ALL');
  const [interestFilter, setInterestFilter] = useState<InterestFilter>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const agents = useMemo(() => freeAgents(state), [state]);

  const filtered = useMemo(() => {
    return agents.filter((p) => {
      if (!matchesPositionTab(p, posTab)) return false;
      if (posFilter !== 'ALL' && p.position !== posFilter) return false;
      if (ovrFilter === '90+' && p.overall < 90) return false;
      if (ovrFilter === '80-89' && (p.overall < 80 || p.overall > 89)) return false;
      if (ovrFilter === '70-79' && (p.overall < 70 || p.overall > 79)) return false;
      if (ovrFilter === '<70' && p.overall >= 70) return false;
      if (ageFilter === '21-25' && (p.age < 21 || p.age > 25)) return false;
      if (ageFilter === '26-29' && (p.age < 26 || p.age > 29)) return false;
      if (ageFilter === '30+' && p.age < 30) return false;
      if (progFilter !== 'ALL' && progressionOf(p) !== progFilter) return false;
      if (interestFilter !== 'ALL' && interestInTeam(state, p) !== interestFilter) return false;
      return true;
    });
  }, [agents, posTab, posFilter, ovrFilter, ageFilter, progFilter, interestFilter, state]);

  const selected =
    (selectedId ? filtered.find((p) => p.id === selectedId) : null) ?? filtered[0] ?? null;

  const resetFilters = () => {
    setPosTab('ALL');
    setPosFilter('ALL');
    setOvrFilter('ALL');
    setAgeFilter('ALL');
    setProgFilter('ALL');
    setInterestFilter('ALL');
  };

  const faWeek =
    cal.kind === 'freeAgency' || cal.kind === 'freeAgencyRecap' ? cal.weekOfMonth : 1;
  const open = state.phase === 'freeAgency';

  return (
    <div
      className="fa-root"
      style={
        {
          '--fa-primary': team.primary,
          '--fa-secondary': team.secondary,
          '--fa-accent': team.accent,
        } as CSSProperties
      }
    >
      <header className="fa-top fa-top-compact">
        <button type="button" className="fa-back" onClick={onBack}>
          ← Office
        </button>
        <div className="fa-title-block">
          <h2>FREE AGENCY</h2>
          <p>
            Week {faWeek}/4 · {agents.length} players · Cap {capLabel}
          </p>
        </div>
        <button
          type="button"
          className={`fa-filter-toggle ${filtersOpen ? 'open' : ''}`}
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          Filters
        </button>
      </header>

      {filtersOpen && (
        <div className="fa-filters">
          <label>
            POSITION
            <select
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value as Position | 'ALL')}
            >
              <option value="ALL">ALL</option>
              {(['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'] as Position[]).map(
                (p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            OVR RATING
            <select
              value={ovrFilter}
              onChange={(e) => setOvrFilter(e.target.value as OvrFilter)}
            >
              <option value="ALL">ALL</option>
              <option value="90+">90+</option>
              <option value="80-89">80–89</option>
              <option value="70-79">70–79</option>
              <option value="<70">&lt;70</option>
            </select>
          </label>
          <label>
            AGE
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value as AgeFilter)}
            >
              <option value="ALL">ALL</option>
              <option value="21-25">21–25</option>
              <option value="26-29">26–29</option>
              <option value="30+">30+</option>
            </select>
          </label>
          <label>
            PROGRESSION
            <select
              value={progFilter}
              onChange={(e) => setProgFilter(e.target.value as ProgFilter)}
            >
              <option value="ALL">ALL</option>
              <option value="SUPERSTAR">SUPERSTAR</option>
              <option value="PURE TALENT">PURE TALENT</option>
              <option value="ATHLETE">ATHLETE</option>
              <option value="DEVELOPING">DEVELOPING</option>
              <option value="VETERAN">VETERAN</option>
              <option value="COMMON">COMMON</option>
            </select>
          </label>
          <label>
            INTEREST
            <select
              value={interestFilter === 'ALL' ? 'ALL' : String(interestFilter)}
              onChange={(e) => {
                const v = e.target.value;
                setInterestFilter(v === 'ALL' ? 'ALL' : (Number(v) as Interest));
              }}
            >
              <option value="ALL">ALL</option>
              <option value="3">HIGH (3★)</option>
              <option value="2">NEUTRAL (2★)</option>
              <option value="1">LOW (1★)</option>
            </select>
          </label>
          <button type="button" className="fa-reset" onClick={resetFilters}>
            RESET
          </button>
        </div>
      )}

      <div className="fa-needs-strip">
        Needs: <strong>{needs.join(' · ') || 'Balanced'}</strong>
      </div>

      <div className="fa-main">
        <section className="fa-list-panel">
          <div className="fa-table-wrap">
            <table className="fa-table">
              <thead>
                <tr>
                  <th>PLAYER</th>
                  <th>AGE</th>
                  <th>POS</th>
                  <th>OVR</th>
                  <th>PROGRESSION</th>
                  <th>CONTRACT DEMAND</th>
                  <th>INTEREST</th>
                  <th>FIT</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const demand = contractDemand(p);
                  const interest = interestInTeam(state, p);
                  const fit = schemeFit(state, p);
                  const active = selected?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      className={active ? 'active' : ''}
                      onClick={() => setSelectedId(p.id)}
                    >
                      <td>
                        <div className="fa-player-cell">
                          <Portrait player={p} />
                          <div>
                            <strong>{playerName(p)}</strong>
                            <small>Age {p.age}</small>
                          </div>
                        </div>
                      </td>
                      <td>{p.age}</td>
                      <td>{p.position}</td>
                      <td>
                        <span className={`fa-ovr fa-ovr-${ovrTone(p.overall)}`}>{p.overall}</span>
                      </td>
                      <td>
                        <span className="fa-prog">{progressionOf(p)}</span>
                      </td>
                      <td>
                        {demand.years} YEARS {formatMoney(demand.totalValue)}
                      </td>
                      <td>
                        <Stars level={interest} />
                      </td>
                      <td>
                        <FitRing fit={fit} />
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={8} className="fa-empty">
                      No free agents match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="fa-list-foot">
            <span>SORTED BY: OVERALL (HIGHEST TO LOWEST)</span>
            <strong>{filtered.length} PLAYERS</strong>
          </div>
        </section>

        <aside className="fa-detail">
          {selected ? (
            <>
              <div className="fa-detail-head">
                <Portrait player={selected} />
                <div className="fa-detail-id">
                  <h3>{playerName(selected)}</h3>
                  <p>
                    Age {selected.age} · {selected.position} · {playerBio(selected).height} ·{' '}
                    {playerBio(selected).weight} lbs
                  </p>
                  <p>
                    {playerBio(selected).college} · Exp {playerBio(selected).exp} Years
                  </p>
                </div>
                <div className={`fa-detail-ovr fa-ovr-${ovrTone(selected.overall)}`}>
                  <small>OVR</small>
                  <strong>{selected.overall}</strong>
                </div>
              </div>

              <div className="fa-prog-banner">
                <span className="fa-prog-icon" aria-hidden>
                  ◆
                </span>
                <div>
                  <small>PROGRESSION TYPE</small>
                  <strong>{progressionOf(selected)}</strong>
                </div>
              </div>

              <div className="fa-attrs">
                {displayAttributes(selected).map((a) => (
                  <AttrBar key={a.key} label={a.label} value={a.value} />
                ))}
              </div>

              <div className="fa-contract-box">
                <h4>CONTRACT DEMAND</h4>
                <dl>
                  <div>
                    <dt>Years Wanted</dt>
                    <dd>{contractDemand(selected).years} Years</dd>
                  </div>
                  <div>
                    <dt>Salary Wanted</dt>
                    <dd>{formatMoney(contractDemand(selected).annualSalary)} / YEAR</dd>
                  </div>
                  <div>
                    <dt>Signing Bonus</dt>
                    <dd>{formatMoney(contractDemand(selected).signingBonus)}</dd>
                  </div>
                  <div>
                    <dt>Total Value</dt>
                    <dd>{formatMoney(contractDemand(selected).totalValue)}</dd>
                  </div>
                </dl>
              </div>

              <div className="fa-interest-box">
                <p>{interestLabel(interestInTeam(state, selected))}</p>
                <Stars level={interestInTeam(state, selected)} />
                <div className="fa-motives">
                  <small>TOP MOTIVATIONS</small>
                  <ol>
                    {interestMotivations(state, selected, interestInTeam(state, selected)).map(
                      (m, i) => (
                        <li key={m}>
                          {i + 1}. {m}
                        </li>
                      ),
                    )}
                  </ol>
                </div>
              </div>

              <button
                type="button"
                className="fa-offer"
                disabled={!open}
                onClick={() => onSign(selected.id)}
              >
                {open ? 'MAKE CONTRACT OFFER' : 'FREE AGENCY CLOSED'}
              </button>
            </>
          ) : (
            <p className="fa-empty">Select a free agent to review.</p>
          )}
        </aside>
      </div>

      <footer className="fa-pos-bar">
        {FA_POSITION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={posTab === tab.id ? 'active' : ''}
            onClick={() => setPosTab(tab.id)}
          >
            <span className="fa-pos-icon" data-pos={tab.id} />
            <strong>{tab.label === 'ALL' ? 'ALL PLAYERS' : tab.label}</strong>
          </button>
        ))}
        <button type="button" className="fa-continue-week" onClick={onFinish} disabled={!open}>
          CONTINUE WEEK
        </button>
      </footer>
    </div>
  );
}
