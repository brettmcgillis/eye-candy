import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { instancedArray, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import useManualDrops from '../hooks/useManualDrops';
import createBedLayout from '../utils/bedLayout';
import createGrainMaterial from '../utils/grainMaterial';
import {
  PALETTE_NONE,
  createNeutralPaletteTexture,
  createPaletteTexture,
} from '../utils/palette';
import createReactionField from '../utils/reactionField';

function buildSandUniforms() {
  return {
    bedBaseY: uniform(0),
    bedRadius: uniform(3.4),
    bedThickness: uniform(0.22),
    cullEnabled: uniform(0),
    cullSoftness: uniform(0.08),
    cullThreshold: uniform(0.4),
    fieldHeightScale: uniform(0.2),
    fieldTint: uniform(0.5),
    fieldTintColor: uniform(new THREE.Color('#3d3226')),
    grainColor: uniform(new THREE.Color('#c9b493')),
    grainColorB: uniform(new THREE.Color('#a68a63')),
    grainColorC: uniform(new THREE.Color('#e6dcc8')),
    grainPaletteMix: uniform(0),
    grainPaletteSplitB: uniform(0.55),
    grainPaletteSplitC: uniform(0.85),
    grainRoll: uniform(6),
    grainSize: uniform(0.014),
    grainSizeCoarse: uniform(1),
    grainSizeMax: uniform(1.45),
    grainSizeMin: uniform(0.55),
    paletteAdvect: uniform(1),
    paletteMix: uniform(0),
    paletteShift: uniform(0),
  };
}

// A large seed radius fills the whole domain in one pass — the closest
// equivalent to the reference shader's `iFrame < 10` full-frame noise seed.
const ALWAYS_ON_RADIUS = 2;

// A drop is held here and fed to the field a slice at a time, rather than
// stamped in one frame. `remaining` counts the fade down; the strength each
// frame is the share of what's left, so the blob arrives fully at the end of
// the fade instead of asymptotically approaching it.
// Field uv back out to world, so the camera and depth of field can aim at the
// drop. The height is the middle of the relief rather than the surface itself:
// the actual crest is only known on the GPU, and half a relief of error is
// well inside the depth of field's focal range.
function publishTarget(dropTargetRef, config, centerX, centerY) {
  dropTargetRef?.current?.set(
    (centerX - 0.5) * config.bedRadius * 2,
    config.bedBaseY + config.fieldHeightScale * 0.5,
    (centerY - 0.5) * config.bedRadius * 2
  );
}

function createDrop(config, centre) {
  return {
    ...centre,
    radius: config.seedRadius * (0.55 + Math.random() * 1.1),
    remaining: Math.max(config.dropFade, 1e-3),
    salt: Math.random() * 1000,
  };
}

function advanceDrop({ drop, gl, reactionField, step }) {
  if (!drop) return null;

  const strength = Math.min(step / Math.max(drop.remaining, step), 1);
  reactionField.inject(gl, {
    centerX: drop.centerX,
    centerY: drop.centerY,
    radius: drop.radius,
    salt: drop.salt,
    strength,
  });

  const remaining = drop.remaining - step;
  return remaining > 0 ? { ...drop, remaining } : null;
}

function reseedForMode({ gl, growthMode, reactionField, seedRadius }) {
  if (growthMode === 'alwaysOn') {
    reactionField.reseed(gl, { radius: ALWAYS_ON_RADIUS });
  } else {
    reactionField.reseed(gl, { radius: seedRadius });
  }
}

function SandField({ config, dropTargetRef = null }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const runtimeRef = useRef(null);
  const pendingDropRef = useRef(null);
  // Read by the pointer handler, which must not be re-bound on every edit.
  const configRef = useRef(config);
  configRef.current = config;

  // Queued rather than injected here: the drop is a compute dispatch, and the
  // frame loop is where every other dispatch in this scene is issued.
  const handleManualDrop = useCallback((point) => {
    const { bedRadius } = configRef.current;
    pendingDropRef.current = {
      centerX: point.x / (bedRadius * 2) + 0.5,
      centerY: point.z / (bedRadius * 2) + 0.5,
    };
  }, []);

  useManualDrops({
    camera,
    enabled: config.growthMode === 'manualDrops',
    gl,
    groundY: config.bedBaseY,
    onDrop: handleManualDrop,
  });

  // Rebuilt only when the chosen gradient changes, and repointed on the
  // material's sampler per frame — swapping the palette must not disturb the
  // running simulation, which rebuilding the material would.
  const paletteTexture = useMemo(
    () =>
      createPaletteTexture(config.paletteName) ?? createNeutralPaletteTexture(),
    [config.paletteName]
  );

  useEffect(() => () => paletteTexture.dispose(), [paletteTexture]);

  useEffect(() => {
    const count = config.bedCount;
    const home = new Float32Array(count * 4);
    const rot = new Float32Array(count * 4);

    createBedLayout({ count, home, seed: config.seed });
    for (let index = 0; index < count; index += 1) {
      const slot = index * 4;
      rot[slot] = Math.random() * Math.PI * 2;
      rot[slot + 1] = Math.random() * Math.PI * 2;
      rot[slot + 2] = Math.random() * Math.PI * 2;
      rot[slot + 3] = Math.random();
    }

    const buffers = {
      home: instancedArray(home, 'vec4'),
      rot: instancedArray(rot, 'vec4'),
    };
    const uniforms = buildSandUniforms();
    const reactionField = createReactionField({
      blurSpread: config.blurSpread,
      height: config.fieldResolution,
      width: config.fieldResolution,
    });

    reseedForMode({
      gl,
      growthMode: config.growthMode,
      reactionField,
      seedRadius: config.seedRadius,
    });
    // Centre of the bed until the first drop, so `target` mode has somewhere
    // to aim on load and in modes that never drop at all.
    publishTarget(dropTargetRef, config, 0.5, 0.5);

    const { material, paletteTextureNode } = createGrainMaterial({
      buffers,
      fieldTexel: 1 / config.fieldResolution,
      fieldTexture: reactionField.outputTexture,
      paletteTexture,
      uniforms,
    });

    const geometry = new THREE.InstancedBufferGeometry().copy(
      new THREE.BoxGeometry(1, 1, 1)
    );
    geometry.instanceCount = count;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;

    scene.add(mesh);
    runtimeRef.current = {
      drop: null,
      dropElapsed: 0,
      geometry,
      growthMode: config.growthMode,
      material,
      mesh,
      paletteTextureNode,
      reactionField,
      time: 0,
      uniforms,
    };

    return () => {
      runtimeRef.current = null;
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      reactionField.dispose();
    };
    // Deliberately narrow: only things baked into a buffer or a compute
    // kernel rebuild here. Everything a preset switch normally changes
    // (depth, radius, relief, culling, growth mode) is a live uniform, so
    // switching presets never restarts the simulation.
  }, [
    config.bedCount,
    config.blurSpread,
    config.fieldResolution,
    config.seed,
    gl,
    scene,
  ]);

  useFrame((_, delta) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const { reactionField, uniforms } = runtime;
    const step = Math.min(delta, 1 / 30);
    runtime.time += step;

    if (runtime.growthMode !== config.growthMode) {
      runtime.growthMode = config.growthMode;
      runtime.dropElapsed = 0;
      runtime.drop = null;
      reseedForMode({
        gl,
        growthMode: config.growthMode,
        reactionField,
        seedRadius: config.seedRadius,
      });
    } else if (config.growthMode === 'seedDrops') {
      runtime.dropElapsed += step;
      if (runtime.dropElapsed >= config.dropInterval) {
        runtime.dropElapsed = 0;
        // Each drop lands somewhere new at its own size and its own colour.
        // Injected rather than reseeded: clearing the field first is what made
        // this read as a hard reset instead of the pattern being fed.
        runtime.drop = createDrop(config, {
          centerX: 0.2 + Math.random() * 0.6,
          centerY: 0.2 + Math.random() * 0.6,
        });
        publishTarget(
          dropTargetRef,
          config,
          runtime.drop.centerX,
          runtime.drop.centerY
        );
      }
    }

    if (pendingDropRef.current) {
      runtime.drop = createDrop(config, pendingDropRef.current);
      publishTarget(
        dropTargetRef,
        config,
        runtime.drop.centerX,
        runtime.drop.centerY
      );
      pendingDropRef.current = null;
    }

    runtime.drop = advanceDrop({
      drop: runtime.drop,
      gl,
      reactionField,
      step,
    });

    reactionField.uniforms.boundaryBounce.value = config.boundaryBounce ? 1 : 0;
    reactionField.uniforms.decayRate.value = config.decayRate;
    reactionField.uniforms.expansionStrength.value = config.expansionStrength;
    reactionField.uniforms.fieldContrast.value = config.fieldContrast;
    reactionField.uniforms.noiseAmount.value = config.noiseAmount;
    reactionField.uniforms.paletteRefresh.value = config.paletteRefresh;
    reactionField.uniforms.reactionStrength.value = config.reactionStrength;

    reactionField.update(gl, runtime.time);

    uniforms.bedBaseY.value = config.bedBaseY;
    uniforms.bedRadius.value = config.bedRadius;
    uniforms.bedThickness.value = config.bedThickness;
    uniforms.cullEnabled.value = config.cullEnabled ? 1 : 0;
    uniforms.cullSoftness.value = config.cullSoftness;
    uniforms.cullThreshold.value = config.cullThreshold;
    uniforms.fieldHeightScale.value = config.fieldHeightScale;
    uniforms.fieldTint.value = config.fieldTint;
    uniforms.fieldTintColor.value.set(config.fieldTintColor);
    uniforms.grainColor.value.set(config.grainColor);
    uniforms.grainColorB.value.set(config.grainColorB);
    uniforms.grainColorC.value.set(config.grainColorC);
    uniforms.grainPaletteMix.value = config.grainPaletteMix;
    uniforms.grainPaletteSplitB.value = config.grainPaletteSplitB;
    uniforms.grainPaletteSplitC.value = config.grainPaletteSplitC;
    uniforms.grainRoll.value = config.grainRoll;
    uniforms.grainSize.value = config.grainSize;
    uniforms.grainSizeCoarse.value = config.grainSizeCoarse;
    uniforms.grainSizeMax.value = config.grainSizeMax;
    uniforms.grainSizeMin.value = config.grainSizeMin;
    uniforms.paletteAdvect.value = config.paletteAdvect;
    uniforms.paletteShift.value = config.paletteShift;
    // No gradient selected means no palette contribution at all — the sampler
    // still has the neutral texture bound, so this is the only switch.
    uniforms.paletteMix.value =
      config.paletteName === PALETTE_NONE ? 0 : config.paletteMix;
    runtime.paletteTextureNode.value = paletteTexture;
    runtime.material.roughness = config.grainRoughness;
    runtime.material.metalness = config.grainMetalness;
  });

  return null;
}

export default memo(SandField);
