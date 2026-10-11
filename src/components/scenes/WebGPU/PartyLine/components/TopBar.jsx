import React, { memo } from 'react';
import { GoGear } from 'react-icons/go';

import { playerHex } from '../utils/palette';
import Avatar from './Avatar';
import RoomPill from './RoomPill';

function TopBar({
  hostId,
  meta,
  onEditProfile,
  onSettings,
  onSwitchRoom,
  roomKey,
  selfId,
}) {
  const players = Object.entries(meta?.players ?? {}).sort(
    ([, a], [, b]) => a.joinedAt - b.joinedAt
  );

  return (
    <div className="pl-top">
      <RoomPill onSwitchRoom={onSwitchRoom} roomKey={roomKey} />
      {meta && (
        <button
          aria-label="Settings"
          className="pl-icon-button"
          onClick={onSettings}
          type="button"
        >
          <GoGear />
        </button>
      )}

      <div className="pl-players">
        {!meta && <span className="pl-note">Finding the party…</span>}
        {players.map(([pid, player]) => (
          <button
            className={`pl-chip${pid === selfId ? ' is-self' : ''}`}
            disabled={pid !== selfId}
            key={pid}
            onClick={onEditProfile}
            type="button"
          >
            <Avatar
              color={playerHex(player.color)}
              seed={player.avatar}
              size={28}
            />
            {player.name}
            {pid === hostId && (
              <span aria-label="host" title="Hosting">
                ⭐
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(TopBar);
