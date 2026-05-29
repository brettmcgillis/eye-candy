import React from 'react';

import NurbsWaterColumn from '../../../../../elements/water/NurbsWaterColumn';
import {
  WATER_DEPTH,
  WATER_HEIGHT,
  WATER_POSITION,
  WATER_WAVE_CHOPPINESS,
  WATER_WAVE_HEIGHT,
  WATER_WAVE_SPEED,
  WATER_WIDTH,
} from '../utils/config';

export default function Water({ groupRef, waterInteraction }) {
  return (
    <group ref={groupRef} position={WATER_POSITION}>
      <NurbsWaterColumn
        depth={WATER_DEPTH}
        edgeColor="#67e8f9"
        edgeOpacity={0.85}
        height={WATER_HEIGHT}
        interactionRuntime={waterInteraction}
        lightningTarget
        opacity={0.26}
        roughness={0.18}
        showEdges
        thickness={0.28}
        topColor="#8be9fd"
        transmission={0.45}
        waveChoppiness={WATER_WAVE_CHOPPINESS}
        waveHeight={WATER_WAVE_HEIGHT}
        waveSpeed={WATER_WAVE_SPEED}
        width={WATER_WIDTH}
      />
    </group>
  );
}
