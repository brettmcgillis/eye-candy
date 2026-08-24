import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function EasternBlueBird(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('eastern_blue_bird.glb'));
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
          material={materials.bluebird}
          skeleton={nodes.Object_7.skeleton}
          morphTargetDictionary={nodes.Object_7.morphTargetDictionary}
          morphTargetInfluences={nodes.Object_7.morphTargetInfluences}
        />
        <skinnedMesh
          name="Object_8"
          geometry={nodes.Object_8.geometry}
          material={materials.bluebird}
          skeleton={nodes.Object_8.skeleton}
          morphTargetDictionary={nodes.Object_8.morphTargetDictionary}
          morphTargetInfluences={nodes.Object_8.morphTargetInfluences}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('eastern_blue_bird.glb'));
