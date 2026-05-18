import * as THREE from 'three/webgpu';

import React, { memo, useMemo } from 'react';

import { useTexture } from '@react-three/drei';

import { textureFile } from '../../../../../../utils/appUtils';
import { radians } from '../../../../../../utils/math';
import WebGPUProjectorLight from '../../../../../elements/webgpu/lights/WebGPUProjectorLight';

const PROJECTOR_MAP_URL = textureFile('stained_glass_floral.png');

useTexture.preload(PROJECTOR_MAP_URL);

const StainedGlassProjector = memo(function StainedGlassProjector({
  color,
  debug,
  distance,
  intensity,
  focus,
  penumbra,
  position,
  angle,
  target,
  decay,
  castShadow,
  repeat = { x: 1, y: 1 },
}) {
  const projectorPosition = useMemo(
    () => [position.x, position.y, position.z],
    [position.x, position.y, position.z]
  );

  const projectorTarget = useMemo(
    () => [target.x, target.y, target.z],
    [target.x, target.y, target.z]
  );

  const projectorRepeat = useMemo(
    () => [repeat.x, repeat.y],
    [repeat.x, repeat.y]
  );

  return (
    <WebGPUProjectorLight
      angle={radians(angle)}
      castShadow={castShadow}
      color={color}
      debug={debug}
      decay={decay}
      distance={distance}
      intensity={intensity}
      mapGenerateMipmaps={false}
      mapRepeat={projectorRepeat}
      mapUrl={PROJECTOR_MAP_URL}
      mapWrapS={THREE.RepeatWrapping}
      mapWrapT={THREE.RepeatWrapping}
      penumbra={penumbra}
      position={projectorPosition}
      shadowBias={-0.0008}
      shadowFar={14}
      shadowFocus={focus}
      shadowNormalBias={0.02}
      shadowMapSize={[2048, 2048]}
      shadowNear={0.5}
      target={projectorTarget}
    />
  );
});

export default StainedGlassProjector;
