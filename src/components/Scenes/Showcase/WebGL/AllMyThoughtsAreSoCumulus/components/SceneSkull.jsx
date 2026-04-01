import React, { memo, useMemo } from 'react';

import { radians } from '../../../../../../utils/math';
import Skull from '../../../../../elements/skull/Skull';

const SceneSkull = memo(function SceneSkull({
  position,
  rotation,
  scale,
  visible,
  ...skullControls
}) {
  const skullPosition = useMemo(
    () => [position.x, position.y, position.z],
    [position.x, position.y, position.z]
  );

  const skullRotation = useMemo(
    () => [radians(rotation.x), radians(rotation.y), radians(rotation.z)],
    [rotation.x, rotation.y, rotation.z]
  );

  return (
    <Skull
      {...skullControls}
      position={skullPosition}
      rotation={skullRotation}
      scale={scale}
      visible={visible}
    />
  );
});

export default SceneSkull;
