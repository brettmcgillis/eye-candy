/* eslint-disable no-underscore-dangle */
import * as THREE from 'three';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

function resolveAutoPlayClipName(actions, autoPlayClip, autoPlayPatterns) {
  const clipNames = Object.keys(actions || {});
  if (!clipNames.length) return null;

  if (autoPlayClip && actions[autoPlayClip]) {
    return autoPlayClip;
  }

  if (autoPlayPatterns?.length) {
    for (let i = 0; i < autoPlayPatterns.length; i += 1) {
      const pattern = autoPlayPatterns[i].toLowerCase();
      const match = clipNames.find((clipName) =>
        clipName.toLowerCase().includes(pattern)
      );
      if (match) return match;
    }
  }

  return clipNames[0];
}

const Rabbit = forwardRef(function Rabbit(
  {
    autoPlay = false,
    autoPlayClip = null,
    autoPlayPatterns = null,
    autoPlayTimeScale = 1,
    ...props
  },
  ref
) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF(modelFile('/rabbit.glb'));
  const { actions } = useAnimations(animations, group);

  useImperativeHandle(ref, () => group.current);

  useEffect(() => {
    if (!autoPlay) return undefined;

    const clipName = resolveAutoPlayClipName(
      actions,
      autoPlayClip,
      autoPlayPatterns
    );
    if (!clipName) return undefined;

    const action = actions[clipName];
    if (!action) return undefined;

    action.enabled = true;
    action.clampWhenFinished = false;
    action.timeScale = autoPlayTimeScale;
    action.setLoop(THREE.LoopRepeat, Infinity).reset().fadeIn(0.35).play();

    return () => {
      action.fadeOut(0.2);
    };
  }, [actions, autoPlay, autoPlayClip, autoPlayPatterns, autoPlayTimeScale]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]}>
          <group
            name="7d743f0a63c8458d8915d7ce169c8c60fbx"
            rotation={[Math.PI / 2, 0, 0]}
            scale={0.001}
          >
            <group name="Object_2">
              <group name="RootNode">
                <group
                  name="Rabbit"
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={100}
                >
                  <group name="Object_5">
                    <primitive object={nodes._rootJoint} />
                    <skinnedMesh
                      name="Object_72"
                      geometry={nodes.Object_72.geometry}
                      material={materials.Rabbit}
                      skeleton={nodes.Object_72.skeleton}
                    />
                    <group
                      name="Object_71"
                      rotation={[-Math.PI / 2, 0, 0]}
                      scale={100}
                    />
                  </group>
                </group>
                <group
                  name="Rabbit001"
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={100}
                />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});

export default Rabbit;

useGLTF.preload(modelFile('/rabbit.glb'));
