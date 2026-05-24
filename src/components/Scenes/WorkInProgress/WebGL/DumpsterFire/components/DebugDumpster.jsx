import { useControls } from 'leva';

import React from 'react';

import { DebugDumpster as DebugDumpsterImpl } from '../../../../../elements/dumpster/Dumpster';

const DEG = Math.PI / 180;

export default function DebugDumpster() {
  const { x, y, z, scale, leftLidDeg, rightLidDeg } = useControls(
    'Debug Dumpster',
    {
      x: { value: 5, min: -20, max: 20, step: 0.1 },
      y: { value: 0, min: -5, max: 10, step: 0.1 },
      z: { value: 0, min: -20, max: 20, step: 0.1 },
      scale: { value: 2, min: 0.1, max: 5, step: 0.1 },
      leftLidDeg: { value: -180, min: -270, max: 180, step: 1 },
      rightLidDeg: { value: -180, min: -270, max: 180, step: 1 },
    }
  );

  return (
    <DebugDumpsterImpl
      position={[x, y, z]}
      scale={scale}
      leftLidRotation={leftLidDeg * DEG}
      rightLidRotation={rightLidDeg * DEG}
    />
  );
}
