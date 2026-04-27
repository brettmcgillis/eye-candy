import React, { useEffect, useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';

import { useGame } from '../../../modules/ecctrl/stores/useGame';
import { modelFile } from '../../../utils/appUtils';

const sealAnimationMap = {
  sealIdle: { clip: 'Idle', timeScale: 1 },
  sealWalk: { clip: 'Shuffle', timeScale: 1 },
  sealRun: { clip: 'Shuffle', timeScale: 1.8 },
  sealJump: { clip: 'Swim', timeScale: 1 },
  sealJumpIdle: { clip: 'Swim', timeScale: 0.9 },
  sealJumpLand: { clip: 'Swim', timeScale: 1.15 },
  sealFall: { clip: 'Swim', timeScale: 0.85 },
};

export default function LowPolySeal(props) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF(modelFile('/seal.glb'));
  const { actions } = useAnimations(animations, group);
  const curAnimation = useGame((state) => state.curAnimation);

  useEffect(() => {
    const mapping = sealAnimationMap[curAnimation] ?? sealAnimationMap.sealIdle;
    const nextAction = actions[mapping.clip];

    if (!nextAction) {
      return () => {};
    }

    Object.values(actions).forEach((action) => {
      if (action !== nextAction) {
        action.fadeOut(0.15);
      }
    });

    nextAction.reset().fadeIn(0.15).play();
    nextAction.timeScale = mapping.timeScale;

    return () => {
      nextAction.fadeOut(0.15);
    };
  }, [actions, curAnimation]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group
          name="Sketchfab_model"
          scale={[0.5, 0.5, 0.5]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        >
          <group name="root">
            <group name="GLTF_SceneRootNode" rotation={[Math.PI / 2, 0, 0]}>
              <group name="SealArmature_15">
                <group name="GLTF_created_0">
                  <primitive object={nodes.GLTF_created_0_rootJoint} />
                  <skinnedMesh
                    name="Object_7"
                    geometry={nodes.Object_7.geometry}
                    material={materials.Seal}
                    skeleton={nodes.Object_7.skeleton}
                  />
                  <group name="Seal_14" />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/seal.glb'));
