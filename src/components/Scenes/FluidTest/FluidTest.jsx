import React, { useRef } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import FluidMaterial from './FluidMaterial';

function FullscreenPlane() {
  const { viewport } = useThree();
  const mat = useRef();

  return (
    <mesh
      scale={[viewport.width, viewport.height, 1]}
      onPointerMove={(e) => {
        mat.current?.setPoints([{ x: e.uv.x, y: e.uv.y }]);
      }}
      onPointerLeave={() => {
        mat.current?.setPoints([]);
      }}
    >
      <planeGeometry args={[1, 1]} />
      <FluidMaterial ref={mat} />
    </mesh>
  );
}

export default function FluidTest() {
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 10]} />
      <FullscreenPlane />
    </>
  );
}
