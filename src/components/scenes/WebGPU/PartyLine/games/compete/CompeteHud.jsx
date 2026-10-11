import React, { memo } from 'react';

import OverlayPortal from '@app/scaffold/overlay/components/OverlayPortal';

import Avatar from '../../components/Avatar';
import TimerClock from '../../components/TimerClock';
import useCountdown from '../../hooks/useCountdown';
import { playerBoardHex, playerHex } from '../../utils/palette';
import { ROOM_SETTINGS } from '../../utils/roomSettings';

function Results({ results }) {
  if (!results?.length) return <p className="pl-note">Nobody scribbled!</p>;
  const best = results[0].cells || 1;
  return (
    <ol className="pl-results">
      {results.map((entry, index) => (
        <li key={entry.color}>
          <span className="pl-rank">{index === 0 ? '👑' : index + 1}</span>
          <Avatar
            color={playerHex(entry.color)}
            seed={entry.avatar}
            size={34}
          />
          <span className="pl-result-name">{entry.name}</span>
          <span className="pl-result-track">
            <span
              className="pl-result-fill"
              style={{
                background: playerBoardHex(entry.color),
                width: `${(100 * entry.cells) / best}%`,
              }}
            />
          </span>
          <span className="pl-result-share">
            {Math.round(entry.share * 100)}%
          </span>
        </li>
      ))}
    </ol>
  );
}

function WaitingNote({ hostName }) {
  return (
    <p className="pl-note pl-waiting">
      Waiting for {hostName ?? 'the host'} to start…
    </p>
  );
}

function RoundSummary({ settings }) {
  const { competeEraserEvery: eraser, competeRoundSeconds: length } =
    ROOM_SETTINGS;
  return (
    <p className="pl-note pl-summary">
      {length.format(settings.competeRoundSeconds)} round · eraser{' '}
      {eraser.format(settings.competeEraserEvery).toLowerCase()}
    </p>
  );
}

function CompeteHud({ game, hostName, isHost, room, settings }) {
  const { phase } = game;
  const ticking = phase === 'countdown' || phase === 'drawing';
  const remaining = useCountdown(room, game.endsAt, ticking);
  const seconds = Math.ceil(remaining / 1000);
  const start = () => room.dispatch({ type: 'start' });
  const roundLength = <RoundSummary settings={settings} />;

  return (
    <OverlayPortal datasetKey="partyLineGameHud">
      {phase === 'countdown' && (
        <div className="pl-countdown" key={seconds}>
          {seconds || 'GO!'}
        </div>
      )}
      <div className="pl-bottom">
        {phase === 'lobby' && (
          <div className="pl-card is-compact">
            <p className="pl-lobby-line">
              <strong>Cover the most paper.</strong> Dodge the eraser!
            </p>
            {roundLength}
            {!isHost && <WaitingNote hostName={hostName} />}
            {isHost && (
              <button
                className="pl-button is-big"
                onClick={start}
                type="button"
              >
                Start!
              </button>
            )}
          </div>
        )}
        {phase === 'drawing' && (
          <TimerClock
            className="pl-timer"
            remainingMs={remaining}
            totalMs={(game.round?.seconds ?? 0) * 1000}
            urgentMs={Math.min(5000, (game.round?.seconds ?? 0) * 300)}
          />
        )}
        {phase === 'results' && (
          <div className="pl-card">
            <h2>Results</h2>
            <Results results={game.results} />
            {roundLength}
            {!isHost && <WaitingNote hostName={hostName} />}
            {isHost && (
              <div className="pl-bar">
                <button
                  className="pl-button is-big"
                  onClick={start}
                  type="button"
                >
                  Again!
                </button>
                <button
                  className="pl-button"
                  onClick={() => room.dispatch({ type: 'lobby' })}
                  type="button"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </OverlayPortal>
  );
}

export default memo(CompeteHud);
