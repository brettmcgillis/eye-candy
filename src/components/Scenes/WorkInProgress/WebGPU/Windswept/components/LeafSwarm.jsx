import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { useCartoonLeafGeometry } from '../../../../../elements/CartoonLeaf/CartoonLeaf';
import { useCartoonSakuraGeometry } from '../../../../../elements/CartoonSakura/CartoonSakura';
import attractorFields, { paramKey } from '../utils/attractorFields';
import createAttractorSwarm from '../utils/createAttractorSwarm';
import createFlowStep from '../utils/flowStep';
import { PHYSICAL_ATTRACTORS_MODE } from '../utils/modes';
import {
  createPhysicalAttractorState,
  createPhysicalStep,
  syncPhysicalAttractors,
} from '../utils/physicalAttractors';

const MAX_DELTA = 0.05;

// Builds this build's mode-specific physics: the compute-kernel `step`
// callback and the extra uniforms it reads (physical mode also gets a live
// attractor state, synced from Leva each frame in useFrame below). Strange
// attractors mode needs none of that — velocity is recomputed straight from
// the field every step, no persisted attractor state.
function buildModeAssets(config) {
  if (config.mode === PHYSICAL_ATTRACTORS_MODE) {
    const physicalState = createPhysicalAttractorState();
    return {
      makeExtraUniforms: () => ({
        attractorStrength: uniform(config.attractorStrength),
        damping: uniform(config.damping),
        maxSpeed: uniform(config.maxSpeed),
        spinStrength: uniform(config.spinStrength),
      }),
      physicalState,
      step: createPhysicalStep(physicalState),
    };
  }

  const entry = attractorFields[config.attractorType];
  return {
    makeExtraUniforms: () => {
      const extra = { stepSize: uniform(config.stepSize) };
      entry.paramNames.forEach((name) => {
        const key = paramKey(entry.key, name);
        extra[name] = uniform(config[key] ?? entry.defaults[name]);
      });
      return extra;
    },
    physicalState: null,
    step: createFlowStep(entry.derivative, entry.paramNames),
  };
}

// Two GPU-compute swarms (leaves + sakura petals) sharing one set of
// physics — strange-attractor flow field or physical gravity+spin
// attractors, per config.mode. Owns the one authoritative compute step per
// frame; both InstancedMeshes are purely visual output of their swarm's
// storage buffers.
function LeafSwarm({ attractorsRef, config }) {
  const { gl } = useThree();
  const leafAsset = useCartoonLeafGeometry();
  const sakuraAsset = useCartoonSakuraGeometry();
  const groupRef = useRef(new THREE.Group());
  const swarmsRef = useRef({ leaf: null, sakura: null });
  const physicalStateRef = useRef(null);
  const readyRef = useRef(false);
  const elapsedRef = useRef(0);

  // Rebuilding a swarm reallocates its GPU storage buffers — debounce the
  // structural controls (counts), same as Fireflies/Weightless.
  const [counts, setCounts] = useState({
    leaf: Math.round(config.particleCount * (1 - config.sakuraRatio)),
    sakura: Math.round(config.particleCount * config.sakuraRatio),
  });
  useEffect(() => {
    const id = setTimeout(() => {
      const next = {
        leaf: Math.round(config.particleCount * (1 - config.sakuraRatio)),
        sakura: Math.round(config.particleCount * config.sakuraRatio),
      };
      setCounts((prev) =>
        prev.leaf === next.leaf && prev.sakura === next.sakura ? prev : next
      );
    }, 300);
    return () => clearTimeout(id);
  }, [config.particleCount, config.sakuraRatio]);

  useEffect(() => {
    const group = groupRef.current;
    const assets = buildModeAssets(config);
    physicalStateRef.current = assets.physicalState;

    const leaf = createAttractorSwarm({
      baseMaterial: leafAsset.material,
      count: Math.max(counts.leaf, 1),
      extraUniforms: assets.makeExtraUniforms(),
      geometry: leafAsset.geometry,
      seedOffset: 0,
      step: assets.step,
    });
    const sakura = createAttractorSwarm({
      baseMaterial: sakuraAsset.material,
      count: Math.max(counts.sakura, 1),
      extraUniforms: assets.makeExtraUniforms(),
      geometry: sakuraAsset.geometry,
      seedOffset: counts.leaf,
      step: assets.step,
    });

    group.add(leaf.mesh, sakura.mesh);
    swarmsRef.current = { leaf, sakura };
    readyRef.current = false;

    return () => {
      group.remove(leaf.mesh, sakura.mesh);
      leaf.dispose();
      sakura.dispose();
      swarmsRef.current = { leaf: null, sakura: null };
      physicalStateRef.current = null;
    };
  }, [counts, leafAsset, sakuraAsset, config.mode, config.attractorType]);

  useFrame((_state, rawDelta) => {
    const { leaf, sakura } = swarmsRef.current;
    if (!leaf || !sakura) return;

    if (!readyRef.current) {
      gl.compute(leaf.initKernel);
      gl.compute(sakura.initKernel);
      readyRef.current = true;
    }

    const delta = Math.min(Math.max(rawDelta, 1e-4), MAX_DELTA);
    elapsedRef.current += delta;

    if (physicalStateRef.current) {
      syncPhysicalAttractors(
        physicalStateRef.current,
        attractorsRef,
        config,
        elapsedRef.current
      );
    }

    [
      { scale: config.leafScale, swarm: leaf },
      { scale: config.sakuraScale, swarm: sakura },
    ].forEach(({ scale, swarm }) => {
      const u = swarm.uniforms;
      u.frameDelta.value = delta;
      u.orientationJitter.value = config.orientationJitter;
      u.scale.value = scale;
      u.speed.value = config.speed;
      u.worldScale.value = config.worldScale;

      if (config.mode === PHYSICAL_ATTRACTORS_MODE) {
        u.attractorStrength.value = config.attractorStrength;
        u.damping.value = config.damping;
        u.maxSpeed.value = config.maxSpeed;
        u.spinStrength.value = config.spinStrength;
      } else {
        const entry = attractorFields[config.attractorType];
        entry.paramNames.forEach((name) => {
          const key = paramKey(entry.key, name);
          u[name].value = config[key] ?? entry.defaults[name];
        });
        u.stepSize.value = config.stepSize;
      }

      gl.compute(swarm.updateKernel);
    });
  });

  return <primitive object={groupRef.current} />;
}

export default memo(LeafSwarm);
