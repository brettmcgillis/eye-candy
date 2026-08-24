/* eslint-disable no-underscore-dangle */
import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function HummingBirdIdle(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('HummingBirdIdle.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <primitive object={nodes._rootJoint} />
        <skinnedMesh
          name="Object_721"
          geometry={nodes.Object_721.geometry}
          material={materials.Hummingbird_eyes1}
          skeleton={nodes.Object_721.skeleton}
          position={[-0.007, 0.021, -0.043]}
          rotation={[-1.585, 0.195, 1.709]}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_722"
          geometry={nodes.Object_722.geometry}
          material={materials.Hummingbird_eyelens1}
          skeleton={nodes.Object_722.skeleton}
          position={[-0.007, 0.021, -0.043]}
          rotation={[-1.585, 0.195, 1.709]}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_723"
          geometry={nodes.Object_723.geometry}
          material={materials.Hummingbird_eyelids1}
          skeleton={nodes.Object_723.skeleton}
          position={[-0.007, 0.021, -0.043]}
          rotation={[-1.585, 0.195, 1.709]}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_725"
          geometry={nodes.Object_725.geometry}
          material={materials.Hummingbird_feather1}
          skeleton={nodes.Object_725.skeleton}
          position={[-0.007, 0.021, -0.043]}
          rotation={[-1.585, 0.195, 1.709]}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_727"
          geometry={nodes.Object_727.geometry}
          material={materials.Hummingbird_body1}
          skeleton={nodes.Object_727.skeleton}
          position={[-0.007, 0.021, -0.043]}
          rotation={[-1.585, 0.195, 1.709]}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_728"
          geometry={nodes.Object_728.geometry}
          material={materials.Hummingbird_peck1}
          skeleton={nodes.Object_728.skeleton}
          position={[-0.007, 0.021, -0.043]}
          rotation={[-1.585, 0.195, 1.709]}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_729"
          geometry={nodes.Object_729.geometry}
          material={materials.Hummingbird_leg1}
          skeleton={nodes.Object_729.skeleton}
          position={[-0.007, 0.021, -0.043]}
          rotation={[-1.585, 0.195, 1.709]}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_730"
          geometry={nodes.Object_730.geometry}
          material={materials.Hummingbird_tongue1}
          skeleton={nodes.Object_730.skeleton}
          position={[-0.007, 0.021, -0.043]}
          rotation={[-1.585, 0.195, 1.709]}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_732"
          geometry={nodes.Object_732.geometry}
          material={materials.Hummingbird_feather1}
          skeleton={nodes.Object_732.skeleton}
          position={[-0.007, 0.021, -0.043]}
          rotation={[-1.585, 0.195, 1.709]}
          scale={0.01}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('HummingBirdIdle.glb'));
