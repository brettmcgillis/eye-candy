import React, { useRef, useState } from 'react';

import Experience from './components/Experience';
import { useMultiplayer } from './hooks/useMultiplayer.ts';
import { generatePlayerColor } from './utils/playerColors';

export default function MultiplayerMadness({ roomId = 'default-room' }) {
  const [playerId] = useState(
    () => `player-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const [playerColor] = useState(() => generatePlayerColor(playerId));
  const [playerModel, setPlayerModel] = useState('Capsule');
  const ecctrlRef = useRef(null);

  const { remotePlayers, remoteShots, sendShot } = useMultiplayer({
    roomId,
    ecctrlRef,
    playerId,
    playerColor,
    playerModel,
    enabled: true,
  });

  return (
    <Experience
      ecctrlRef={ecctrlRef}
      color={playerColor}
      remotePlayers={remotePlayers}
      remoteShots={remoteShots}
      onShotFired={sendShot}
      onModelChange={setPlayerModel}
    />
  );
}
