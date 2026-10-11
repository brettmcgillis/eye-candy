import React, { memo, useState } from 'react';

import OverlayPortal from '@app/scaffold/overlay/components/OverlayPortal';

import JoinCard from './JoinCard';
import SettingsModal from './SettingsModal';
import TopBar from './TopBar';
import './partyLine.css';

function PartyOverlay({ party, profile, roomKey, saveProfile, setRoomKey }) {
  const [editing, setEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { hostId, isHost, meta, room, selfId } = party;
  const showJoin = !profile || editing;

  const onJoin = (next) => {
    saveProfile(next);
    setEditing(false);
  };

  return (
    <OverlayPortal datasetKey="partyLineOverlay">
      <TopBar
        hostId={hostId}
        meta={meta}
        onEditProfile={() => setEditing(true)}
        onSettings={() => setSettingsOpen(true)}
        onSwitchRoom={setRoomKey}
        roomKey={roomKey}
        selfId={selfId}
      />
      {settingsOpen && !showJoin && (
        <SettingsModal
          hostName={meta?.players?.[hostId]?.name}
          isHost={isHost}
          meta={meta}
          onClose={() => setSettingsOpen(false)}
          room={room}
        />
      )}
      {showJoin && (
        <JoinCard
          onCancel={profile ? () => setEditing(false) : null}
          onJoin={onJoin}
          players={meta?.players}
          profile={profile}
          selfId={selfId}
        />
      )}
    </OverlayPortal>
  );
}

export default memo(PartyOverlay);
