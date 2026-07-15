import React, { memo, useMemo } from 'react';

// Minimal PBR fill for the parts of the scene that need real lights — the
// raymarched CloudVolume shades itself, but VoxelCutout's InstancedMesh and
// PhotoBackdrop's material are both MeshStandardNodeMaterial and need a key +
// ambient term to read as lit rather than flat.
function LightRig({ config }) {
  const keyPosition = useMemo(
    () => [
      config.lightKeyPosition.x,
      config.lightKeyPosition.y,
      config.lightKeyPosition.z,
    ],
    [config.lightKeyPosition]
  );

  return (
    <>
      <hemisphereLight
        args={['#2a3a66', '#050608', config.lightAmbientIntensity]}
      />
      <directionalLight
        color={config.lightKeyColor}
        intensity={config.lightKeyIntensity}
        position={keyPosition}
      />
    </>
  );
}

export default memo(LightRig);
