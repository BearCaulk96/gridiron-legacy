import { useState } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { Setup } from './components/Setup';
import { Shell } from './components/Shell';
import { Hub } from './components/Hub';
import { Roster } from './components/Roster';
import { Coaches } from './components/Coaches';
import { Draft } from './components/Draft';
import { Trade } from './components/Trade';
import { FreeAgency } from './components/FreeAgency';
import { Standings } from './components/Standings';
import { Cap } from './components/Cap';
import { useLeague } from './hooks/useLeague';
import { hasSave } from './game/save';

export default function App() {
  const game = useLeague();
  const [setupTeamId, setSetupTeamId] = useState<string | undefined>();

  if (game.screen === 'landing') {
    return (
      <>
        <TitleScreen
          hasSave={hasSave()}
          onContinue={game.continueGame}
          onNew={(teamId) => {
            setSetupTeamId(teamId);
            game.setScreen('setup');
          }}
        />
        {game.toast && <div className="toast">{game.toast}</div>}
      </>
    );
  }

  if (game.screen === 'setup' || !game.state) {
    return (
      <>
        <Setup
          initialTeamId={setupTeamId}
          onBack={() => game.setScreen('landing')}
          onStart={game.newGame}
        />
        {game.toast && <div className="toast">{game.toast}</div>}
      </>
    );
  }

  const { state, actions } = game;

  return (
    <>
      <Shell state={state} screen={game.screen} setScreen={game.setScreen} onAbandon={game.abandon}>
        {game.screen === 'hub' && (
          <Hub
            state={state}
            onBeginSeason={actions.beginSeason}
            onAdvanceWeek={actions.advanceWeek}
            onEnterDraft={actions.enterDraft}
            onOpen={game.setScreen}
          />
        )}
        {game.screen === 'roster' && <Roster state={state} onRelease={actions.release} />}
        {game.screen === 'coaches' && <Coaches state={state} />}
        {game.screen === 'draft' && (
          <Draft
            state={state}
            onDraft={actions.draftPlayer}
            onScout={actions.scout}
            onSimRest={actions.simDraft}
          />
        )}
        {game.screen === 'trade' && <Trade state={state} onPropose={actions.proposeTrade} />}
        {game.screen === 'freeAgency' && (
          <FreeAgency state={state} onSign={actions.signFA} onFinish={actions.finishFreeAgency} />
        )}
        {game.screen === 'standings' && <Standings state={state} />}
        {game.screen === 'cap' && <Cap state={state} />}
      </Shell>
      {game.toast && <div className="toast">{game.toast}</div>}
    </>
  );
}
