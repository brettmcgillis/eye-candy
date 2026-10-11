import React, {
  forwardRef,
  memo,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import * as THREE from 'three/webgpu';

function createGeometry(shape, inner) {
  if (shape === 'ring') return new THREE.RingGeometry(inner, 1, 64);
  if (shape === 'quad') return new THREE.PlaneGeometry(1, 1);
  return new THREE.CircleGeometry(1, 32);
}

// count stays pinned to capacity and spare slots collapse to a zero-scale
// matrix: lowering count before the first render sizes the WebGPU matrix
// uniform short, and later instances never draw.
const Shapes = forwardRef(function Shapes(
  { additive = true, capacity, inner = 0.9, shape = 'circle', z = 0 },
  ref
) {
  const meshRef = useRef(null);

  const geometry = useMemo(() => createGeometry(shape, inner), [shape, inner]);
  const material = useMemo(
    () =>
      new THREE.MeshBasicNodeMaterial({
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        transparent: true,
      }),
    [additive]
  );
  const colors = useMemo(
    () => new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3),
    [capacity]
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    const a = mesh.instanceMatrix.array;
    for (let i = 0; i < capacity; i += 1) {
      a.fill(0, i * 16, i * 16 + 16);
      a[i * 16 + 10] = 1;
      a[i * 16 + 15] = 1;
    }
    colors.setUsage(THREE.DynamicDrawUsage);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.instanceColor = colors;
    mesh.instanceMatrix.needsUpdate = true;
  }, [capacity, colors, geometry, material]);

  useLayoutEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useImperativeHandle(
    ref,
    () => ({
      commit() {
        const mesh = meshRef.current;
        mesh.instanceMatrix.needsUpdate = true;
        colors.needsUpdate = true;
      },
      hide(i) {
        const a = meshRef.current.instanceMatrix.array;
        a[i * 16] = 0;
        a[i * 16 + 1] = 0;
        a[i * 16 + 4] = 0;
        a[i * 16 + 5] = 0;
      },
      set(i, x, y, sx, sy, rotation, r, g, b) {
        const a = meshRef.current.instanceMatrix.array;
        const o = i * 16;
        const c = Math.cos(rotation);
        const s = Math.sin(rotation);
        a[o] = sx * c;
        a[o + 1] = sx * s;
        a[o + 4] = -sy * s;
        a[o + 5] = sy * c;
        a[o + 12] = x;
        a[o + 13] = y;
        colors.array[i * 3] = r;
        colors.array[i * 3 + 1] = g;
        colors.array[i * 3 + 2] = b;
      },
    }),
    [colors]
  );

  return (
    <instancedMesh
      key={capacity}
      ref={meshRef}
      args={[geometry, material, capacity]}
      frustumCulled={false}
      position={[0, 0, z]}
    />
  );
});

export default memo(Shapes);
