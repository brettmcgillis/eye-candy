import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import ExplodingMaterial from './explodingMaterial';

export default function Plane({
  position,
  rotation = [-0.5, 0.4, 0],
  showPointerRadiusDebug,
  pointerRadius,
  ...materialProps
}) {
  const meshRef = useRef();
  const materialRef = useRef();
  const debugRef = useRef();
  const geometry = useMemo(() => new THREE.PlaneGeometry(2.2, 1.6, 24, 18), []);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        rotation={rotation}
        geometry={geometry}
        onPointerMove={(e) => {
          e.stopPropagation();
          materialRef.current?.handlePointerMove(e);
          if (debugRef.current) {
            debugRef.current.visible = !!showPointerRadiusDebug;
          }
        }}
        onPointerLeave={() => {
          materialRef.current?.handlePointerLeave();
          if (debugRef.current) debugRef.current.visible = false;
        }}
      >
        <ExplodingMaterial
          ref={materialRef}
          meshRef={meshRef}
          pointerRadius={pointerRadius}
          {...materialProps}
        />
      </mesh>
      <mesh ref={debugRef} visible={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ff2d2d"
          wireframe
          toneMapped={false}
          depthTest={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
