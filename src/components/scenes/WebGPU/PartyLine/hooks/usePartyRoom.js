import { useCallback, useEffect, useMemo, useRef } from 'react';

import { createTrysteroTransport, useRoom } from '@modules/partyRoom';

import GAME_RULES from '../games/gameRules';
import { DEFAULT_PRESET } from '../presets/presets';
import createPartyRules from '../utils/partyRules';

const APP_ID = 'eye-candy-party-line-v1';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);
const HOST_PRIORITY = LOCAL_HOSTNAMES.has(window.location.hostname) ? 1 : 0;

export default function usePartyRoom({ c, profile, roomKey }) {
  const rules = useMemo(() => createPartyRules(GAME_RULES, DEFAULT_PRESET), []);
  const createTransport = useCallback(
    (key) => createTrysteroTransport({ appId: APP_ID, roomKey: key }),
    []
  );
  const { controlsSnapshotRef, applyPresetByName, preset } = c;
  const getConfig = useCallback(
    () => controlsSnapshotRef.current,
    [controlsSnapshotRef]
  );

  const party = useRoom({
    createTransport,
    getConfig,
    priority: HOST_PRIORITY,
    roomKey,
    rules,
  });
  const { isHost, meta, room } = party;
  const roomPreset = meta?.preset;

  useEffect(() => {
    if (room && profile) room.setProfile(profile);
  }, [profile, room]);

  const followingRef = useRef(null);
  useEffect(() => {
    if (!roomPreset || roomPreset === preset) return;
    followingRef.current = roomPreset;
    applyPresetByName(roomPreset);
  }, [roomPreset]);

  useEffect(() => {
    if (!room || !roomPreset || preset === roomPreset) return;
    if (preset === followingRef.current) return;
    if (isHost) room.dispatch({ preset, type: 'preset' });
    else {
      followingRef.current = roomPreset;
      applyPresetByName(roomPreset);
    }
  }, [preset]);

  return party;
}
