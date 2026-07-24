import React, { memo } from 'react';

// The visible orb standing in for the godray source, matching
// webgpu_postprocessing_godrays.html's lightSphere. Emissive (not
// MeshBasicMaterial) so it reads as a rounded glowing orb rather than a flat
// unlit disc — MeshBasicMaterial ignores normals, so a sphere under it renders
// with no shading gradient at all. The light itself lives in LightingRig; this
// is scene decoration only.
function LightMarker({ color, position, size }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3}
        roughness={0.35}
        toneMapped={false}
      />
    </mesh>
  );
}

export default memo(LightMarker);
