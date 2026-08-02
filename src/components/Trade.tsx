import { useMemo, useState } from 'react';
import type { LeagueState, TradeAsset } from '../game/types';
import { formatPick, pickKey, tradeDifficultyBlurb } from '../game/trade';
import { formatMoney, playerCapHit, rosterPlayers } from '../game/salary';
import { playerName } from '../game/generate';
import { userTeam } from '../game/season';

interface Props {
  state: LeagueState;
  onPropose: (offer: {
    fromTeamId: string;
    toTeamId: string;
    offer: TradeAsset[];
    request: TradeAsset[];
  }) => void;
}

export function Trade({ state, onPropose }: Props) {
  const you = userTeam(state);
  const [partnerId, setPartnerId] = useState(() => state.teams.find((t) => t.id !== you.id)!.id);
  const [givePlayers, setGivePlayers] = useState<string[]>([]);
  const [getPlayers, setGetPlayers] = useState<string[]>([]);
  const [givePicks, setGivePicks] = useState<string[]>([]);
  const [getPicks, setGetPicks] = useState<string[]>([]);

  const partner = state.teams.find((t) => t.id === partnerId)!;
  const yourRoster = rosterPlayers(state, you.id);
  const theirRoster = rosterPlayers(state, partnerId);

  const yourPickMap = useMemo(() => {
    const map = new Map<string, (typeof you.draftPicks)[0]>();
    for (const pk of you.draftPicks.filter((p) => p.ownerTeamId === you.id)) {
      map.set(pickKey(pk), pk);
    }
    return map;
  }, [you]);

  const theirPickMap = useMemo(() => {
    const map = new Map<string, (typeof partner.draftPicks)[0]>();
    for (const pk of partner.draftPicks.filter((p) => p.ownerTeamId === partner.id)) {
      map.set(pickKey(pk), pk);
    }
    return map;
  }, [partner]);

  const toggle = (list: string[], id: string, set: (v: string[]) => void) => {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const submit = () => {
    const offer: TradeAsset[] = [
      ...givePlayers.map((id) => ({ type: 'player' as const, playerId: id })),
      ...givePicks.map((k) => ({ type: 'pick' as const, pick: yourPickMap.get(k)! })),
    ];
    const request: TradeAsset[] = [
      ...getPlayers.map((id) => ({ type: 'player' as const, playerId: id })),
      ...getPicks.map((k) => ({ type: 'pick' as const, pick: theirPickMap.get(k)! })),
    ];
    onPropose({ fromTeamId: you.id, toTeamId: partnerId, offer, request });
    setGivePlayers([]);
    setGetPlayers([]);
    setGivePicks([]);
    setGetPicks([]);
  };

  return (
    <section className="panel panel-pad anim-fade-up">
      <div className="tag">Trade Desk · {state.difficulty}</div>
      <h2 style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', fontSize: '2.4rem', margin: '0.2rem 0' }}>
        MAKE A DEAL
      </h2>
      <p className="muted">{tradeDifficultyBlurb(state.difficulty)}</p>

      <label className="muted" style={{ display: 'block', margin: '1rem 0 0.5rem' }}>
        Partner franchise
        <select
          value={partnerId}
          onChange={(e) => {
            setPartnerId(e.target.value);
            setGetPlayers([]);
            setGetPicks([]);
          }}
          style={{
            display: 'block',
            marginTop: 6,
            width: 'min(320px, 100%)',
            padding: '0.65rem',
            background: 'var(--night-soft)',
            color: 'var(--chalk)',
            border: '1px solid var(--line)',
            borderRadius: 4,
          }}
        >
          {state.teams
            .filter((t) => t.id !== you.id)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.city} {t.name}
              </option>
            ))}
        </select>
      </label>

      <div className="grid-2" style={{ marginTop: '1rem' }}>
        <div>
          <h3>You offer</h3>
          <div className="list-scroll">
            {yourRoster.slice(0, 40).map((p) => (
              <label key={p.id} style={{ display: 'flex', gap: 8, padding: '0.35rem 0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={givePlayers.includes(p.id)}
                  onChange={() => toggle(givePlayers, p.id, setGivePlayers)}
                />
                <span>
                  {playerName(p)} · {p.position} {p.overall} · {formatMoney(playerCapHit(p))}
                </span>
              </label>
            ))}
            {[...yourPickMap.entries()].slice(0, 21).map(([k, pk]) => (
              <label key={k} style={{ display: 'flex', gap: 8, padding: '0.35rem 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={givePicks.includes(k)} onChange={() => toggle(givePicks, k, setGivePicks)} />
                <span>{formatPick(pk)}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <h3>You request</h3>
          <div className="list-scroll">
            {theirRoster.slice(0, 40).map((p) => (
              <label key={p.id} style={{ display: 'flex', gap: 8, padding: '0.35rem 0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={getPlayers.includes(p.id)}
                  onChange={() => toggle(getPlayers, p.id, setGetPlayers)}
                />
                <span>
                  {playerName(p)} · {p.position} {p.overall} · {formatMoney(playerCapHit(p))}
                </span>
              </label>
            ))}
            {[...theirPickMap.entries()].slice(0, 21).map(([k, pk]) => (
              <label key={k} style={{ display: 'flex', gap: 8, padding: '0.35rem 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={getPicks.includes(k)} onChange={() => toggle(getPicks, k, setGetPicks)} />
                <span>{formatPick(pk)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={submit}>
        Propose Trade to {partner.abbrev}
      </button>
    </section>
  );
}
