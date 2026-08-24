/* eslint-disable no-underscore-dangle */
import React, { useEffect, useMemo, useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

const MODEL_FILES = {
  hummingbird: 'hummingbird.glb',
  kingfisher: 'KingFisher.glb',
  robin: 'robin__bird.glb',
};

const DEFAULT_CLIP_BY_MODEL = {
  hummingbird: 'take 001',
  kingfisher: 'idleA1_bird',
  robin: 'Robin_Bird_Idle2',
};

function resolveClipName(requestedClip, fallbackClip, animations) {
  const clipNames = (animations || []).map((clip) => clip.name);

  if (requestedClip && clipNames.includes(requestedClip)) {
    return requestedClip;
  }

  if (fallbackClip && clipNames.includes(fallbackClip)) {
    return fallbackClip;
  }

  return clipNames[0] || null;
}

function buildTintedMaterials(materials, color) {
  return Object.fromEntries(
    Object.entries(materials || {}).map(([name, material]) => {
      const nextMaterial = material.clone();
      if (color && nextMaterial.color) {
        nextMaterial.color.set(color);
      }
      nextMaterial.needsUpdate = true;
      return [name, nextMaterial];
    })
  );
}

function renderRobin(nodes, materials) {
  return (
    <group name="Sketchfab_Scene">
      <primitive object={nodes._rootJoint} />
      <skinnedMesh
        name="Object_7"
        geometry={nodes.Object_7.geometry}
        material={materials.Robin_Bird_Merge}
        skeleton={nodes.Object_7.skeleton}
        rotation={[-1.517, 0, 0]}
        scale={0.01}
      />
    </group>
  );
}

function renderKingfisher(nodes, materials) {
  return (
    <group name="Sketchfab_Scene">
      <primitive object={nodes.GLTF_created_0_rootJoint} />
      <skinnedMesh
        name="Object_566"
        geometry={nodes.Object_566.geometry}
        material={materials.body}
        skeleton={nodes.Object_566.skeleton}
        scale={0.145}
      />
      <skinnedMesh
        name="Object_569"
        geometry={nodes.Object_569.geometry}
        material={materials.body}
        skeleton={nodes.Object_569.skeleton}
        scale={0.145}
      />
      <skinnedMesh
        name="Object_572"
        geometry={nodes.Object_572.geometry}
        material={materials.body}
        skeleton={nodes.Object_572.skeleton}
        scale={0.145}
      />
      <skinnedMesh
        name="Object_575"
        geometry={nodes.Object_575.geometry}
        material={materials.body}
        skeleton={nodes.Object_575.skeleton}
        scale={0.145}
      />
      <skinnedMesh
        name="Object_578"
        geometry={nodes.Object_578.geometry}
        material={materials.body}
        skeleton={nodes.Object_578.skeleton}
        scale={0.145}
      />
      <skinnedMesh
        name="Object_581"
        geometry={nodes.Object_581.geometry}
        material={materials.body}
        skeleton={nodes.Object_581.skeleton}
        scale={0.145}
      />
      <skinnedMesh
        name="Object_584"
        geometry={nodes.Object_584.geometry}
        material={materials.body}
        skeleton={nodes.Object_584.skeleton}
        scale={0.145}
      />
      <skinnedMesh
        name="Object_587"
        geometry={nodes.Object_587.geometry}
        material={materials.body}
        skeleton={nodes.Object_587.skeleton}
        scale={0.145}
      />
      <skinnedMesh
        name="Object_590"
        geometry={nodes.Object_590.geometry}
        material={materials.body}
        skeleton={nodes.Object_590.skeleton}
        scale={0.145}
      />
      <skinnedMesh
        name="Object_593"
        geometry={nodes.Object_593.geometry}
        material={materials.body}
        skeleton={nodes.Object_593.skeleton}
        scale={0.145}
      />
      <skinnedMesh
        name="Object_596"
        geometry={nodes.Object_596.geometry}
        material={materials.body}
        skeleton={nodes.Object_596.skeleton}
        scale={0.145}
      />
    </group>
  );
}

function renderHummingbird(nodes, materials) {
  return (
    <group name="Sketchfab_Scene">
      <group name="RootNode" scale={17.754}>
        <group
          name="Bird"
          position={[-2.255, 2.158, -4.582]}
          rotation={[-1.585, 0.195, 1.709]}
        >
          <group name="Object_5">
            <primitive object={nodes._rootJoint} />
            <skinnedMesh
              name="Object_721"
              geometry={nodes.Object_721.geometry}
              material={materials.Hummingbird_eyes}
              skeleton={nodes.Object_721.skeleton}
            />
            <skinnedMesh
              name="Object_722"
              geometry={nodes.Object_722.geometry}
              material={materials.Hummingbird_eyelens}
              skeleton={nodes.Object_722.skeleton}
            />
            <skinnedMesh
              name="Object_723"
              geometry={nodes.Object_723.geometry}
              material={materials.Hummingbird_eyelids}
              skeleton={nodes.Object_723.skeleton}
            />
            <skinnedMesh
              name="Object_725"
              geometry={nodes.Object_725.geometry}
              material={materials.Hummingbird_feather}
              skeleton={nodes.Object_725.skeleton}
            />
            <skinnedMesh
              name="Object_727"
              geometry={nodes.Object_727.geometry}
              material={materials.Hummingbird_body}
              skeleton={nodes.Object_727.skeleton}
            />
            <skinnedMesh
              name="Object_728"
              geometry={nodes.Object_728.geometry}
              material={materials.Hummingbird_peck}
              skeleton={nodes.Object_728.skeleton}
            />
            <skinnedMesh
              name="Object_729"
              geometry={nodes.Object_729.geometry}
              material={materials.Hummingbird_leg}
              skeleton={nodes.Object_729.skeleton}
            />
            <skinnedMesh
              name="Object_730"
              geometry={nodes.Object_730.geometry}
              material={materials.Hummingbird_tongue}
              skeleton={nodes.Object_730.skeleton}
            />
            <skinnedMesh
              name="Object_732"
              geometry={nodes.Object_732.geometry}
              material={materials.Hummingbird_feather}
              skeleton={nodes.Object_732.skeleton}
            />
          </group>
        </group>
      </group>
    </group>
  );
}

export default function Bird({
  animationName,
  color,
  model,
  position,
  rotation,
  scale,
  ...props
}) {
  const group = useRef();
  const fileName = MODEL_FILES[model] || MODEL_FILES.robin;
  const { scene, animations } = useGLTF(modelFile(fileName));
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  const fallbackClip =
    DEFAULT_CLIP_BY_MODEL[model] || DEFAULT_CLIP_BY_MODEL.robin;
  const activeClip = useMemo(() => {
    return resolveClipName(animationName, fallbackClip, animations);
  }, [animationName, animations, fallbackClip]);

  useEffect(() => {
    const action = activeClip ? actions?.[activeClip] : null;

    if (!action) return undefined;

    Object.values(actions || {}).forEach((existingAction) => {
      existingAction?.stop();
    });

    action.reset().fadeIn(0.15).play();

    return () => {
      action.fadeOut(0.15);
    };
  }, [actions, activeClip]);

  const tintedMaterials = useMemo(() => {
    return buildTintedMaterials(materials, color);
  }, [color, materials]);

  const modelMarkup = useMemo(() => {
    if (model === 'hummingbird') {
      return renderHummingbird(nodes, tintedMaterials);
    }

    if (model === 'kingfisher') {
      return renderKingfisher(nodes, tintedMaterials);
    }

    return renderRobin(nodes, tintedMaterials);
  }, [model, nodes, tintedMaterials]);

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      scale={scale}
      {...props}
      dispose={null}
    >
      {modelMarkup}
    </group>
  );
}

Bird.displayName = 'Bird';

useGLTF.preload(modelFile('hummingbird.glb'));
useGLTF.preload(modelFile('KingFisher.glb'));
useGLTF.preload(modelFile('robin__bird.glb'));
