import { useEffect, useState } from 'react';

// Drives the "whole-tree resubdivision" mode: a hard-cut regeneration, not
// an animated one — bumping this nonce feeds a new value into the
// subdivision builder's seed, which flows through the same useMemo/
// useLayoutEffect path a seed/hexRadius/gridCols Leva edit already takes
// (see hooks/useTileMesh.js), instantly swapping in a freshly-subdivided
// tree of a possibly different instance count.
export default function useResubdivisionNonce({ enabled, interval }) {
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(
      () => {
        setNonce((n) => n + 1);
      },
      Math.max(interval, 0.1) * 1000
    );
    return () => clearInterval(id);
  }, [enabled, interval]);

  return nonce;
}
