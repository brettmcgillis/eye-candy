import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function Busstop(props) {
  const { nodes, materials } = useGLTF(modelFile('busstop.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BusStop_Sign_InsideBack.geometry}
        material={materials['Sign_shader.004']}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BusStop_Sign_InsideRight.geometry}
        material={materials['Sign_shader.004']}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BusStop_Sign_OutsideBack.geometry}
        material={materials['Sign_shader.004']}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BusStop_Sign_OutsideRight.geometry}
        material={materials['Sign_shader.004']}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BusStop_Structure_shader_0.geometry}
        material={materials['Structure_shader.005']}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BusStopGlassCeiling.geometry}
        material={materials['Structure_shader.006']}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BusStopGlassWalls.geometry}
        material={materials['Structure_shader.006']}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('busstop.glb'));
