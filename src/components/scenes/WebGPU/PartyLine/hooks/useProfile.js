import { useCallback, useState } from 'react';

import { isAvatarSeed, randomAvatarSeed } from '../utils/avatar';

const STORAGE_KEY = 'partyLine.profile';

function readProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored?.name) return null;
    return isAvatarSeed(stored.avatar)
      ? stored
      : { ...stored, avatar: randomAvatarSeed() };
  } catch {
    return null;
  }
}

export default function useProfile() {
  const [profile, setProfile] = useState(readProfile);

  const saveProfile = useCallback((next) => {
    setProfile(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: profile lives for this session only */
    }
  }, []);

  return { profile, saveProfile };
}
