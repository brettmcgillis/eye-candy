import React from 'react';

import { PerspectiveCamera } from '@react-three/drei';

import Bret from 'components/elements/bret/Bret';
import { InteractiveReversal } from 'components/elements/reversal/Reversal';

export default function TestScene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 3]} />

      <color attach="background" args={['#646464']} />

      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 6, 4]} intensity={1.2} />

      <InteractiveReversal
        position={[-1, 0, -1]}
        rotation={[0, -Math.PI / 4, 0]}
      />
      <InteractiveReversal position={[0, 0, 0]} />
      <InteractiveReversal
        position={[1, 0, -1]}
        rotation={[0, Math.PI / 4, 0]}
      />

      <Bret scale={2.5} position={[0, 0, -2]} />
    </>
  );
}
