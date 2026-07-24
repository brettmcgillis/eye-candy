import React, { memo, useCallback } from 'react';

import {
  INTERACTION_PLANE_Z,
  ROOM_HALF_HEIGHT,
  ROOM_HEIGHT,
  ROOM_WIDTH,
} from '../utils/sceneUtils';

// Invisible catch-plane across the room's open front face. It only exists to
// give R3F's pointer-event raycaster something to hit — the reported
// event.ray (full world-space ray, not just the hit point) is what actually
// reaches cranes throughout the room's depth, matching the vanilla example's
// mouse-ray push instead of only affecting whatever sits right at the glass.
function PointerPusher({ interaction }) {
  const handlePointerMove = useCallback(
    (event) => {
      event.stopPropagation();
      interaction.setPointerRay(
        event.point,
        event.ray.origin,
        event.ray.direction
      );
    },
    [interaction]
  );

  const handlePointerDown = useCallback(
    (event) => {
      event.stopPropagation();
      interaction.setPointerRay(
        event.point,
        event.ray.origin,
        event.ray.direction
      );
      interaction.requestSpawnBurst();
    },
    [interaction]
  );

  const handlePointerOut = useCallback(() => {
    interaction.clearPointerTarget();
  }, [interaction]);

  return (
    <mesh
      position={[0, ROOM_HALF_HEIGHT, INTERACTION_PLANE_Z]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
      <meshBasicMaterial depthWrite={false} opacity={0} transparent />
    </mesh>
  );
}

export default memo(PointerPusher);
