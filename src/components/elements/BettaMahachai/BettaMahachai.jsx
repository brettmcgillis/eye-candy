import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function BettaMahachai(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('betta_mahachai.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group
          name="GLTF_created_0"
          position={[-0.327, 0.014, -0.004]}
          rotation={[0, 0, -Math.PI / 2]}
          scale={0.117}
        >
          <primitive object={nodes.GLTF_created_0_rootJoint} />
        </group>
        <skinnedMesh
          name="Object_7"
          geometry={nodes.Object_7.geometry}
          material={materials['Texture_Betta.002']}
          skeleton={nodes.Object_7.skeleton}
          position={[-0.327, 0.014, -0.004]}
          rotation={[0, 0, -Math.PI / 2]}
          scale={0.117}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('betta_mahachai.glb'));
