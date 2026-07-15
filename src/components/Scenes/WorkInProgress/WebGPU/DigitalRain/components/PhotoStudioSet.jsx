import React, { memo, useMemo } from 'react';

import PhotoStudio from '../../../../../elements/PhotoStudio/PhotoStudio';

// Thin wrapper around the reusable PhotoStudio model (elements/PhotoStudio)
// with the scene's position/scale/rotation controls — an alternative to
// PhotoBackdrop's procedural cyclorama sweep (see todo.md's "replace
// backdrop with the photo studio model/component"). Kept toggleable
// alongside PhotoBackdrop rather than replacing it outright.
function PhotoStudioSet({ config }) {
  const position = useMemo(
    () => [
      config.photoStudioPosition.x,
      config.photoStudioPosition.y,
      config.photoStudioPosition.z,
    ],
    [config.photoStudioPosition]
  );
  const rotation = useMemo(
    () => [0, config.photoStudioRotationY, 0],
    [config.photoStudioRotationY]
  );

  if (!config.photoStudioVisible) {
    return null;
  }

  return (
    <PhotoStudio
      position={position}
      scale={config.photoStudioScale}
      rotation={rotation}
    />
  );
}

export default memo(PhotoStudioSet);
