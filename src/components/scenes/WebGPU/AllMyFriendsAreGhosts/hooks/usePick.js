import { useMemo } from 'react';

// Leva returns a new controls object on every edit; slice by value so memo holds.
export default function usePick(source, keys) {
  const signature = JSON.stringify(keys.map((key) => source[key]));

  return useMemo(
    () => Object.fromEntries(keys.map((key) => [key, source[key]])),
    [signature]
  );
}
