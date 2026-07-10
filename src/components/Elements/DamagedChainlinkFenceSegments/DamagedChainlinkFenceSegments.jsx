import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function DamagedChainlinkFenceSegments(props) {
  const { nodes, materials } = useGLTF(
    modelFile('damaged_chainlink_fence_segments.glb')
  );
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, 1.435]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder003_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -2.568]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder006_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -6.26]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder009_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -10.218]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder012_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -13.818]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, 1.391]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube001_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -2.613]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube002_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -6.305]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube003_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -10.263]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube004_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0, -13.863]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder001_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 1.729, 1.435]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder004_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 1.729, -2.568]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder007_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 1.729, -6.26]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder010_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 1.729, -10.218]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder013_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 1.729, -13.818]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder002_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -4.003]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder008_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -7.696]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder011_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -11.653]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder014_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -15.254]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane001_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -15.254]}
        rotation={[-Math.PI / 2, Math.PI / 2, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane002_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -15.254]}
        rotation={[-Math.PI / 2, Math.PI / 2, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane003_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -15.254]}
        rotation={[-Math.PI / 2, Math.PI / 2, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane005_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -15.254]}
        rotation={[-Math.PI / 2, Math.PI / 2, 0]}
        scale={0.923}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane006_Material001_0.geometry}
        material={materials['Material.001']}
        position={[0, 0.955, -15.254]}
        rotation={[-Math.PI / 2, Math.PI / 2, 0]}
        scale={0.923}
      />
    </group>
  );
}

useGLTF.preload(modelFile('damaged_chainlink_fence_segments.glb'));
