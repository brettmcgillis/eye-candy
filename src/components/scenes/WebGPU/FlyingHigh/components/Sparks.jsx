import React, { memo, useEffect, useMemo } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import createEmbers from '@modules/embers';

import { EXHAUSTS } from '../utils/plumes';

const xyz = (v) => [v.x, v.y, v.z];

// Sparks spat out of the back of each burning engine and swept aft by the
// airflow, in the plane's own space so they ride along with it.
function Sparks({ config }) {
  const gl = useThree((state) => state.gl);
  const litKey = EXHAUSTS.map(({ key }) => Boolean(config[key])).join();
  const sparks = useMemo(() => {
    const vents = EXHAUSTS.filter(
      (_, i) => litKey.split(',')[i] === 'true'
    ).map(({ at, out }) => ({ at, out }));
    return vents.length
      ? createEmbers({ count: config.emberCount, vents })
      : null;
  }, [config.emberCount, litKey]);
  useEffect(() => () => sparks?.dispose(), [sparks]);

  if (sparks) {
    const u = sparks.uniforms;
    u.buoyancy.value = config.emberBuoyancy;
    u.glow.value = config.emberGlow;
    u.life.value = config.emberLife;
    u.size.value = config.emberSize;
    u.speed.value = config.emberSpeed;
    u.streak.value = config.emberStreak;
    u.turbulence.value = config.emberTurbulence;
    u.wind.value.set(...xyz(config.emberWind));
  }

  useFrame((state, delta) => {
    sparks?.advance(gl, delta);
  }, -1);

  return sparks ? <primitive object={sparks.mesh} /> : null;
}

export default memo(Sparks);
