import React, { memo } from 'react';

import { useGLTF, useTexture } from '@react-three/drei';

import OneDollarBill from '@elements/OneDollarBill/OneDollarBill';
import OneHundredDollarBill from '@elements/OneHundredDollarBill/OneHundredDollarBill';
import { modelFile } from '@utils/appUtils';

import { useStackDims } from './BillPallet';

// Debug calibration row: cloth-bill reference, $100 element, $1 element, and
// a bill stack, laid flat in a line so relative scales can be tuned by eye.
function ScaleLineup({
  billSize = 0.7,
  billAspect = 0.43,
  stackLength = 0.3,
  oneScale = 2.5,
  hundredScale = 0.098,
  stackScale = 2.6,
  x = 0,
  z = 2.2,
  spacing = 0.9,
}) {
  const referenceTexture = useTexture('/textures/cash/hundred_front.png');
  const { nodes, materials } = useGLTF(modelFile('HundredDollarBillStack.glb'));
  const { dims: stackDims, scale: stackMeshScale } = useStackDims(stackLength);

  return (
    <group position={[x, 0.012, z]}>
      {/* What the airborne cloth bills measure (billSize) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-1.5 * spacing, 0.004, 0]}
      >
        <planeGeometry args={[billSize, billSize * billAspect]} />
        <meshStandardMaterial map={referenceTexture} />
      </mesh>

      <OneHundredDollarBill
        position={[-0.5 * spacing, 0.004, 0]}
        scale={hundredScale}
      />

      <OneDollarBill position={[0.5 * spacing, 0.004, 0]} scale={oneScale} />

      {/* Stack geometry is center-origin — seat its base on the mat */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        material={materials.dollar}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[1.5 * spacing, (stackDims[1] * stackScale) / 2 + 0.004, 0]}
        scale={stackMeshScale * stackScale}
      />
    </group>
  );
}

useGLTF.preload(modelFile('HundredDollarBillStack.glb'));

export default memo(ScaleLineup);
