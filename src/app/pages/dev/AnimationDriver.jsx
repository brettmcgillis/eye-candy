import * as THREE from 'three';

import { useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

function snapshotAnimatedTransforms(root) {
  const snapshot = [];

  root.traverse((node) => {
    snapshot.push({
      node,
      position: node.position.clone(),
      quaternion: node.quaternion.clone(),
      scale: node.scale.clone(),
      morphTargetInfluences: node.morphTargetInfluences
        ? [...node.morphTargetInfluences]
        : null,
    });
  });

  return snapshot;
}

function restoreAnimatedTransforms(snapshot) {
  snapshot.forEach((entry) => {
    entry.node.position.copy(entry.position);
    entry.node.quaternion.copy(entry.quaternion);
    entry.node.scale.copy(entry.scale);

    if (entry.morphTargetInfluences && entry.node.morphTargetInfluences) {
      entry.node.morphTargetInfluences.splice(
        0,
        entry.node.morphTargetInfluences.length,
        ...entry.morphTargetInfluences
      );
    }
  });
}

export default function AnimationDriver({ clipName, clips, playing, root }) {
  const mixerRef = useRef(null);

  useEffect(() => {
    const clip = clips.find((candidate) => candidate.name === clipName);

    if (!root || !clip) {
      mixerRef.current = null;
      return undefined;
    }

    const restPose = snapshotAnimatedTransforms(root);
    const mixer = new THREE.AnimationMixer(root);
    mixer.clipAction(clip).play();
    mixer.update(0);
    mixerRef.current = mixer;

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      mixerRef.current = null;
      restoreAnimatedTransforms(restPose);
    };
  }, [clipName, clips, root]);

  useFrame((_, delta) => {
    if (playing) {
      mixerRef.current?.update(delta);
    }
  });

  return null;
}
