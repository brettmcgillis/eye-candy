import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function BettaHendra(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('betta_hendra.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <primitive object={nodes.GLTF_created_0_rootJoint} />
        <skinnedMesh
          name="Object_7"
          geometry={nodes.Object_7.geometry}
          material={materials['Material.001']}
          skeleton={nodes.Object_7.skeleton}
          position={[0, 0.101, 1.204]}
          rotation={[-1.552, 0, 0]}
          scale={0.212}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('betta_hendra.glb'));
