import React, { memo, useMemo } from 'react';

import { Cloud, Clouds } from '@react-three/drei';

import { radians } from '../../../../../../utils/math';

const SceneCloud = memo(function SceneCloud({
  position,
  rotation,
  scale,
  visible,
  seed,
  segments,
  volume,
  opacity,
  fade,
  growth,
  speed,
  boundsX,
  boundsY,
  boundsZ,
  color,
}) {
  const cloudPosition = useMemo(
    () => [position.x, position.y, position.z],
    [position.x, position.y, position.z]
  );

  const cloudRotation = useMemo(
    () => [radians(rotation.x), radians(rotation.y), radians(rotation.z)],
    [rotation.x, rotation.y, rotation.z]
  );

  const cloudBounds = useMemo(
    () => [boundsX, boundsY, boundsZ],
    [boundsX, boundsY, boundsZ]
  );

  return (
    <Clouds visible={visible}>
      <Cloud
        position={cloudPosition}
        rotation={cloudRotation}
        scale={scale}
        bounds={cloudBounds}
        seed={seed}
        segments={segments}
        volume={volume}
        opacity={opacity}
        fade={fade}
        growth={growth}
        speed={speed}
        color={color}
        castShadow
        receiveShadow
      />
    </Clouds>
  );
});

export default SceneCloud;
