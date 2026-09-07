import { useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';

import * as THREE from 'three/webgpu';

import bakeCookie, { COOKIE_URL } from '../utils/flashlightCookie';

// The lamp's shared state. The cone has two consumers that must agree — the
// spotlight lighting the stone, and the volumetric marching the same cone
// through the air — so the frame they both read is built once, here, rather
// than derived twice from a scene graph that only half describes it.
//
// A SpotLight's own matrixWorld carries no aim: three points the shadow camera
// at the target and leaves the light object unrotated. So the beam frame has
// to be composed explicitly or the volume marches a cone pointing down world
// -Z while the walls are lit somewhere else entirely.
export default function useFlashlight(config) {
  const loaded = useTexture(COOKIE_URL);

  const cookie = useMemo(
    () =>
      bakeCookie(loaded, {
        gain: config.beamLensGain,
        lift: config.beamLensLift,
      }),
    [config.beamLensGain, config.beamLensLift, loaded]
  );
  useEffect(() => () => cookie?.dispose(), [cookie]);

  const beam = useMemo(
    () => ({
      frame: new THREE.Object3D(),
      matrix: new THREE.Matrix4(),
      origin: new THREE.Vector3(),
      aim: new THREE.Vector3(),
      ready: false,
    }),
    []
  );

  return useMemo(() => ({ beam, cookie }), [beam, cookie]);
}

useTexture.preload(COOKIE_URL);
