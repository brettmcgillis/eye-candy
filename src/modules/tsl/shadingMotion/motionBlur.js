import {
  Fn,
  clamp,
  length,
  max,
  mix,
  screenSize,
  screenUV,
  step,
  texture,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const BLUR_SAMPLES = 16;
const EDGE_DILATE = 3;
const VELOCITY_VISUALIZATION_SCALE = 32;
const NEIGHBORS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

// Paints a mesh with its own screen-space velocity: rg = UV delta per frame.
export function createVelocityMaterial(velocity) {
  const material = new THREE.MeshBasicNodeMaterial();
  material.outputNode = vec4(velocity, 0, 1);
  return material;
}

export function createVelocityTarget(width, height) {
  return new THREE.RenderTarget(width, height, {
    depthBuffer: true,
    stencilBuffer: false,
    type: THREE.HalfFloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  });
}

// Takes the fastest velocity within a dilated 3x3 so the blur can smear past
// an object's silhouette, then averages 16 scene taps along it.
export function motionBlurNode(sceneTexture, velocityTarget, blurAmount) {
  return Fn(() => {
    const velocityTexture = texture(velocityTarget.texture);
    const texelSize = vec2(1).div(screenSize).mul(EDGE_DILATE);
    const bestVelocity = velocityTexture.sample(screenUV).xy.toVar();
    const bestLength = length(bestVelocity).toVar();

    NEIGHBORS.forEach(([x, y]) => {
      const neighborVelocity = velocityTexture.sample(
        screenUV.add(texelSize.mul(vec2(x, y)))
      ).xy;
      const neighborLength = length(neighborVelocity);
      bestVelocity.assign(
        mix(bestVelocity, neighborVelocity, step(bestLength, neighborLength))
      );
      bestLength.assign(max(bestLength, neighborLength));
    });

    const color = vec4(0).toVar();
    for (let index = 0; index < BLUR_SAMPLES; index += 1) {
      const phase = index / (BLUR_SAMPLES - 1) - 0.5;
      color.addAssign(
        sceneTexture.sample(
          screenUV.add(bestVelocity.mul(blurAmount).mul(phase))
        )
      );
    }
    return color.div(BLUR_SAMPLES);
  })();
}

export function velocityMapNode(velocityTarget) {
  return Fn(() => {
    const sample = texture(velocityTarget.texture).sample(screenUV);
    const encoded = vec3(
      clamp(sample.xy.mul(VELOCITY_VISUALIZATION_SCALE).add(0.5), 0, 1),
      0.5
    );
    return vec4(mix(vec3(0), encoded, sample.a), 1);
  })();
}
