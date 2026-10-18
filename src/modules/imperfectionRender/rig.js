import { positionGeometry, rtt, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { imageNode, liteNode, paintBufferNode } from './nodes/passes';
import { applyConfig, createUniforms, setSourceFrame } from './uniforms';

function fullscreenMaterial(fragmentNode) {
  const material = new THREE.NodeMaterial();
  material.vertexNode = vec4(positionGeometry.xy, 0, 1);
  material.fragmentNode = fragmentNode;
  material.depthTest = false;
  material.depthWrite = false;
  return material;
}

// Full: Buffer A as a half-float render-to-texture (its alpha packs exact
// integers), read by the Image pass. Lite: one pass.
function buildMaterial(uniforms, options) {
  if (options.variant === 'lite') {
    return fullscreenMaterial(liteNode(uniforms, options));
  }
  const buffer = rtt(paintBufferNode(uniforms, options), null, null, {
    type: THREE.HalfFloatType,
  });
  return fullscreenMaterial(imageNode(uniforms, buffer, options));
}

// Everything that changes the shader's code rather than a uniform.
export function materialOptions(config, view) {
  const lite = config.variant === 'lite';
  return {
    composition:
      (config.composition ?? 'reference') === 'reference'
        ? 'reference'
        : 'generated',
    engine: config.blockEngine,
    lic: !lite && Boolean(config.wetLic),
    source: config.fieldSource === 'image' ? 'texture' : 'anchors',
    variant: lite ? 'lite' : 'full',
    view: lite && ['wetness', 'blocks'].includes(view) ? 'painting' : view,
  };
}

// The painting as one imperative object, drawn by the scene and the headless
// CLIs alike: `apply(config, { time, view })` sets every uniform and picks
// the version's material.
export default function createPaintRig() {
  const uniforms = createUniforms();
  const materials = new Map();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  mesh.frustumCulled = false;

  function materialFor(config, view) {
    const options = materialOptions(config, view);
    const key = JSON.stringify(options);
    if (!materials.has(key))
      materials.set(key, buildMaterial(uniforms, options));
    return materials.get(key);
  }

  return {
    mesh,
    uniforms,

    // RGBA bytes, row 0 at the top (a canvas decode, a webcam frame, sharp);
    // null goes back to the placeholder.
    setSource(frame) {
      setSourceFrame(uniforms, frame);
    },

    apply(config, { time = 0, view = 'painting' } = {}) {
      applyConfig(uniforms, config, { time });
      mesh.material = materialFor(config, view);
      return materialOptions(config, view);
    },

    dispose() {
      materials.forEach((material) => material.dispose());
      materials.clear();
      mesh.geometry.dispose();
    },
  };
}
