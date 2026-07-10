import React, { memo, useEffect, useRef } from 'react';

import HummingBird from '../../../../../elements/HummingBird/HummingBird';

const CLIP_NAME = 'Take 001';

// Mounts the animated hummingbird and hands its skinned meshes up to the
// particle system. The rig keeps animating (mixer + bone matrices) even when
// hidden — the particles are driven from the skeleton, not the pixels.
function BirdRig({ visible, timeScale, onReady }) {
  const groupRef = useRef(null);

  useEffect(() => {
    const meshes = [];
    groupRef.current?.traverse((object) => {
      if (object.isSkinnedMesh) meshes.push(object);
    });
    if (meshes.length) onReady(meshes);
  }, [onReady]);

  return (
    <group ref={groupRef} visible={visible}>
      <HummingBird clip={CLIP_NAME} timeScale={timeScale} />
    </group>
  );
}

export default memo(BirdRig);
