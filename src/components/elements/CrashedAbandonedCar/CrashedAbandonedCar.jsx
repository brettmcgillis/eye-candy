import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function CrashedAbandonedCar(props) {
  const { nodes, materials } = useGLTF(modelFile('crashed_abandoned_car.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials.Material}
        position={[0.358, 1.501, 1.674]}
        rotation={[-0.178, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_6.geometry}
        material={materials.Material}
        position={[0.367, 1.573, 1.682]}
        rotation={[0.076, 0.265, -0.11]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_8.geometry}
        material={materials.Material}
        position={[0.271, 0.67, 1.64]}
        rotation={[0.076, 0.265, 0.011]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_10.geometry}
        material={materials.Material}
        position={[-1.131, 1.669, 1.642]}
        rotation={[0.179, 0.407, 0.032]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_12.geometry}
        material={materials.Material}
        position={[-1.639, 1.872, -0.118]}
        rotation={[1.83, 1.438, -1.718]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_14.geometry}
        material={materials.Material}
        position={[-0.789, 2.73, -2.842]}
        rotation={[0.362, 0.184, -0.131]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_16.geometry}
        material={materials.Material}
        position={[-0.61, 0.428, 2.404]}
        rotation={[-0.247, -0.382, -0.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_18.geometry}
        material={materials.Material}
        position={[-1.808, 0.583, -1.93]}
        rotation={[0.074, 0.266, -0.03]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_20.geometry}
        material={materials.Material}
        position={[0.253, 0.551, -2.504]}
        rotation={[3.123, -0.252, -3.122]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_22.geometry}
        material={materials.Material}
        position={[1.494, 0.164, 1.741]}
        rotation={[-2.731, -0.406, 1.581]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('crashed_abandoned_car.glb'));
