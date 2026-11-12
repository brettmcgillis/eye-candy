import { useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import {
  bakePlumeGuide,
  createPlumeUniforms,
  createPlumeVolume,
  plumeBounds,
  plumePointsTexture,
  updatePlumeCamera,
} from '@modules/plumeVolume';
import { sharedNoise } from '@utils/tileableNoise3d';

import { PATH_SAMPLES, PLUMES } from '../utils/plumes';

// Nightscape's cloud light, so the smoke sits in the same light as the sky:
// cool moonlight and night ambient blending to sunlight and day ambient.
const MOON = new THREE.Color(0.74, 0.84, 1).multiplyScalar(3.1);
const SUN = new THREE.Color(1, 0.97, 0.92).multiplyScalar(26);
const AMB_LO = [
  new THREE.Color(0.006, 0.0085, 0.017),
  new THREE.Color(0.1, 0.14, 0.22),
];
const DUSK = new THREE.Color(1, 0.62, 0.36).multiplyScalar(14);
const WHITE = new THREE.Color(1, 1, 1);
const DUSK_SKY = new THREE.Color(1.2, 0.82, 0.68);
const skyTint = new THREE.Color();
const AMB_HI = [
  new THREE.Color(0.04, 0.06, 0.118),
  new THREE.Color(0.38, 0.5, 0.72),
];

// The fire and smoke volume for SkyGrade to march at reduced resolution and
// composite over the frame: guide and trail data built once (the guide again
// when a trail is switched), uniforms from the controls, and the scene
// camera, plane and day/night blend read each frame.
export default function usePlumeVolume(config, planeRef, cycle) {
  const u = useMemo(createPlumeUniforms, []);
  const bounds = useMemo(() => plumeBounds(PLUMES), []);
  const points = useMemo(() => plumePointsTexture(PLUMES, PATH_SAMPLES), []);
  const enabledKey = PLUMES.map(({ key }) => Boolean(config[key])).join();
  const guide = useMemo(
    () =>
      bakePlumeGuide(
        PLUMES,
        enabledKey.split(',').map((v) => v === 'true'),
        bounds
      ),
    [bounds, enabledKey]
  );
  useEffect(() => () => guide.dispose(), [guide]);
  useEffect(() => () => points.dispose(), [points]);
  const volume = useMemo(
    () => ({
      node: createPlumeVolume({
        bounds,
        guide,
        noise: sharedNoise(),
        pathSamples: PATH_SAMPLES,
        points,
        u,
      }),
    }),
    [bounds, guide, points, u]
  );
  volume.resolution = config.plumeResolution;

  u.albedo.value.set(config.plumeSmokeColor);
  u.glowCol.value.set(config.plumeGlowColor);
  u.hot.value.set(config.plumeFireHot);
  u.mid.value.set(config.plumeFireMid);
  u.cool.value.set(config.plumeFireCool);
  u.flow.value.set(
    config.plumeSpeed,
    config.plumeBillow,
    config.plumeBillowScale,
    config.plumeDensity
  );
  u.shape.value.set(
    config.plumeRadiusStart,
    config.plumeRadiusEnd,
    config.plumeTopFade,
    config.plumeSoot
  );
  u.fire.value.set(
    config.plumeFireShare,
    config.plumeFireIntensity,
    config.plumeGlow,
    config.plumeShadow
  );
  u.detail.value.set(
    config.plumeErosion,
    config.plumeDetailScale,
    config.plumeStepSize,
    config.plumeSteps
  );

  // After the orbit controls (priority -1), so the volume sees this frame's
  // camera and plane.
  useFrame((state, delta) => {
    const { camera, gl } = state;
    updatePlumeCamera(u, camera, gl);
    u.time.value += Math.min(delta, 1 / 15);
    const { day, glow, keyI, keyWorld, warm } = cycle.current;
    u.lightDir.value.copy(keyWorld);
    u.lightCol.value
      .copy(MOON)
      .lerp(SUN, day)
      .lerp(DUSK, 0.8 * warm);
    u.lightCol.value.multiplyScalar(keyI);
    u.ambLo.value.copy(AMB_LO[0]).lerp(AMB_LO[1], day);
    u.ambHi.value
      .copy(AMB_HI[0])
      .lerp(AMB_HI[1], day)
      .multiply(skyTint.copy(WHITE).lerp(DUSK_SKY, 0.7 * glow));
    if (planeRef.current) {
      planeRef.current.updateMatrixWorld();
      u.toLocal.value.copy(planeRef.current.matrixWorld).invert();
    }
  }, 0);

  return volume;
}
