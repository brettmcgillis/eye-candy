/* eslint-disable no-unused-vars */

/* eslint-disable react/no-array-index-key */
import React, { Suspense, useRef } from 'react';

import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import Loader from '../../../app/scaffold/loader/Loader';
import Bret from '../../elements/bret/Bret';
import { InteractiveReversal } from '../../elements/reversal/Reversal';

function OrbitingReversals({ count = 4, radius = 2, speed = 0.25 }) {
  const group = useRef();
  const step = (Math.PI * 2) / count;

  useFrame((_, delta) => {
    group.current.rotation.y += delta * speed;
  });

  return (
    <group ref={group}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = i * step;

        // note sin/cos order (0 starts on +Z, not +X)
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        return (
          <InteractiveReversal
            key={i}
            position={[x, 0, z]}
            rotation={[0, angle, 0]}
          />
        );
      })}
    </group>
  );
}

export default function TestScene() {
  return (
    <Suspense fallback={<Loader />}>
      <PerspectiveCamera makeDefault position={[0, 0, 3]} />

      <color attach="background" args={['#646464']} />

      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 6, 4]} intensity={1.2} />

      {/* Orbiting ring */}

      <OrbitingReversals count={6} radius={1.2} speed={0.6} />

      {/* Center vertical element */}
      <Bret scale={1.5} position={[0, 0.05, 0]} rotation={[0, 0, 0]} />
    </Suspense>
  );
}
