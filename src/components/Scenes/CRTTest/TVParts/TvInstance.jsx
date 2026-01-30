/* eslint-disable no-unused-vars */
import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../../utils/appUtils';

export default function TvModel(props) {
  const { nodes, _materials } = useGLTF(modelFile(`retro_tv.glb`));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.retro_tv.geometry}
        material={nodes.retro_tv.material}
        rotation={[-Math.PI, 0.011, -Math.PI]}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.dial_01.geometry}
          material={nodes.dial_01.material}
          position={[0.254, 0.208, 0.092]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.dial_02.geometry}
          material={nodes.dial_02.material}
          position={[0.291, 0.208, 0.092]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.dial_03.geometry}
          material={nodes.dial_03.material}
          position={[0.328, 0.208, 0.092]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.knob_01.geometry}
          material={nodes.knob_01.material}
          position={[0.291, 0.406, 0.097]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.knob_02.geometry}
          material={nodes.knob_02.material}
          position={[0.291, 0.289, 0.097]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.screen.geometry}
          material={nodes.screen.material}
          position={[-0.077, 0.262, 0.07]}
          rotation={[0, 0, -3.13]}
        />
      </mesh>
    </group>
  );
}
useGLTF.preload(modelFile(`retro_tv.glb`));
