import React, { memo, useEffect, useMemo } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import createEmbers from '@modules/embers';

import { OPENINGS, ROOF_Y } from '../utils/cruiser';

const xyz = (v) => [v.x, v.y, v.z];

function Embers({ config }) {
  const gl = useThree((state) => state.gl);
  const litKey = OPENINGS.map(({ key }) => Boolean(config[key])).join();
  const embers = useMemo(() => {
    const lit = OPENINGS.filter((_, i) => litKey.split(',')[i] === 'true');
    const vents = lit.flatMap(({ vents: list }) =>
      list.map(({ at, core, out }) => ({
        at: core ? [at[0], ROOF_Y, at[2]] : at,
        out,
      }))
    );
    return vents.length
      ? createEmbers({ count: config.emberCount, vents })
      : null;
  }, [config.emberCount, litKey]);
  useEffect(() => () => embers?.dispose(), [embers]);

  if (embers) {
    const u = embers.uniforms;
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
    embers?.advance(gl, delta);
  }, -1);

  return embers ? <primitive object={embers.mesh} /> : null;
}

export default memo(Embers);
