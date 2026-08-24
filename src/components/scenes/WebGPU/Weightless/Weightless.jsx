import React, { useRef, useState } from 'react';

import * as THREE from 'three/webgpu';

import { CameraRig } from '@modules/cameraRig';

import CurlTrails from './components/CurlTrails';
import ParticleBird from './components/ParticleBird';
import PostEffects from './components/PostEffects';
import useSceneControls from './hooks/useSceneControls';

// Weightless — a hummingbird rendered as motion. Two systems share the
// animated rig: a GPU particle sim (particles swirl on/within the bird and
// fly off the beating wings) and CPU curl-noise ribbon trails ported from
// three-sketches (interior free-flow + exterior surface walkers).
// Each system has an enable toggle; presets (Curl Trails / Particle Bird /
// Everything) differentiate the looks per scene conventions §9.
export default function Weightless() {
  const config = useSceneControls();
  const [meshes, setMeshes] = useState(null);

  // Rig state published by ParticleBird each frame, consumed by CurlTrails.
  const birdStateRef = useRef({
    fitted: false,
    skeleton: null,
    boneMatrices: null,
    normMatrix: new THREE.Matrix4(),
    normScale: 1,
  });

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={[config.bgColor]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} />
      <ParticleBird
        config={config}
        birdStateRef={birdStateRef}
        onMeshes={setMeshes}
      />
      {config.trailsEnabled && meshes && (
        <CurlTrails
          config={config}
          meshes={meshes}
          birdStateRef={birdStateRef}
        />
      )}
      <PostEffects
        enabled={config.afterimageEnabled}
        damp={config.afterimageDamp}
      />
    </>
  );
}
