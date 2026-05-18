import React, { memo, useMemo } from 'react';

import { radians } from '../../../../../../utils/math';
import Femur from '../../../../../elements/femur/Femur';

const SceneFemur = memo(function SceneFemur({ position, rotation, scale }) {
  const femurPosition = useMemo(
    () => [position.x, position.y, position.z],
    [position.x, position.y, position.z]
  );

  const femurRotation = useMemo(
    () => [radians(rotation.x), radians(rotation.y), radians(rotation.z)],
    [rotation.x, rotation.y, rotation.z]
  );

  return (
    <Femur position={femurPosition} rotation={femurRotation} scale={scale} />
  );
});

export default SceneFemur;
