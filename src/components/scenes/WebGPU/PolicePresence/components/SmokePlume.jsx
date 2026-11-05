import React, { memo, useEffect, useMemo } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { sphericalToPosition } from '@modules/lightingRig';

import createSmokePlume from '../utils/smokePlume';

const eye = new THREE.Vector3();
const xyz = (v) => [v.x, v.y, v.z];

function SmokePlume({ config }) {
  const gl = useThree((state) => state.gl);
  const plume = useMemo(
    () => createSmokePlume({ count: config.plumeCount }),
    [config.plumeCount]
  );
  useEffect(() => () => plume.dispose(), [plume]);

  const u = plume.uniforms;
  u.ambient.value = config.plumeAmbient;
  u.ashColor.value.set(config.plumeAshColor);
  u.emitCentre.value.set(...xyz(config.plumeEmitCentre));
  u.emitSize.value.set(...xyz(config.plumeEmitSize));
  u.glow.value = config.plumeGlow;
  u.glowColor.value.set(config.plumeGlowColor);
  u.glowHeight.value = config.plumeGlowHeight;
  u.growth.value = config.plumeGrowth;
  u.life.value = config.plumeLife;
  u.lightDir.value
    .set(
      ...sphericalToPosition({
        azimuth: config.lightKeyAzimuth,
        elevation: config.lightKeyElevation,
        radius: 1,
      })
    )
    .normalize();
  u.opacity.value = config.plumeOpacity;
  u.rise.value = config.plumeRise;
  u.seed.value = Math.round(config.plumeSeed);
  u.shear.value = config.plumeShear;
  u.size.value = config.plumeSize;
  u.slowdown.value = config.plumeSlowdown;
  u.sootColor.value.set(config.plumeSootColor);
  u.spread.value = config.plumeSpread;
  u.sun.value = config.plumeSun;
  u.thinning.value = config.plumeThinning;
  u.turbScale.value = config.plumeTurbScale;
  u.turbulence.value = config.plumeTurbulence;
  u.wind.value.set(...xyz(config.plumeWind));

  useFrame((state, delta) => {
    plume.advance(gl, delta, state.camera.getWorldPosition(eye));
  }, -1);

  return <primitive object={plume.mesh} />;
}

export default memo(SmokePlume);
