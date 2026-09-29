import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import EFFECTS from './effects';

// Builds a runtime post config's chain into one RenderPipeline. PostRig runs
// it every frame; the headless CLIs call it directly so a still goes through
// the same effects the scene does. Returns null when nothing is active.
export default function createPostChain({
  camera,
  lights = {},
  passOptions,
  renderer,
  scene,
  slots,
}) {
  const scenePass = pass(scene, camera, passOptions);
  const ctx = {
    camera,
    colorNode: scenePass.getTextureNode('output'),
    depthNode: scenePass.getTextureNode('depth'),
    renderer,
    scene,
    scenePass,
    viewZNode: scenePass.getViewZNode(),
  };

  const chain = [];
  const node = slots.reduce((input, slot) => {
    const effect = EFFECTS[slot.type];
    const light = slot.light ? lights[slot.light] : null;

    if (!effect || (effect.isReady && !effect.isReady(slot, light))) {
      return input;
    }

    const built = effect.create({ ctx, input, light, slot });
    chain.push({ slot, update: built.update });
    return built.node;
  }, ctx.colorNode);

  if (chain.length === 0) return null;

  const pipeline = new THREE.RenderPipeline(renderer);
  pipeline.outputNode = node;

  return { chain, pipeline };
}
