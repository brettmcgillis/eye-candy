import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useRef, useState } from 'react';

const FORWARD = new THREE.Vector3(0, 0, 1);
const dummy = new THREE.Object3D();

// InstancedMesh<RingGeometry> for hex-trees.js's decorative circleProb
// nodes — a single shared color/opacity (circleColor/circleOpacity), unlike
// BranchField's per-instance palette gradient, so this only needs one
// unlit material with no instanceColor bookkeeping.
function CircleField({ circles, circleColor, circleOpacity }) {
  const meshRef = useRef(null);
  const [renderObject, setRenderObject] = useState(null);

  useEffect(() => {
    const count = Math.max(circles.length, 1);
    const geometry = new THREE.RingGeometry(0.8, 1, 24);
    const material = new THREE.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.count = circles.length;

    circles.forEach((circle, i) => {
      dummy.position.copy(circle.center);
      dummy.quaternion.setFromUnitVectors(FORWARD, circle.normal);
      dummy.scale.setScalar(circle.radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    meshRef.current = mesh;
    setRenderObject(mesh);

    return () => {
      geometry.dispose();
      material.dispose();
      meshRef.current = null;
    };
  }, [circles]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.material.color.set(circleColor);
    mesh.material.opacity = circleOpacity;
  }, [renderObject, circleColor, circleOpacity]);

  if (!renderObject) return null;
  return <primitive object={renderObject} />;
}

export default memo(CircleField);
