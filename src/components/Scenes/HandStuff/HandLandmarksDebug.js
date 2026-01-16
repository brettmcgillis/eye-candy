import React, { useMemo } from 'react';
import * as THREE from 'three';

import { Sphere } from '@react-three/drei';

export default function HandLandmarksDebug({
  hands,
  scale: { xScale, yScale, zScale },
}) {
  const points = useMemo(() => {
    if (!hands?.length) return [];

    return hands.flatMap((hand, h) =>
      Object.values(hand.landmarks).map((lm, i) => {
        return {
          key: `${h}-${i}`,
          position: new THREE.Vector3(
            (lm.x - 0.5) * xScale,
            -(lm.y - 0.5) * yScale,
            -lm.z * zScale
          ),
        };
      })
    );
  }, [hands]);

  return points.map((p) => (
    <Sphere key={p.key} args={[0.025, 12, 12]} position={p.position}>
      <meshNormalMaterial />
    </Sphere>
  ));
}
