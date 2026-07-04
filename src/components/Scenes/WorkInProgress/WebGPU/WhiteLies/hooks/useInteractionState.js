import { useCallback, useRef } from 'react';

// Scene-local interaction bus. Holds the full pointer ray (so cranes can be
// reached at any depth in the room, not just near the front glass), a
// shallow target point (for the light to ease toward), and a spawn "nonce"
// that increments on click — all mutable refs, no re-renders (mirrors the
// resetNonce pattern used by RockProjectiles).
export default function useInteractionState() {
  const stateRef = useRef({
    pointerActive: false,
    pointerX: 0,
    pointerY: 0,
    pointerZ: 0,
    rayOriginX: 0,
    rayOriginY: 0,
    rayOriginZ: 0,
    rayDirX: 0,
    rayDirY: 0,
    rayDirZ: -1,
    spawnNonce: 0,
  });

  const setPointerRay = useCallback((point, origin, direction) => {
    const state = stateRef.current;
    state.pointerActive = true;
    state.pointerX = point.x;
    state.pointerY = point.y;
    state.pointerZ = point.z;
    state.rayOriginX = origin.x;
    state.rayOriginY = origin.y;
    state.rayOriginZ = origin.z;
    state.rayDirX = direction.x;
    state.rayDirY = direction.y;
    state.rayDirZ = direction.z;
  }, []);

  const clearPointerTarget = useCallback(() => {
    stateRef.current.pointerActive = false;
  }, []);

  const requestSpawnBurst = useCallback(() => {
    stateRef.current.spawnNonce += 1;
  }, []);

  return { clearPointerTarget, requestSpawnBurst, setPointerRay, stateRef };
}
