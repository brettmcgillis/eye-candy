import React, { memo, useState } from 'react';

import { normalizeRoomKey } from '../hooks/useRoomKey';

function shareUrl(roomKey) {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('room', roomKey);
  return url.toString();
}

function RoomPill({ onSwitchRoom, roomKey }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState('');
  const next = normalizeRoomKey(draft);

  const share = async () => {
    const url = shareUrl(roomKey);
    try {
      if (navigator.share) await navigator.share({ title: 'Party Line', url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      /* share sheet dismissed */
    }
  };

  const join = (event) => {
    event.preventDefault();
    if (next && next !== roomKey) onSwitchRoom(next);
  };

  return (
    <div className="pl-room-wrap">
      <button
        aria-expanded={open}
        className="pl-room"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="pl-room-label">Room</span>
        <span className="pl-room-code">{roomKey}</span>
      </button>
      {open && (
        <form className="pl-card pl-room-menu" onSubmit={join}>
          <button className="pl-button" onClick={share} type="button">
            {copied ? 'Link copied!' : 'Share link'}
          </button>
          <div className="pl-room-join">
            <input
              aria-label="Room code"
              autoCapitalize="characters"
              autoComplete="off"
              className="pl-code"
              maxLength={8}
              onChange={(event) =>
                setDraft(normalizeRoomKey(event.target.value))
              }
              placeholder="CODE"
              value={draft}
            />
            <button
              className="pl-button is-big"
              disabled={!next || next === roomKey}
              type="submit"
            >
              Join
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default memo(RoomPill);
