import { instanceIndex, storage, texture, wgslFn } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Slot state is (center.xy, size, confidence), weighted-mean of a 5x5 probe.
const blobKernel = (maxBlobs) =>
  wgslFn(/* wgsl */ `
    fn computeBlobs(
      stateTexture: texture_2d<f32>,
      blobStateBuffer: ptr<storage, array<vec4f>, read_write>,
      index: u32
    ) -> void {
      if (index >= ${maxBlobs}u) {
        return;
      }

      let dimensions = textureDimensions(stateTexture);
      let previousState = blobStateBuffer[index];
      let wasActive = previousState.w > 0.03;
      let slot = f32(index);
      let seed = vec2f(
        fract(slot * 0.61803398875 + 0.13),
        fract(slot * 0.38196601125 + 0.31)
      );
      let probeCenter = select(seed, previousState.xy, wasActive);
      let searchRadius = select(0.45, 0.28, wasActive);
      var weightSum = 0.0;
      var weightedCenter = vec2f(0.0);
      var weightedSecondMoment = vec2f(0.0);
      var strongestMotion = 0.0;

      for (var sampleIndex = 0u; sampleIndex < 25u; sampleIndex++) {
        let sx = f32(sampleIndex % 5u) / 4.0 - 0.5;
        let sy = f32(sampleIndex / 5u) / 4.0 - 0.5;
        let sampleUv = clamp(
          probeCenter + vec2f(sx, sy) * searchRadius,
          vec2f(0.0),
          vec2f(1.0)
        );
        let sampleCoord = clamp(
          vec2i(sampleUv * vec2f(dimensions)),
          vec2i(0),
          vec2i(dimensions) - vec2i(1)
        );
        let motionSample = textureLoad(stateTexture, sampleCoord, 0);
        let trackedMotion = motionSample.g * 0.8 + motionSample.a * 0.2;
        let falloff = max(0.0, 1.0 - length(vec2f(sx, sy)) * 1.25);
        var exclusion = 1.0;

        for (var otherIndex = 0u; otherIndex < ${maxBlobs}u; otherIndex++) {
          if (otherIndex >= index) {
            break;
          }

          let otherState = blobStateBuffer[otherIndex];
          if (otherState.w > 0.04) {
            exclusion *= smoothstep(
              0.035,
              0.13,
              length(sampleUv - otherState.xy)
            );
          }
        }

        let weight = trackedMotion * falloff * exclusion;
        weightSum += weight;
        weightedCenter += sampleUv * weight;
        weightedSecondMoment += sampleUv * sampleUv * weight;
        strongestMotion = max(strongestMotion, trackedMotion);
      }

      var nextState = vec4f(0.0);

      if (strongestMotion > 0.05 && weightSum > 0.004) {
        let detectedCenter = weightedCenter / max(weightSum, 0.0001);
        let variance = max(
          weightedSecondMoment / max(weightSum, 0.0001)
            - detectedCenter * detectedCenter,
          vec2f(0.0)
        );
        let detectedSize = clamp(
          sqrt(max(variance.x, variance.y)) * 0.85,
          0.02,
          0.82
        );
        let center = select(
          detectedCenter,
          mix(previousState.xy, detectedCenter, 0.25),
          wasActive
        );
        let size = select(
          detectedSize,
          mix(previousState.z, detectedSize, 0.5),
          wasActive
        );
        let confidence = clamp(
          max(previousState.w * 0.75, strongestMotion * 2.0),
          0.0,
          1.0
        );

        nextState = vec4f(center, size, confidence);
      } else if (wasActive) {
        let confidence = previousState.w * 0.9;

        if (confidence > 0.03) {
          nextState = vec4f(previousState.xyz, confidence);
        }
      }

      blobStateBuffer[index] = nextState;
    }
  `);

export function createBlobBuffer(maxBlobs) {
  return storage(
    new THREE.StorageInstancedBufferAttribute(
      new Float32Array(maxBlobs * 4),
      4
    ),
    'vec4',
    maxBlobs
  );
}

// Node i tracks against the state texture node i of the detection pair wrote.
export function createBlobNodes(maxBlobs, resources) {
  const computeBlobs = blobKernel(maxBlobs);
  const node = (stateIndex) =>
    computeBlobs({
      stateTexture: texture(resources.stateTextures[stateIndex]),
      blobStateBuffer: resources.blobBuffer,
      index: instanceIndex,
    }).compute(maxBlobs, [1]);

  return [node(1), node(0)];
}
