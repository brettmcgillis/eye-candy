import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function HappyMeal(props) {
  const { nodes, materials } = useGLTF(modelFile('/happyMeal.glb'));
  return (
    <group {...props} dispose={null}>
      <group position={[0, 0, -0.348]} scale={0.001}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.mesh_id31.geometry}
          material={materials['65']}
          position={[7.867, 144.835, 352.409]}
          scale={[226.005, 69.838, 1]}
        />
        <group position={[8.028, -34.604, 17.699]} scale={0.572}>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.node_id34.geometry}
            material={materials['78']}
            position={[-195.555, -256, 1135.07]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[9777.773, 8795.13, 8866.988]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.node_id37.geometry}
            material={materials['80']}
            position={[-1036.444, 98.662, 1134.191]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[384.952, 345.451, 309.752]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.node_id40.geometry}
            material={materials['82']}
            position={[-1036.444, 98.662, 1134.191]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[384.952, 345.451, 309.752]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.node_id43.geometry}
            material={materials['84']}
            position={[-1036.444, 98.662, 1134.191]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[9777.773, 8774.446, 7867.689]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.node_id46.geometry}
            material={materials['86']}
            position={[-1036.444, 98.662, 1134.191]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[384.952, 345.451, 309.752]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.node_id49.geometry}
            material={materials['88']}
            position={[1036.444, 98.661, 28.63]}
            rotation={[-Math.PI / 2, 0, Math.PI]}
            scale={[384.952, 345.451, 309.752]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.node_id52.geometry}
            material={materials['90']}
            position={[1036.444, 98.661, 28.63]}
            rotation={[-Math.PI / 2, 0, Math.PI]}
            scale={[384.952, 345.451, 309.752]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.node_id55.geometry}
            material={materials['92']}
            position={[1036.444, 98.661, 28.63]}
            rotation={[-Math.PI / 2, 0, Math.PI]}
            scale={[9777.768, 8774.442, 7867.689]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.node_id58.geometry}
            material={materials['94']}
            position={[1036.444, 98.661, 28.63]}
            rotation={[-Math.PI / 2, 0, Math.PI]}
            scale={[384.952, 345.451, 309.752]}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/happyMeal.glb'));
