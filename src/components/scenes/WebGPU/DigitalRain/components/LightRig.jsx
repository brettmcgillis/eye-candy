import React, { memo, useMemo } from 'react';

// Minimal PBR fill for the parts of the scene that need real lights —
// PhotoBackdrop/PhotoStudioSet's materials are MeshStandardNodeMaterial/PBR
// and need a key + ambient term to read as lit rather than flat. The key
// light also casts shadows so VoxelCloud (castShadow/receiveShadow already
// set on its mesh) projects onto PhotoBackdrop's floor/wall.
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
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0005}
      />
    </>
  );
}

export default memo(LightRig);
