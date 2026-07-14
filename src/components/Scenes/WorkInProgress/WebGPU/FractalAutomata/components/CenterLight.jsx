import React, { memo } from 'react';

const LIGHT_POSITION = [0, 0, 0];
const SHADOW_NEAR = 0.05;

// Godrays centerpiece, adapted from Windswept/components/CenterLight.jsx (not
// shared via import per docs/scene-conventions.md §6): a shadow-casting point
// light at the grid's geometric center — VoxelField centers cell positions
// around the origin, so this sits at the structure's core and the growing
// cells occlude the beam as they reveal around it. shadow-camera-far is
// driven by `volumeSize` (godraysVolumeSize, default sized to this scene's
// actual grid extent in FractalAutomata.jsx) rather than three.js's
// far=500 default, which would spread the shadow map's fixed texel budget
// across a box far bigger than this scene and flatten the raymarch
// attenuation curve — the same gotcha Windswept's version documents.
function CenterLight({ color, intensity, lightRef, volumeSize }) {
  return (
    <>
      <pointLight
        ref={lightRef}
        castShadow
        color={color}
        intensity={intensity}
        position={LIGHT_POSITION}
        shadow-bias={-0.0005}
        shadow-camera-far={volumeSize}
        shadow-camera-near={SHADOW_NEAR}
        shadow-mapSize={[1024, 1024]}
      />
      <mesh position={LIGHT_POSITION}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3}
          roughness={0.35}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

export default memo(CenterLight);
