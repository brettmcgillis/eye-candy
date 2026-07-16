import React, { memo } from 'react';

const SHADOW_NEAR = 0.05;

// The godrays centerpiece: a shadow-casting point light "in the center"
// (todo.md) that the swarm flows around, its own geometry (castShadow is
// already set on the InstancedMeshes in utils/createAttractorSwarm.js)
// occluding the beam as leaves/petals pass through it — GodraysNode reads
// this light's shadow map directly, so it must actually cast shadows
// (unlike a purely-decorative fill light). A small marker sphere shows the
// light's position, matching webgpu_postprocessing_godrays.html's
// lightSphere — emissive (not MeshBasicMaterial) so it still reads as a
// rounded glowing orb rather than a flat unlit disc; MeshBasicMaterial
// ignores normals entirely, so a sphere under it renders with no shading
// gradient at all.
//
// shadow.camera.near/far matter a lot more here than they look: three.js's
// PointLightShadow defaults to far=500 (calibrated for room/building-scale
// scenes, like the reference godrays demo's ~400-unit set). Left at the
// default, the shadow map's 1024² texels spread across a box 500 units
// wide — leaf/petal occluders are a tiny fraction of a single texel and
// barely register, and GodraysNode's distance-attenuation curve (calibrated
// against shadow.camera.far) stays nearly flat across a scene this small.
// `volumeSize` is its own control (Godrays.godraysVolumeSize) rather than
// deriving from worldScale — the swarm's spatial spread and the shadow/
// raymarch box's calibration are different concerns: shrinking one to fix
// the other forces the whole scene to shrink just to get sharper shadows.
function CenterLight({ color, intensity, lightRef, position, volumeSize }) {
  return (
    <>
      <pointLight
        ref={lightRef}
        castShadow
        color={color}
        intensity={intensity}
        position={position}
        shadow-bias={-0.0005}
        shadow-camera-far={volumeSize}
        shadow-camera-near={SHADOW_NEAR}
        shadow-mapSize={[1024, 1024]}
      />
      <mesh position={position}>
        <sphereGeometry args={[0.12, 16, 16]} />
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
