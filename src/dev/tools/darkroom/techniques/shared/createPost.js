import * as THREE from 'three/webgpu';

import createSourcePlane from './createSourcePlane';

// A screen-space effect over the source. `build` makes the effect for the
// options it bakes into its shader (`baked`); everything else goes through
// its uniforms in `update`. `prepare(renderer, dt)` runs before each frame (temporal
// effects render the source into their own history there).
export default function createPost(stage, { baked = [], build }) {
  const plane = createSourcePlane();
  let effect = null;
  let pipeline = null;
  let bakedKey = '';

  return {
    async render({ dt = 0, frame, options, size }) {
      const { renderer } = await stage.gpu();
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.shadowMap.enabled = false;
      plane.update(frame, size, options.fit);

      const key = [
        size.width,
        size.height,
        ...baked.map((k) => options[k]),
      ].join('|');
      if (key !== bakedKey) {
        bakedKey = key;
        effect?.dispose?.();
        pipeline?.dispose();
        effect = build({ options, plane, size });
        pipeline = new THREE.RenderPipeline(renderer);
        pipeline.outputNode = effect.colorNode;
      }
      effect.update?.(options);
      effect.prepare?.(renderer, dt);
      pipeline.render();
    },
    reset() {
      bakedKey = '';
    },
    dispose() {
      effect?.dispose?.();
      pipeline?.dispose();
      plane.dispose();
    },
  };
}
