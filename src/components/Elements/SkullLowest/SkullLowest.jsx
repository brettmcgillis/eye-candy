import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function SkullLowest(props) {
  const { nodes, materials } = useGLTF(modelFile('SkullLowest.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Left_zygomatic.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Occipital.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Right_lacrimal.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Right_max.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Right_nasal.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Right_palatine.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Right_Parietal.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Right_temporal.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Right_zygomatic.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sphenoid.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Teeth.geometry}
        material={materials.phong3}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Vomer.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Ethmoid.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Ethmoid_1.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Frontal.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Inferior_conchae.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Left_lacrimal.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Left_maxilla.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Left_maxilla_1.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Left_nasal.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Left_palatine.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Left_parietal.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Left_temporal.geometry}
        material={materials.lambert5}
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lower_teeth.geometry}
        material={materials.phong3}
        position={[-0.795, 7.685, 1.454]}
        rotation={[-2.504, 0.037, -0.033]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Mandible.geometry}
        material={materials.lambert5}
        position={[-0.795, 7.685, 1.454]}
        rotation={[-2.504, 0.037, -0.033]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('SkullLowest.glb'));
