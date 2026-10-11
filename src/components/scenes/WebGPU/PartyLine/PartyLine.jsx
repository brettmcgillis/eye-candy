import React from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';

import PartyOverlay from './components/PartyOverlay';
import Stage from './components/Stage';
import useBoardRect from './hooks/useBoardRect';
import useHomeScreenApp from './hooks/useHomeScreenApp';
import usePartyRoom from './hooks/usePartyRoom';
import useProfile from './hooks/useProfile';
import useRoomKey from './hooks/useRoomKey';
import useSceneControls from './hooks/useSceneControls';
import { getPresetGame } from './presets/games';

export default function PartyLine() {
  const c = useSceneControls();
  const { roomKey, setRoomKey } = useRoomKey();
  const { profile, saveProfile } = useProfile();
  const party = usePartyRoom({ c, profile, roomKey });
  const { rect, rectRef } = useBoardRect();

  useSceneBackdrop({ color: c.backgroundColor });
  useHomeScreenApp({ backgroundColor: c.backgroundColor, roomKey });

  const Game = party.meta ? getPresetGame(party.meta.preset).Component : null;

  return (
    <>
      <Stage />
      {Game && party.room && (
        <Game c={c} party={party} rect={rect} rectRef={rectRef} />
      )}
      <PartyOverlay
        party={party}
        profile={profile}
        roomKey={roomKey}
        saveProfile={saveProfile}
        setRoomKey={setRoomKey}
      />
    </>
  );
}
