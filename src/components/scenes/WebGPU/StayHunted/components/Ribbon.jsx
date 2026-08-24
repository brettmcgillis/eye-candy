import React, { useMemo } from 'react';

import ClothMesh from '@elements/WebGPU/cloth/ClothMesh';
import { pinEdge } from '@elements/WebGPU/cloth/pinHelpers';

const RIBBON_WIDTH = 0.55;
const RIBBON_HEIGHT = 0.09;
const RIBBON_SEGMENTS_X = 28;
const RIBBON_SEGMENTS_Y = 10;

export default function Ribbon({
  cursorCollider = true,
  dampening = 0.98,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  wind = 1.5,
  stiffness = 0.25,
}) {
  const pins = useMemo(
    () => pinEdge('left', RIBBON_SEGMENTS_X, RIBBON_SEGMENTS_Y),
    []
  );

  return (
    <group position={position} rotation={rotation}>
      <ClothMesh
        width={RIBBON_WIDTH}
        height={RIBBON_HEIGHT}
        segmentsX={RIBBON_SEGMENTS_X}
        segmentsY={RIBBON_SEGMENTS_Y}
        pins={pins}
        shape="ribbon-notched"
        origin={[0, RIBBON_HEIGHT * 0.5, 0]}
        gravity={0.000025}
        windFrequency={1.35}
        windAmplitude={0.00009}
        stepsPerSecond={360}
        wind={wind}
        windDirX={1}
        windDirZ={-0.25}
        stiffness={stiffness}
        dampening={dampening}
        cursorCollider={cursorCollider}
        cursorRadius={0.06}
        initialMaterial={{
          color: '#c43c3c',
          transparent: true,
          opacity: 0.94,
          sheen: 0.8,
          sheenRoughness: 0.45,
          sheenColor: '#ff9393',
          roughness: 0.45,
          metalness: 0.04,
        }}
      />
    </group>
  );
}
