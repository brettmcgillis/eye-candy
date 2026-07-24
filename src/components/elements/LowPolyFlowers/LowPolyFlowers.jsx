import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function LowPolyFlowers(props) {
  const { nodes, materials } = useGLTF(modelFile('low_poly_flowers.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder_ranunculus_opague_1_0.geometry}
        material={materials.ranunculus_opague_1}
        position={[5.309, 0.266, 0.166]}
        rotation={[-1.513, 0.172, -0.015]}
        scale={1.11}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_ranunculus_opague_1_0.geometry}
        material={materials.ranunculus_opague_1}
        position={[7.382, -0.192, -0.443]}
        rotation={[-1.532, 0.223, 1.115]}
        scale={1.11}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder006_ranunculus_opague_1_0.geometry}
        material={materials.ranunculus_opague_1}
        position={[7.878, -0.078, -3.11]}
        rotation={[-1.612, 0.224, 2.255]}
        scale={1.11}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder007_ranunculus_opague_1_0.geometry}
        material={materials.ranunculus_opague_1}
        position={[5.295, 0.128, -3.209]}
        rotation={[-1.676, 0.109, -2.758]}
        scale={1.11}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder008_ranunculus_opague_1_0.geometry}
        material={materials.ranunculus_opague_1}
        position={[4.597, 0.123, -2.68]}
        rotation={[-1.532, 0.032, -1.374]}
        scale={1.11}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder_ranunculus_transparent_1_0.geometry}
        material={materials.ranunculus_transparent_1}
        position={[5.309, 0.266, 0.166]}
        rotation={[-1.513, 0.172, -0.015]}
        scale={1.11}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder001_tulip_opague_1_0.geometry}
        material={materials.tulip_opague_1}
        position={[-0.194, 0.001, 2.347]}
        rotation={[-1.602, 0.104, 0.953]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder002_tulip_opague_1_0.geometry}
        material={materials.tulip_opague_1}
        position={[-2.048, 0.001, 2.347]}
        rotation={[-1.463, -0.068, -0.304]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder001_tulip_transparent_1_0.geometry}
        material={materials.tulip_transparent_1}
        position={[-0.194, 0.001, 2.347]}
        rotation={[-1.602, 0.104, 0.953]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder002_tulip_transparent_1_0.geometry}
        material={materials.tulip_transparent_1}
        position={[-2.048, 0.001, 2.347]}
        rotation={[-1.463, -0.068, -0.304]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder003_narcissus_opague_1_0.geometry}
        material={materials.narcissus_opague_1}
        position={[3.102, 0.001, 7.432]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder003_narcissus_transparent_1_0.geometry}
        material={materials.narcissus_transparent_1}
        position={[3.102, 0.001, 7.432]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder004_narcissus_transparent_1_0.geometry}
        material={materials.narcissus_transparent_1}
        position={[3.561, 1.068, 6.063]}
        rotation={[-1.515, 0.254, 0.952]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder004_narcissus_opague_1_0.geometry}
        material={materials.narcissus_opague_1}
        position={[3.561, 1.068, 6.063]}
        rotation={[-1.515, 0.254, 0.952]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_ranunculus_transparent_1_0.geometry}
        material={materials.ranunculus_transparent_1}
        position={[7.382, -0.192, -0.443]}
        rotation={[-1.532, 0.223, 1.115]}
        scale={1.11}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder006_ranunculus_transparent_1_0.geometry}
        material={materials.ranunculus_transparent_1}
        position={[7.878, -0.078, -3.11]}
        rotation={[-1.612, 0.224, 2.255]}
        scale={1.11}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder007_ranunculus_transparent_1_0.geometry}
        material={materials.ranunculus_transparent_1}
        position={[5.295, 0.128, -3.209]}
        rotation={[-1.676, 0.109, -2.758]}
        scale={1.11}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder008_ranunculus_transparent_1_0.geometry}
        material={materials.ranunculus_transparent_1}
        position={[4.597, 0.123, -2.68]}
        rotation={[-1.532, 0.032, -1.374]}
        scale={1.11}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder009_anemone_opague_1_0.geometry}
        material={materials.anemone_opague_1}
        position={[-8.975, -0.077, 0.846]}
        rotation={[-1.454, -0.21, -0.732]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder009_anemone_transparent_0.geometry}
        material={materials.anemone_transparent}
        position={[-8.975, -0.077, 0.846]}
        rotation={[-1.454, -0.21, -0.732]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder010_anemone_opague_1_0.geometry}
        material={materials.anemone_opague_1}
        position={[-6.569, 0.175, 3.195]}
        rotation={[-1.418, -0.068, 0.245]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder010_anemone_transparent_0.geometry}
        material={materials.anemone_transparent}
        position={[-6.569, 0.175, 3.195]}
        rotation={[-1.418, -0.068, 0.245]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder011_anemone_opague_1_0.geometry}
        material={materials.anemone_opague_1}
        position={[-5.389, 0.299, -0.619]}
        rotation={[-1.575, 0.052, 1.597]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder011_anemone_transparent_0.geometry}
        material={materials.anemone_transparent}
        position={[-5.389, 0.299, -0.619]}
        rotation={[-1.575, 0.052, 1.597]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder012_anemone_opague_1_0.geometry}
        material={materials.anemone_opague_1}
        position={[-6.178, 0.216, -2.115]}
        rotation={[-1.728, -0.111, -3.109]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder012_anemone_transparent_0.geometry}
        material={materials.anemone_transparent}
        position={[-6.178, 0.216, -2.115]}
        rotation={[-1.728, -0.111, -3.109]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder013_anemone_opague_1_0.geometry}
        material={materials.anemone_opague_1}
        position={[-8.982, -0.078, -1.526]}
        rotation={[-1.66, -0.234, -2.174]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder013_anemone_transparent_0.geometry}
        material={materials.anemone_transparent}
        position={[-8.982, -0.078, -1.526]}
        rotation={[-1.66, -0.234, -2.174]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('low_poly_flowers.glb'));
