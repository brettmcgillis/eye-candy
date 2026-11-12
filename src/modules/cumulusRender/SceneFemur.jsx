import React, { memo, useMemo } from 'react';

import Femur from '@elements/Femur/Femur';
import { usePaintMaterialTransform } from '@modules/paintedRender';
import { radians } from '@utils/math';

const SceneFemur = memo(function SceneFemur({
  paintConfig,
  position,
  rotation,
  scale,
  visible,
}) {
  const materialTransform = usePaintMaterialTransform(
    paintConfig,
    '#8d7f75',
    'specimen',
    'femur'
  );
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
      materialTransform={materialTransform}
      userData={{ plotAnatomy: 'femur' }}
      position={femurPosition}
      rotation={femurRotation}
      scale={scale}
      visible={visible}
    />
  );
});

export default SceneFemur;
