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

const TIME_EPSILON = 1e-4;
// Throttle playhead reports so playback doesn't re-render the workbench every
// frame; the slider still tracks smoothly at this cadence.
const TIME_REPORT_INTERVAL = 1 / 30;

export default function AnimationDriver({
  clipName,
  clips,
  playing,
  root,
  time = 0,
  onTimeChange,
}) {
  const mixerRef = useRef(null);
  const actionRef = useRef(null);
  const durationRef = useRef(0);
  const lastTimeRef = useRef(0);
  const reportAccumRef = useRef(0);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    const clip = clips.find((candidate) => candidate.name === clipName);

    if (!root || !clip) {
      mixerRef.current = null;
      actionRef.current = null;
      return undefined;
    }

    const restPose = snapshotAnimatedTransforms(root);
    const mixer = new THREE.AnimationMixer(root);
    const action = mixer.clipAction(clip);
    action.play();
    action.time = THREE.MathUtils.clamp(time, 0, clip.duration);
    mixer.update(0);

    mixerRef.current = mixer;
    actionRef.current = action;
    durationRef.current = clip.duration;
    lastTimeRef.current = action.time;
    reportAccumRef.current = 0;
    wasPlayingRef.current = false;

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      mixerRef.current = null;
      actionRef.current = null;
      restoreAnimatedTransforms(restPose);
    };
    // `time` is intentionally omitted: it seeds the initial frame only, and
    // ongoing seeks are handled in useFrame to avoid rebuilding the mixer.
  }, [clipName, clips, root]);

  useFrame((_, delta) => {
    const mixer = mixerRef.current;
    const action = actionRef.current;
    if (!mixer || !action) return;

    if (playing) {
      mixer.update(delta);
      lastTimeRef.current = action.time;
      wasPlayingRef.current = true;

      reportAccumRef.current += delta;
      if (reportAccumRef.current >= TIME_REPORT_INTERVAL) {
        reportAccumRef.current = 0;
        onTimeChange?.(action.time);
      }
      return;
    }

    // Just paused: push the exact final playhead up so the slider lands on it.
    if (wasPlayingRef.current) {
      wasPlayingRef.current = false;
      reportAccumRef.current = 0;
      onTimeChange?.(lastTimeRef.current);
      return;
    }

    // Paused: apply external scrubs by jumping the mixer to the requested time.
    const seekTime = THREE.MathUtils.clamp(time, 0, durationRef.current);
    if (Math.abs(seekTime - lastTimeRef.current) > TIME_EPSILON) {
      action.time = seekTime;
      mixer.update(0);
      lastTimeRef.current = seekTime;
    }
  });

  return null;
}
