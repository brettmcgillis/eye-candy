import React, { memo } from 'react';

import { WORLD_SCALE } from '../utils/world';

const MARGIN = 1.04;

function Plate({ canvas, color, roughness }) {
  return (
    <mesh position={[0, 0, -0.002]} receiveShadow>
      <planeGeometry
        args={[
          canvas.width * WORLD_SCALE * MARGIN,
          canvas.height * WORLD_SCALE * MARGIN,
        ]}
      />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

export default memo(Plate);
