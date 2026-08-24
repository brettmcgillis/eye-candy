import React, { useCallback, useMemo, useRef } from 'react';

import * as THREE from 'three';

import ExplodingMaterial from '@materials/WebGL/explodingMaterial';

const Cube = React.memo(function Cube({
  position,
  rotation = [0.2, 0.35, 0.1],
  showPointerRadiusDebug,
  pointerRadius,
  ...materialProps
}) {
  const meshRef = useRef();
  const materialRef = useRef();
  const debugRef = useRef();
  const geometry = useMemo(
    () => new THREE.BoxGeometry(1.25, 1.25, 1.25, 12, 12, 12),
    []
  );
  const showDebugRef = useRef(showPointerRadiusDebug);
  showDebugRef.current = showPointerRadiusDebug;

  const onPointerMove = useCallback((e) => {
    e.stopPropagation();
    materialRef.current?.handlePointerMove(e);
    if (debugRef.current) {
      debugRef.current.visible = !!showDebugRef.current;
    }
  }, []);

  const onPointerLeave = useCallback(() => {
    materialRef.current?.handlePointerLeave();
    if (debugRef.current) debugRef.current.visible = false;
  }, []);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        rotation={rotation}
        geometry={geometry}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
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
});

export default Cube;
