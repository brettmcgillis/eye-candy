import React from 'react';

import { OrbitControls, PerspectiveCamera, Splat } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function Rosie() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 1]} near={1} far={10} />
      <OrbitControls />

      <color attach="background" args={['#FFFFF']} />
      <Splat
        src={modelFile('rosie_1.splat')}
        position={[-1, 0, 0]}
        rotation={[0, Math.PI / 4, 0]}
      />
      <Splat
        src={modelFile('rosie_2.splat')}
        position={[0, 0, -1]}
        rotation={[0, 0, 0]}
      />
      <Splat
        src={modelFile('rosie_3.splat')}
        position={[1, 0, 0]}
        rotation={[0, -Math.PI / 4, 0]}
      />
    </>
  );
}
