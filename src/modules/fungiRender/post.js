import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

// The scene's PostRig declaration: bloom only above 1.0, so nothing but the
// glow gene's emissive ever blooms and the rest stays Flora-clean.
export const FUNGI_POST = {
  bloom: {
    type: 'bloom',
    radius: 0.3,
    strength: 0.25,
    threshold: 1,
  },
};

// The headless twin of FUNGI_POST: one pipeline per capturer, with the bloom
// strength following each specimen's glow.
export default function createSpecimenPost(
  renderer,
  scene,
  camera,
  { samples = 4 } = {}
) {
  const scenePass = pass(scene, camera, samples > 0 ? { samples } : {});
  const color = scenePass.getTextureNode('output');
  const glow = bloom(
    color,
    FUNGI_POST.bloom.strength,
    FUNGI_POST.bloom.radius,
    FUNGI_POST.bloom.threshold
  );
  const post = new THREE.RenderPipeline(renderer);
  post.outputNode = color.add(glow);
  return {
    post,
    setGlow(amount) {
      glow.strength.value = FUNGI_POST.bloom.strength * (amount > 0 ? 1 : 0);
    },
  };
}
