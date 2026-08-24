import React, { useEffect, useMemo, useRef } from 'react';

import * as THREE from 'three';

const EDGE_SPECS = [
  { axis: 'x', pos: [0, -0.5, -0.5] },
  { axis: 'x', pos: [0, -0.5, 0.5] },
  { axis: 'x', pos: [0, 0.5, -0.5] },
  { axis: 'x', pos: [0, 0.5, 0.5] },
  { axis: 'y', pos: [-0.5, 0, -0.5] },
  { axis: 'y', pos: [-0.5, 0, 0.5] },
  { axis: 'y', pos: [0.5, 0, -0.5] },
  { axis: 'y', pos: [0.5, 0, 0.5] },
  { axis: 'z', pos: [-0.5, -0.5, 0] },
  { axis: 'z', pos: [-0.5, 0.5, 0] },
  { axis: 'z', pos: [0.5, -0.5, 0] },
  { axis: 'z', pos: [0.5, 0.5, 0] },
];

const THICKNESS_SCALE = 0.002;

export default function ParticleBounds({
  centerY,
  centerZ,
  depth,
  size,
  lineColor,
  lineWeight,
}) {
  const boundsRef = useRef(null);
  const dummyRef = useRef(new THREE.Object3D());

  const { geometry, material } = useMemo(() => {
    return {
      geometry: new THREE.BoxGeometry(1, 1, 1),
      material: new THREE.MeshBasicMaterial({
        color: new THREE.Color(lineColor),
        transparent: true,
        opacity: 0.72,
        toneMapped: false,
      }),
    };
  }, [lineColor]);

  useEffect(() => {
    material.color.set(lineColor);
  }, [lineColor, material]);

  useEffect(() => {
    const bounds = boundsRef.current;
    if (!bounds) return;

    const dummy = dummyRef.current;
    const thickness = Math.max(0.0001, lineWeight * THICKNESS_SCALE);

    EDGE_SPECS.forEach((spec, index) => {
      const [x, y, z] = spec.pos;
      dummy.position.set(x, y, z);

      if (spec.axis === 'x') {
        dummy.scale.set(1, thickness, thickness);
      } else if (spec.axis === 'y') {
        dummy.scale.set(thickness, 1, thickness);
      } else {
        dummy.scale.set(thickness, thickness, 1);
      }

      dummy.updateMatrix();
      bounds.setMatrixAt(index, dummy.matrix);
    });

    bounds.instanceMatrix.needsUpdate = true;
  }, [lineWeight]);

  return (
    <instancedMesh
      ref={boundsRef}
      args={[geometry, material, EDGE_SPECS.length]}
      position={[0, centerY, centerZ]}
      scale={[size, size, depth]}
    />
  );
}
