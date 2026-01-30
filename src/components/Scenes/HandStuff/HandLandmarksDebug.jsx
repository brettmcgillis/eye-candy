import React, { useMemo } from 'react';

import { Sphere } from '@react-three/drei';

import { mapToWorld } from './useHandcontrols';

export default function HandLandmarksDebug({
  hands,
  scale: { xScale, yScale, zScale },
}) {
  const points = useMemo(() => {
    if (!hands?.length) return [];

    return hands.flatMap((hand, h) =>
      Object.values(hand.landmarks).map((lm, i) => ({
        key: `${h}-${i}`,
        position: mapToWorld(lm, { xScale, yScale, zScale }),
      }))
    );
  }, [hands, xScale, yScale, zScale]);

  return points.map((p) => (
    <Sphere key={p.key} args={[0.025, 12, 12]} position={p.position}>
      <meshNormalMaterial />
    </Sphere>
  ));
}
