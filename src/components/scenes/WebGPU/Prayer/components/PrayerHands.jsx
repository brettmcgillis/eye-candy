/* eslint-disable no-param-reassign */
import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { AnimationMixer, Box3, Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

import ensurePrayerGradientAttribute from '../utils/ensurePrayerGradientAttribute';

// One posed pair (left + right hand) per demographic. Each GLB carries the
// prayer poses as single-frame clips (Pray1/Pray2/Pray3) authored in the Pose
// Workbench, so the scene just picks a clip and freezes on frame 0.
export const DEMOGRAPHIC_MODELS = {
  child: 'child-praying-hands.glb',
  female: 'female-praying-hands.glb',
  male: 'male-praying-hands.glb',
};

export const DEFAULT_DEMOGRAPHIC = 'female';
export const DEFAULT_POSE = 'Pray1';

// Normalize every demographic to the same max dimension so swapping a shell's
// demographic doesn't change its size — relative sizing is driven by the
// per-shell scale control instead.
const TARGET_MAX_DIMENSION = 1.4;

Object.values(DEMOGRAPHIC_MODELS).forEach((fileName) => {
  useGLTF.preload(modelFile(fileName));
});

function resolveModelPath(demographic) {
  return modelFile(
    DEMOGRAPHIC_MODELS[demographic] || DEMOGRAPHIC_MODELS[DEFAULT_DEMOGRAPHIC]
  );
}

function composeScale(scale, modelScale) {
  if (Array.isArray(scale)) {
    return scale.map((value) => value * modelScale);
  }

  if (typeof scale === 'number') {
    return scale * modelScale;
  }

  return modelScale;
}

// Each hand is a skinned mesh whose armature lives under its own wrapper group;
// the mirrored (left) hand's wrapper carries scale [-1, 1, 1]. Spreading must
// move these WRAPPER GROUPS, whose positions share one un-mirrored parent
// frame — offsetting the root *bones* instead fails, because the mirrored
// hand's local axes are flipped, so both hands slide the same way. (See
// elements/MalePrayingHands.jsx for the exported structure.)
function collectSpreadTargets(root) {
  const targets = [];
  const seen = new Set();

  root.traverse((node) => {
    if (!node.isSkinnedMesh || !node.skeleton) return;

    let bone = node.skeleton.bones[0];
    while (bone?.parent?.isBone) bone = bone.parent;

    const wrapper = bone?.parent || bone;
    if (wrapper && !seen.has(wrapper.uuid)) {
      seen.add(wrapper.uuid);
      targets.push(wrapper);
    }
  });

  return targets;
}

function PrayerHands({
  demographic = DEFAULT_DEMOGRAPHIC,
  pose = DEFAULT_POSE,
  material,
  withGradient = false,
  scale = 1,
  spread = 0,
  spreadAxis = 'x',
  animate = false,
  ...groupProps
}) {
  const group = useRef(null);
  const mixerRef = useRef(null);
  // Base positions of each hand's wrapper group, so the spread offset is always
  // applied relative to the model's own layout, never compounded.
  const spreadBaseRef = useRef([]);

  const { scene, animations } = useGLTF(resolveModelPath(demographic));

  // Clone per instance so three shells of the same demographic don't share a
  // skeleton (SkeletonUtils preserves bone names, which the clips target).
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Single-frame poses resolve to duration 0, which breaks the mixer's loop
  // math, so give them a tiny non-zero duration.
  const clips = useMemo(() => {
    return animations.map((clip) => {
      const cloned = clip.clone();
      if (cloned.duration <= 0) cloned.duration = 1 / 30;
      return cloned;
    });
  }, [animations]);

  // These models include the forearm, so the origin sits at the arm root, not
  // the hands. Recentering on the bounding-box center makes per-shell scale and
  // rotation pivot in place — otherwise different shell scales fan the hands
  // out to different positions instead of nesting concentrically.
  //
  // Measure the bbox AFTER applying the pose: T-pose and prayer pose have very
  // different extents (especially for child), so T-pose normalization produces
  // wrong scale and wrong vertical centering when the posed skeleton is rendered.
  const { modelScale, center } = useMemo(() => {
    const clip = clips.find((c) => c.name === pose) || clips[0];
    if (clip) {
      const tempMixer = new AnimationMixer(clone);
      const action = tempMixer.clipAction(clip);
      action.reset().play();
      action.paused = true;
      tempMixer.update(0);
      tempMixer.stopAllAction();
      tempMixer.uncacheRoot(clone);
    }
    clone.updateMatrixWorld(true);
    const box = new Box3().setFromObject(clone);
    if (box.isEmpty()) {
      return { modelScale: 1, center: new Vector3() };
    }
    const size = box.getSize(new Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z, 1e-6);
    return {
      modelScale: TARGET_MAX_DIMENSION / maxDimension,
      center: box.getCenter(new Vector3()),
    };
  }, [clone, clips, pose]);

  const composedScale = useMemo(() => {
    return composeScale(scale, modelScale);
  }, [scale, modelScale]);

  // Override material on the skinned meshes. The per-vertex gradient attribute
  // is a costly O(verts) CPU pass, so only build it when a gradient material
  // (tip→wrist fade) actually needs it.
  useEffect(() => {
    clone.traverse((node) => {
      if (!node.isMesh) return;

      if (withGradient) ensurePrayerGradientAttribute(node.geometry);
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;

      if (material) node.material = material;
    });
  }, [clone, material, withGradient]);

  // Sample the chosen pose ONCE and leave the skeleton static (no per-frame
  // mixer) so manual bone edits like spread persist. Record each root bone's
  // posed position as the spread baseline.
  useEffect(() => {
    if (!group.current) return undefined;

    const clip = clips.find((candidate) => candidate.name === pose) || clips[0];
    if (!clip) return undefined;

    const mixer = new AnimationMixer(group.current);
    mixerRef.current = mixer;
    const action = mixer.clipAction(clip);
    action.reset().play();
    action.paused = !animate;
    mixer.update(0);

    spreadBaseRef.current = collectSpreadTargets(clone).map((node) => ({
      node,
      position: node.position.clone(),
    }));

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(group.current);
      mixerRef.current = null;
    };
  }, [clone, clips, pose, animate]);

  // Spread the pair's two hands apart along an axis so an outer shell can open
  // up and cup the inner one. Applied relative to the recorded posed baseline,
  // so it's idempotent and survives spread-only changes.
  useEffect(() => {
    const bases = spreadBaseRef.current;
    if (!bases.length) return;

    bases.forEach(({ node, position }) => {
      // The mirrored (left) hand wrapper always has scale.x < 0; it spreads in
      // +x. The un-mirrored (right) hand spreads in -x. This is independent of
      // traversal order so it's consistent across all three demographics.
      const sign = node.scale.x < 0 ? 1 : -1;
      const offset = spread * sign;
      node.position.set(
        position.x + (spreadAxis === 'x' ? offset : 0),
        position.y + (spreadAxis === 'y' ? offset : 0),
        position.z + (spreadAxis === 'z' ? offset : 0)
      );
    });
  }, [clone, pose, spread, spreadAxis]);

  // Only ticks when a shell is set to animate (unused by default); static hero
  // poses skip this entirely.
  useFrame((_, delta) => {
    if (animate && mixerRef.current) mixerRef.current.update(delta);
  });

  return (
    <group ref={group} {...groupProps} dispose={null} scale={composedScale}>
      <group position={[-center.x, -center.y, -center.z]}>
        <primitive object={clone} />
      </group>
    </group>
  );
}

export default memo(PrayerHands);
