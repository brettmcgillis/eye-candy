import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

export default function Environment({
  cameraPosition,
  cameraTarget,
  controls,
}) {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={controls.cameraFov}
        position={cameraPosition}
      />
      <OrbitControls makeDefault target={cameraTarget} />
      <color attach="background" args={[controls.sceneBackgroundColor]} />
      <ambientLight intensity={controls.ambientIntensity} />
      <directionalLight
        castShadow
        intensity={controls.directionalIntensity}
        position={[
          controls.directionalX,
          controls.directionalY,
          controls.directionalZ,
        ]}
      />
      <hemisphereLight
        color={controls.hemiSkyColor}
        groundColor={controls.hemiGroundColor}
        intensity={controls.hemiIntensity}
      />
    </>
  );
}
