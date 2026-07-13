import React, { memo } from 'react';

import { useFrame } from '@react-three/fiber';

import useFlockSimulation from '../hooks/useFlockSimulation';
import FireflySwarm from './FireflySwarm';
import GridDebug from './GridDebug';
import Hunters from './Hunters';
import Obstacles from './Obstacles';

// Owns the one authoritative simulation step; the renderers below are
// purely visual and never touch the sim themselves — see FireflySwarm's
// header comment for the one-frame-lag tradeoff that comes with that split.
function Swarm({ config }) {
  const { simRef, step } = useFlockSimulation(config);

  useFrame((_state, delta) => {
    step(delta);
  });

  return (
    <>
      <FireflySwarm config={config} simRef={simRef} />
      <Hunters config={config} simRef={simRef} />
      <Obstacles config={config} simRef={simRef} />
      <GridDebug config={config} simRef={simRef} />
    </>
  );
}

export default memo(Swarm);
