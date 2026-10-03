import { float } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { CLASSES, SPRITE_FLOATS } from '@modules/networkTest';

import { createRibbonGeometry, createSpriteGeometry } from './geometry';
import createLayer from './layer';
import {
  STYLE_IDS,
  createRibbonMaterial,
  createSpriteMaterial,
  createUniforms,
} from './materials';

const BLENDING = {
  glow: THREE.AdditiveBlending,
  ink: THREE.NormalBlending,
};

function splitSprites({ classes, count, data }) {
  const nodes = new Float32Array(count * SPRITE_FLOATS);
  const pulses = new Float32Array(count * SPRITE_FLOATS);
  let n = 0;
  let p = 0;
  for (let i = 0; i < count; i += 1) {
    const run = data.subarray(i * SPRITE_FLOATS, (i + 1) * SPRITE_FLOATS);
    if (classes[i] === CLASSES.pulse) {
      pulses.set(run, p * SPRITE_FLOATS);
      p += 1;
    } else {
      nodes.set(run, n * SPRITE_FLOATS);
      n += 1;
    }
  }
  return { nodeCount: n, nodes, pulseCount: p, pulses };
}

// The network as one imperative object, drawn by both the scene and the
// headless CLIs: `apply(config)` sets the look, `setInstances` takes what
// @modules/networkTest's buildInstances returned, `setDepthRange` brackets
// the network along the view axis for the depth fade.
export default function createNetworkRig() {
  const group = new THREE.Group();
  const u = createUniforms();
  const edges = createLayer({
    attributes: ['aStart', 'aEnd', 'aColorA', 'aColorB'],
    buildMaterial: () => createRibbonMaterial(u),
    geometry: createRibbonGeometry(),
    group,
    renderOrder: 0,
  });
  const nodes = createLayer({
    attributes: ['aCenter', 'aColor'],
    buildMaterial: () => createSpriteMaterial(u),
    geometry: createSpriteGeometry(),
    group,
    renderOrder: 1,
  });
  const pulses = createLayer({
    attributes: ['aCenter', 'aColor'],
    buildMaterial: () => createSpriteMaterial(u, float(STYLE_IDS.halo)),
    geometry: createSpriteGeometry(),
    group,
    renderOrder: 2,
  });
  const layers = [edges, nodes, pulses];
  let mood = null;

  return {
    group,

    apply(config) {
      u.depthFade.value = config.depthFade;
      u.softness.value = config.edgeSoftness;
      u.nodeStyle.value = STYLE_IDS[config.nodeStyle] ?? STYLE_IDS.halo;
      if (config.mood !== mood) {
        mood = config.mood;
        layers.forEach((layer) =>
          layer.setBlending(BLENDING[mood] ?? THREE.AdditiveBlending)
        );
      }
    },

    setInstances({ segments, sprites }) {
      edges.set(segments.data, segments.count);
      const split = splitSprites(sprites);
      nodes.set(split.nodes, split.nodeCount);
      pulses.set(split.pulses, split.pulseCount);
    },

    setDepthRange(near, far) {
      u.depthNear.value = near;
      u.depthFar.value = Math.max(far, near + 1e-3);
    },

    dispose() {
      layers.forEach((layer) => layer.dispose());
    },
  };
}
