import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function Pigeon(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('pigeon.glb'));
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
          material={materials['Material0-material']}
          skeleton={nodes.Object_7.skeleton}
          morphTargetDictionary={nodes.Object_7.morphTargetDictionary}
          morphTargetInfluences={nodes.Object_7.morphTargetInfluences}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('pigeon.glb'));
