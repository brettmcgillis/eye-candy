import { useEffect, useState } from 'react';

const FALLBACK_CAM_ID = 'BIRD 0.0.0.0';

/**
 * CCTV director for Bird POV mode: auto-cuts between the birds' feeds on a timer while
 * `enabled`, holding each for `shotDuration` seconds. Returns the active bird plus its
 * key/cam-id so the scene can ride its lens (BirdPovRig), hide its body, and label the
 * surveillance HUD. Idle (no timer) when disabled or there are no birds.
 */
export default function usePovDirector({ enabled, birds, shotDuration }) {
  const [index, setIndex] = useState(0);
  const count = birds.length;

  useEffect(() => {
    if (!enabled || count === 0) return undefined;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      Math.max(shotDuration, 1) * 1000
    );
    return () => window.clearInterval(id);
  }, [enabled, count, shotDuration]);

  const activeBird = count ? birds[index % count] : null;
  return {
    activeBird,
    activeKey: activeBird?.key ?? null,
    activeCamId: activeBird?.camId ?? FALLBACK_CAM_ID,
  };
}
