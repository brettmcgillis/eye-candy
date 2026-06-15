import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function Trashcan4({
  showCan = true,
  showLid = true,
  ...props
}) {
  const { nodes, materials } = useGLTF(modelFile('trashcan4.glb'));
  return (
    <group {...props} dispose={null}>
      {showCan && (
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Can.geometry}
          material={materials.Standard_Urban_Trashcan_Metallic}
        />
      )}
      {showLid && (
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Lid.geometry}
          material={materials.Standard_Urban_Trashcan_Metallic}
        />
      )}
    </group>
  );
}

useGLTF.preload(modelFile('trashcan4.glb'));
