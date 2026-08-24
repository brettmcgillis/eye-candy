import React, { memo, useMemo } from 'react';

import { useTexture } from '@react-three/drei';

import * as THREE from 'three/webgpu';

import WebGPUProjectorLight from '@elements/webgpu/lights/WebGPUProjectorLight';
import { textureFile } from '@utils/appUtils';
import { radians } from '@utils/math';

const PROJECTOR_MAP_URL = textureFile('stained_glass_floral.png');

useTexture.preload(PROJECTOR_MAP_URL);

const StainedGlassProjector = memo(function StainedGlassProjector({
  color,
  debug,
  distance,
  extraLayers = [],
  intensity,
  focus,
  blur = 0,
  causticAmount = 0,
  causticContrast = 0.22,
  causticScale = 6,
  causticSpeed = 0.35,
  penumbra,
  position,
  shadowAutoUpdate = true,
  shadowUpdateKey = null,
  angle,
  target,
  decay,
  castShadow,
  repeat = { x: 1, y: 1 },
  tintColor = '#ffffff',
  tintStrength = 0,
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
      extraLayers={extraLayers}
      intensity={intensity}
      mapBlur={blur}
      mapCausticAmount={causticAmount}
      mapCausticContrast={causticContrast}
      mapCausticScale={causticScale}
      mapCausticSpeed={causticSpeed}
      mapGenerateMipmaps={false}
      mapRepeat={projectorRepeat}
      mapTintColor={tintColor}
      mapTintStrength={tintStrength}
      mapUrl={PROJECTOR_MAP_URL}
      mapWrapS={THREE.RepeatWrapping}
      mapWrapT={THREE.RepeatWrapping}
      penumbra={penumbra}
      position={projectorPosition}
      shadowAutoUpdate={shadowAutoUpdate}
      shadowBias={-0.0008}
      shadowFar={14}
      shadowFocus={focus}
      shadowNormalBias={0.02}
      shadowUpdateKey={shadowUpdateKey}
      shadowMapSize={[1024, 1024]}
      shadowNear={0.5}
      target={projectorTarget}
    />
  );
});

export default StainedGlassProjector;
