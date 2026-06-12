import React, { memo, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../../../../utils/appUtils';
import { STACK_LENGTH, useStackDims } from './BillPallet';

// Deterministic PRNG so stack placement is stable across renders
/* eslint-disable no-bitwise */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* eslint-enable no-bitwise */

function BillStacks({
  count = 14,
  scale = 1,
  stackLength = STACK_LENGTH,
  innerRadius = 0.9,
  outerRadius = 3.2,
  seed = 7,
}) {
  const { nodes, materials } = useGLTF(modelFile('HundredDollarBillStack.glb'));
  // `scale` is a multiplier on the shared stack size
  const { dims, scale: meshScale } = useStackDims(stackLength * scale);

  const placements = useMemo(() => {
    const rand = mulberry32(seed);
    // Stacks are physical objects — keep them a footprint-diagonal apart so
    // they never clip each other.
    const minDist = Math.hypot(dims[0], dims[2]);
    const placed = [];
    for (let i = 0; i < count; i += 1) {
      let attempt = 0;
      while (attempt < 40) {
        const angle = rand() * Math.PI * 2;
        const radius =
          innerRadius + (outerRadius - innerRadius) * Math.sqrt(rand());
        const px = Math.cos(angle) * radius;
        const pz = Math.sin(angle) * radius;
        const clear = placed.every(
          (p) => Math.hypot(px - p.position[0], pz - p.position[2]) >= minDist
        );
        if (clear) {
          placed.push({
            position: [px, 0.005, pz],
            rotationY: rand() * Math.PI * 2,
          });
          break;
        }
        attempt += 1;
      }
    }
    return placed;
  }, [count, innerRadius, outerRadius, seed, dims]);

  return (
    <group>
      {placements.map((p, i) => (
        <mesh
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          castShadow
          receiveShadow
          geometry={nodes.Object_2.geometry}
          material={materials.dollar}
          position={[p.position[0], dims[1] / 2 + 0.005, p.position[2]]}
          rotation={[-Math.PI / 2, 0, p.rotationY]}
          scale={meshScale}
        />
      ))}
    </group>
  );
}

useGLTF.preload(modelFile('HundredDollarBillStack.glb'));

export default memo(BillStacks);
