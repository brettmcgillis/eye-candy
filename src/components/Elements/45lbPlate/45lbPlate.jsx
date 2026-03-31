import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function Lb45Plate(props) {
  const { nodes, materials } = useGLTF(modelFile('/45lb_metal_plate.glb'));
  return (
    <group {...props} dispose={null}>
      <group scale={0.01}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['45lb_Plate_Material001_0'].geometry}
          material={materials['Material.001']}
          rotation={[0, 0, -0.784]}
          scale={100}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/45lb_metal_plate.glb'));
