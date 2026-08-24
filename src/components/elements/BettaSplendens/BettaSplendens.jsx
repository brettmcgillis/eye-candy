import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function BettaSplendens(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('betta_splendens.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Root" rotation={[-Math.PI / 2, 0, 0]}>
          <group name="Cube" position={[0, -2.839, 3.603]} scale={0.258}>
            <group name="Armature" position={[0, 1.679, -8.501]} scale={3.881}>
              <group
                name="EYES"
                position={[0.15, -0.085, 0.052]}
                scale={[0.093, 0.124, 0.124]}
              />
              <primitive object={nodes.Armature_rootJoint} />
              <skinnedMesh
                name="BODY_0"
                geometry={nodes.BODY_0.geometry}
                material={materials.BETTA}
                skeleton={nodes.BODY_0.skeleton}
              />
              <skinnedMesh
                name="EYES_0"
                geometry={nodes.EYES_0.geometry}
                material={materials.BETTA}
                skeleton={nodes.EYES_0.skeleton}
              />
            </group>
            <mesh
              name="Cube_0"
              castShadow
              receiveShadow
              geometry={nodes.Cube_0.geometry}
              material={materials.Root}
            />
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('betta_splendens.glb'));
