import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import { useFrame, useGraph } from '@react-three/fiber';

import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

const MODEL = modelFile('/rabbit.glb');

function resolveAutoPlayClipName(clips, autoPlayClip, autoPlayPatterns) {
  const clipNames = clips.map((clip) => clip.name);
  if (!clipNames.length) return null;

  if (autoPlayClip && clipNames.includes(autoPlayClip)) {
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
    castShadow = false,
    customizeMaterial = null,
    onReady = null,
    outlineMaterial = null,
    playing = true,
    startTime = 0,
    ...props
  },
  ref
) {
  const group = useRef();
  const { scene, animations } = useDracoGltf(MODEL);
  const clonedScene = useMemo(() => cloneSkeleton(scene), [scene]);
  useGraph(clonedScene);
  const clonedAnimations = useMemo(
    () => animations.map((clip) => clip.clone()),
    [animations]
  );
  const mixer = useMemo(() => new THREE.AnimationMixer(undefined), []);
  useEffect(
    () => () => {
      mixer.stopAllAction();
      if (group.current) mixer.uncacheRoot(group.current);
    },
    [mixer]
  );
  useFrame((_, delta) => {
    if (playing) mixer.update(delta);
  });

  const skinnedMeshes = useMemo(() => {
    const meshes = [];
    clonedScene.traverse((object) => {
      if (object.isSkinnedMesh) meshes.push(object);
    });
    return meshes;
  }, [clonedScene]);
  const originalMaterials = useMemo(
    () => skinnedMeshes.map((mesh) => mesh.material),
    [skinnedMeshes]
  );

  useImperativeHandle(ref, () => group.current);

  useLayoutEffect(() => {
    const created = skinnedMeshes.map((mesh, i) => {
      const material = customizeMaterial?.(originalMaterials[i], mesh) ?? null;
      /* eslint-disable no-param-reassign */
      mesh.material = material ?? originalMaterials[i];
      mesh.castShadow = castShadow;
      /* eslint-enable no-param-reassign */
      return material;
    });
    return () => {
      skinnedMeshes.forEach((mesh, i) => {
        // eslint-disable-next-line no-param-reassign
        mesh.material = originalMaterials[i];
      });
      created.forEach((material) => material?.dispose());
    };
  }, [castShadow, customizeMaterial, originalMaterials, skinnedMeshes]);

  // An inverted hull per skinned mesh: same geometry and skeleton, drawn
  // back-faced through `outlineMaterial`, which pushes it out along normals.
  useLayoutEffect(() => {
    if (!outlineMaterial) return undefined;
    const hulls = skinnedMeshes.map((mesh) => {
      const hull = new THREE.SkinnedMesh(mesh.geometry, outlineMaterial);
      hull.bind(mesh.skeleton, mesh.bindMatrix);
      hull.position.copy(mesh.position);
      hull.quaternion.copy(mesh.quaternion);
      hull.scale.copy(mesh.scale);
      hull.frustumCulled = false;
      hull.userData.plot = false;
      mesh.parent.add(hull);
      return hull;
    });
    return () => hulls.forEach((hull) => hull.removeFromParent());
  }, [outlineMaterial, skinnedMeshes]);

  useEffect(() => {
    onReady?.({ animations: clonedAnimations, mixer, scene: clonedScene });
  }, [clonedAnimations, clonedScene, mixer, onReady]);

  useEffect(() => {
    if (!autoPlay) return undefined;

    const clipName = resolveAutoPlayClipName(
      clonedAnimations,
      autoPlayClip,
      autoPlayPatterns
    );
    if (!clipName) return undefined;

    const clip = clonedAnimations.find((c) => c.name === clipName);
    const action = mixer.clipAction(clip, group.current);

    action.enabled = true;
    action.clampWhenFinished = false;
    action.timeScale = autoPlayTimeScale;
    action.setLoop(THREE.LoopRepeat, Infinity).reset().fadeIn(0.35).play();
    if (startTime) mixer.setTime(startTime);

    return () => {
      action.fadeOut(0.2);
    };
  }, [
    autoPlay,
    autoPlayClip,
    autoPlayPatterns,
    autoPlayTimeScale,
    clonedAnimations,
    mixer,
    startTime,
  ]);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={clonedScene} />
    </group>
  );
});

export default Rabbit;

useDracoGltf.preload(MODEL);
