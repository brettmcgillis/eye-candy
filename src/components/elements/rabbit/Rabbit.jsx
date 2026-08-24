import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

import { modelFile } from '@utils/appUtils';

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
  const { scene, animations } = useGLTF(modelFile('/rabbit.glb'));
  const clonedScene = useMemo(() => cloneSkeleton(scene), [scene]);
  useGraph(clonedScene);
  const clonedAnimations = useMemo(
    () => animations.map((clip) => clip.clone()),
    [animations]
  );
  const { actions } = useAnimations(clonedAnimations, group);

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
      <primitive object={clonedScene} />
    </group>
  );
});

export default Rabbit;

useGLTF.preload(modelFile('/rabbit.glb'));
