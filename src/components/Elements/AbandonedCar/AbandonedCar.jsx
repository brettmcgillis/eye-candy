import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function AbandonedCar(props) {
  const { nodes, materials } = useGLTF(modelFile('abandoned_car.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials.Material}
        position={[-5.062, 5.04, 10.376]}
        rotation={[Math.PI / 2, 0, -0.484]}
        scale={[0.372, 0.3, 0.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_6.geometry}
        material={materials.Material}
        position={[-5.062, 5.04, 10.376]}
        rotation={[Math.PI / 2, 0, -0.484]}
        scale={[0.372, 0.3, 0.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_8.geometry}
        material={materials.Material}
        position={[-8.795, 5.04, 12.337]}
        rotation={[Math.PI / 2, 0, -0.484]}
        scale={[0.372, 0.3, 0.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_10.geometry}
        material={materials.Material}
        position={[-3.911, 7.04, 9.772]}
        rotation={[0.883, -0.88, -0.818]}
        scale={[0.372, 0.3, 0.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_12.geometry}
        material={materials.Material}
        position={[18.841, 7.44, -2.179]}
        rotation={[1.702, 0.243, -0.5]}
        scale={[0.372, 0.3, 0.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_14.geometry}
        material={materials.Material}
        position={[11.572, 1.602, -8.363]}
        rotation={[0, 0.484, 0.017]}
        scale={[0.248, 0.248, 0.238]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_16.geometry}
        material={materials.Material}
        position={[-16.859, 4.355, 8.226]}
        rotation={[Math.PI / 2, 0, -0.484]}
        scale={[0.184, 0.166, 0.166]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_18.geometry}
        material={materials.Material}
        position={[-4.741, 7.338, 5.752]}
        rotation={[3.142, -0.484, 3.14]}
        scale={[0.234, 0.234, 0.276]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_20.geometry}
        material={materials.Material}
        position={[-2.879, 4.783, -0.901]}
        rotation={[0, 0.484, 0.094]}
        scale={0.261}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_22.geometry}
        material={materials.Material}
        position={[-14.499, 6.172, 9.512]}
        rotation={[0, 0.484, 0.002]}
        scale={0.25}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_24.geometry}
        material={materials.Material}
        position={[-11.956, 5.04, -5.544]}
        rotation={[Math.PI / 2, 0, -0.484]}
        scale={[0.372, 0.3, 0.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_26.geometry}
        material={materials.Material}
        position={[-1.952, 5.04, -10.798]}
        rotation={[Math.PI / 2, 0, -0.595]}
        scale={[0.372, 0.3, 0.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_28.geometry}
        material={materials.Material}
        position={[-5.062, 5.04, 10.376]}
        rotation={[Math.PI / 2, 0, -0.484]}
        scale={[0.372, 0.3, 0.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_30.geometry}
        material={materials.Material}
        position={[-4.105, 5.04, 9.404]}
        rotation={[Math.PI / 2, 0, 2.764]}
        scale={[-0.372, 0.3, 0.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_32.geometry}
        material={materials.Material}
        position={[5.899, 5.04, 4.149]}
        rotation={[Math.PI / 2, 0, 2.658]}
        scale={[-0.372, 0.3, 0.372]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('abandoned_car.glb'));
