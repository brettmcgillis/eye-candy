import { memo } from 'react';

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
  bounds,
  color,
}) {
  return (
    <Clouds visible={visible}>
      <Cloud
        position={position}
        rotation={rotation}
        scale={scale}
        bounds={bounds}
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
