import { useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { sphericalToPosition } from '@modules/lightingRig';
import {
  bakePlumeGuide,
  createPlumeUniforms,
  createPlumeVolume,
  createSpotTexture,
  plumeBounds,
  plumePointsTexture,
  updatePlumeCamera,
  writeSpot,
} from '@modules/plumeVolume';
import { sharedNoise } from '@utils/tileableNoise3d';

import {
  BEAM_COUNT,
  HEADLIGHT_BEAMS,
  SIREN_BEAMS,
  alarmLevel,
  sirenDirection,
} from '../utils/beams';
import { OPENINGS } from '../utils/cruiser';
import { PATH_SAMPLES, buildTrails } from '../utils/trails';

const DEG = Math.PI / 180;
const BOUNDS = { cell: 0.4, margin: 4.5 };
const BLEND = 0.2;
const OFF = new THREE.Color(0, 0, 0);
const dir = new THREE.Vector3();
const color = new THREE.Color();

const layoutOf = (config) => ({
  drift: config.plumeDrift,
  gather: config.plumeGather,
  height: config.plumeHeight,
  lean: config.plumeLean,
  twist: config.plumeTwist,
});

// The burning car's fire and smoke for PostStack to march and composite:
// one trail per vent, rebuilt (and the guide rebaked) when the column's
// shape or a vent toggle changes, everything else a uniform. Each frame the
// light bar's beams and the alarm-flashed headlamps are written as spot
// lights, so they sweep through the smoke and the haze round the car.
export default function useFireVolume(config) {
  const u = useMemo(createPlumeUniforms, []);
  const layout = layoutOf(config);
  const layoutKey = Object.values(layout).join();
  const trails = useMemo(() => buildTrails(layout), [layoutKey]);
  const bounds = useMemo(() => plumeBounds(trails, BOUNDS), [trails]);
  const points = useMemo(
    () => plumePointsTexture(trails, PATH_SAMPLES),
    [trails]
  );
  const enabledKey = OPENINGS.map(({ key }) => Boolean(config[key])).join();
  const guide = useMemo(() => {
    const lit = new Set(
      OPENINGS.filter((_, i) => enabledKey.split(',')[i] === 'true').map(
        ({ key }) => key
      )
    );
    return bakePlumeGuide(
      trails,
      trails.map(({ key }) => lit.has(key)),
      bounds
    );
  }, [bounds, enabledKey, trails]);
  const spots = useMemo(() => createSpotTexture(BEAM_COUNT), []);
  useEffect(() => () => guide.dispose(), [guide]);
  useEffect(() => () => points.dispose(), [points]);
  useEffect(() => () => spots.dispose(), [spots]);

  const volume = useMemo(
    () => ({
      node: createPlumeVolume({
        blend: BLEND,
        bounds,
        guide,
        noise: sharedNoise(),
        pathSamples: PATH_SAMPLES,
        points,
        spotTexture: spots,
        spots: BEAM_COUNT,
        u,
      }),
    }),
    [bounds, guide, points, spots, u]
  );
  volume.resolution = config.plumeResolution;
  volume.lit = enabledKey.includes('true');

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
  u.lick.value.set(
    config.plumeLick,
    config.plumeLickSpeed,
    config.plumeLickScale,
    config.plumeLickStretch
  );
  u.detail.value.set(
    config.plumeErosion,
    config.plumeDetailScale,
    config.plumeStepSize,
    config.plumeSteps
  );
  u.haze.value.set(
    config.hazeDensity,
    config.hazeStep,
    config.hazeSmoke,
    config.hazeHeight
  );
  u.lightDir.value
    .set(
      ...sphericalToPosition({
        azimuth: config.lightKeyAzimuth,
        elevation: config.lightKeyElevation,
        radius: 1,
      })
    )
    .normalize();
  u.lightCol.value
    .set(config.lightKeyColor)
    .multiplyScalar(
      (config.lightKeyEnabled ? config.lightKeyIntensity : 0) * config.plumeSun
    );
  u.ambHi.value
    .set(config.plumeAmbientColor)
    .multiplyScalar(config.plumeAmbient);
  u.ambLo.value.copy(u.ambHi.value).multiplyScalar(config.plumeCoreAmbient);

  // After the orbit controls (priority -1), so the volume sees this frame's
  // camera.
  useFrame((state, delta) => {
    const { camera, clock, gl } = state;
    updatePlumeCamera(u, camera, gl);
    u.time.value += Math.min(delta, 1 / 15);
    const t = clock.elapsedTime;
    const sirenCos = [
      Math.cos(config.sirenAngle * DEG),
      Math.cos(config.sirenAngle * 0.45 * DEG),
    ];
    SIREN_BEAMS.forEach((beam, i) => {
      color.set(config[beam.colorKey]);
      writeSpot(spots, i, {
        color: config.sirenOn
          ? color.multiplyScalar(config.sirenIntensity * config.sirenHaze)
          : OFF,
        cosInner: sirenCos[1],
        cosOuter: sirenCos[0],
        dir: sirenDirection(beam, t, config.sirenSpeed, dir),
        position: { x: beam.at[0], y: beam.at[1], z: beam.at[2] },
        range: config.sirenDistance * 1.6,
      });
    });
    const alarm = config.headlightOn ? alarmLevel(t, config.headlightRate) : 0;
    HEADLIGHT_BEAMS.forEach((beam, i) => {
      color
        .set(config.headlightColor)
        .multiplyScalar(config.headlightBeam * config.headlightHaze * alarm);
      writeSpot(spots, SIREN_BEAMS.length + i, {
        color,
        cosInner: Math.cos(config.headlightAngle * 0.5 * DEG),
        cosOuter: Math.cos(config.headlightAngle * DEG),
        dir: beam.dir,
        position: beam.at,
        range: config.headlightRange * 1.4,
      });
    });
    spots.needsUpdate = true;
  }, 0);

  return volume;
}
