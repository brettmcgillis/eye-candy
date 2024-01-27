import React from 'react';

import { ninetyDegrees } from 'utils/math';

export function GridHelper({ x, y, z, size = 10, divisions = 10, ...props }) {
  return (
    <group {...props}>
      {x && <gridHelper args={[size, divisions]} rotation={[0, 0, 0]} />}
      {y && (
        <gridHelper args={[size, divisions]} rotation={[0, 0, ninetyDegrees]} />
      )}
      {z && (
        <gridHelper args={[size, divisions]} rotation={[ninetyDegrees, 0, 0]} />
      )}
    </group>
  );
}

export function PolarGridHelper({
  x,
  y,
  z,
  size = 10,
  divisions = 10,
  ...props
}) {
  return (
    <group {...props}>
      {x && <polarGridHelper args={[size, divisions]} rotation={[0, 0, 0]} />}
      {y && (
        <polarGridHelper
          args={[size, divisions]}
          rotation={[0, 0, ninetyDegrees]}
        />
      )}
      {z && (
        <polarGridHelper
          args={[size, divisions]}
          rotation={[ninetyDegrees, 0, 0]}
        />
      )}
    </group>
  );
}
