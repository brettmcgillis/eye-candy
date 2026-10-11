import React, { memo, useMemo, useState } from 'react';

import { randomAvatarSeed } from '../utils/avatar';
import { PLAYER_COLORS, playerHex } from '../utils/palette';
import Avatar from './Avatar';

const CHOICE_COUNT = 5;

const rollChoices = () =>
  Array.from({ length: CHOICE_COUNT }, () => randomAvatarSeed());

function JoinCard({ onCancel, onJoin, players, profile, selfId }) {
  const takenBy = useMemo(() => {
    const taken = new Map();
    Object.entries(players ?? {}).forEach(([pid, player]) => {
      if (pid !== selfId) taken.set(player.color, player.name);
    });
    return taken;
  }, [players, selfId]);

  const firstFree = PLAYER_COLORS.findIndex((_, index) => !takenBy.has(index));
  const [name, setName] = useState(profile?.name ?? '');
  const [color, setColor] = useState(profile?.color ?? Math.max(0, firstFree));
  const [avatar, setAvatar] = useState(profile?.avatar ?? randomAvatarSeed);
  const [choices, setChoices] = useState(rollChoices);
  const hex = playerHex(color);

  const submit = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    onJoin({ avatar, color, name: name.trim() });
  };

  return (
    <div className="pl-modal">
      <form className="pl-card pl-join" onSubmit={submit}>
        <div className="pl-join-head">
          <Avatar
            className="pl-join-avatar"
            color={hex}
            seed={avatar}
            size={76}
          />
          <div className="pl-join-fields">
            <input
              aria-label="Your name"
              autoComplete="off"
              maxLength={16}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              value={name}
            />
          </div>
        </div>

        <div className="pl-join-row">
          {choices.map((seed) => (
            <button
              aria-label="Pick this monster"
              className={`pl-avatar-choice${seed === avatar ? ' is-active' : ''}`}
              key={seed}
              onClick={() => setAvatar(seed)}
              type="button"
            >
              <Avatar color={hex} seed={seed} size={40} />
            </button>
          ))}
          <button
            aria-label="More monsters"
            className="pl-avatar-choice pl-reroll"
            onClick={() => setChoices(rollChoices())}
            type="button"
          >
            🎲
          </button>
        </div>

        <div className="pl-join-row pl-pens">
          {PLAYER_COLORS.map(({ hex: swatch, name: colorName }, index) => (
            <button
              aria-label={`${colorName} pen`}
              className={`pl-swatch${color === index ? ' is-active' : ''}`}
              disabled={takenBy.has(index)}
              key={swatch}
              onClick={() => setColor(index)}
              style={{ background: swatch }}
              title={takenBy.get(index) ?? colorName}
              type="button"
            />
          ))}
        </div>

        <div className="pl-bar">
          <button
            className="pl-button is-big"
            disabled={!name.trim()}
            type="submit"
          >
            Let&apos;s draw!
          </button>
          {onCancel && (
            <button className="pl-button" onClick={onCancel} type="button">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default memo(JoinCard);
