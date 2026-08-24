import React, { memo, useMemo } from 'react';

import Skull from '@elements/Skull/Skull';
import { radians } from '@utils/math';

const SKULL_VISIBILITY = {
  showCranium: true,
  showLeftZygomatic: true,
  showOccipital: true,
  showRightLacrimal: true,
  showRightMaxilla: true,
  showRightNasal: true,
  showRightPalatine: true,
  showRightParietal: true,
  showRightTemporal: true,
  showRightZygomatic: true,
  showSphenoid: true,
  showTeeth: false,
  showVomer: true,
  showEthmoid: true,
  showFrontal: true,
  showInferiorConchae: true,
  showLeftLacrimal: true,
  showLeftMaxilla: true,
  showLeftNasal: true,
  showLeftPalatine: true,
  showLeftParietal: true,
  showLeftTemporal: true,
  showMandible: false,
  showMandibleBone: false,
  showMandibleTeeth: false,
};

const SceneSkull = memo(function SceneSkull({ position, rotation, scale }) {
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
      {...SKULL_VISIBILITY}
      position={skullPosition}
      rotation={skullRotation}
      scale={scale}
    />
  );
});

export default SceneSkull;
