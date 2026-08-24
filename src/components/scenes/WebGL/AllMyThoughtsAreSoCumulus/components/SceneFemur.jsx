import React, { memo, useMemo } from 'react';

import Femur from '@elements/Femur/Femur';
import { radians } from '@utils/math';

const SceneFemur = memo(function SceneFemur({
  position,
  rotation,
  scale,
  visible,
}) {
  const femurPosition = useMemo(
    () => [position.x, position.y, position.z],
    [position.x, position.y, position.z]
  );

  const femurRotation = useMemo(
    () => [radians(rotation.x), radians(rotation.y), radians(rotation.z)],
    [rotation.x, rotation.y, rotation.z]
  );

  return (
    <Femur
      position={femurPosition}
      rotation={femurRotation}
      scale={scale}
      visible={visible}
    />
  );
});

export default SceneFemur;
