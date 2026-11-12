import React, { memo, useMemo } from 'react';

import Skull from '@elements/Skull/Skull';
import { usePaintMaterialTransform } from '@modules/paintedRender';
import { radians } from '@utils/math';

const SceneSkull = memo(function SceneSkull({
  paintConfig,
  position,
  rotation,
  scale,
  visible,
  ...skullControls
}) {
  const materialTransform = usePaintMaterialTransform(
    paintConfig,
    '#8d7f75',
    'specimen',
    'skull'
  );
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
      materialTransform={materialTransform}
      userData={{ plotAnatomy: 'skull' }}
      {...skullControls}
      position={skullPosition}
      rotation={skullRotation}
      scale={scale}
      visible={visible}
    />
  );
});

export default SceneSkull;
