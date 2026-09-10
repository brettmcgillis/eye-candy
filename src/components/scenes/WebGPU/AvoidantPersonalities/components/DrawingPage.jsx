import React, { memo } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import useWalkPipeline from '../hooks/useWalkPipeline';

// A pixel-space porthole with one quad filling it exactly, so the drawing is
// always edge to edge and the field maps to the window one texel per pixel of
// field resolution.
//
// Must be drei's <OrthographicCamera>, not the raw primitive: `makeDefault` is
// a drei convention that calls the R3F store's set({ camera }) in an effect,
// and the raw primitive ignores it — leaving a small quad adrift in the middle
// of an otherwise empty frame.
function DrawingPage({ config }) {
  const size = useThree((state) => state.size);
  const material = useWalkPipeline(config);

  return (
    <>
      <OrthographicCamera
        makeDefault
        manual
        bottom={size.height}
        far={10000}
        left={0}
        near={-10000}
        position={[0, 0, 100]}
        right={size.width}
        top={0}
      />
      <mesh
        frustumCulled={false}
        material={material}
        position={[size.width / 2, size.height / 2, -1]}
        scale={[size.width, size.height, 1]}
      >
        <planeGeometry args={[1, 1]} />
      </mesh>
    </>
  );
}

export default memo(DrawingPage);
