import { useCallback, useState } from 'react';

import { readQueryParam, writeQueryParam } from '@utils/queryParams';

const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const KEY_LENGTH = 4;

export function normalizeRoomKey(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

function randomKey() {
  return Array.from(
    { length: KEY_LENGTH },
    () => LETTERS[Math.floor(Math.random() * LETTERS.length)]
  ).join('');
}

function initialKey() {
  const key = normalizeRoomKey(readQueryParam('room')) || randomKey();
  writeQueryParam('room', key);
  return key;
}

// Joining a different room reloads into its URL: switching Trystero rooms in
// place left players unable to join until a manual reload.
export default function useRoomKey() {
  const [roomKey] = useState(initialKey);

  const setRoomKey = useCallback(
    (value) => {
      const key = normalizeRoomKey(value);
      if (!key || key === roomKey) return;
      const url = new URL(window.location.href);
      url.searchParams.set('room', key);
      url.searchParams.delete('preset');
      window.location.replace(url.toString());
    },
    [roomKey]
  );

  return { roomKey, setRoomKey };
}
