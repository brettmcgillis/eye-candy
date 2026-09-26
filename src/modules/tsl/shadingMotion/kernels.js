import { instanceIndex, storageTexture, texture, wgslFn } from 'three/tsl';

// The article's WGSL, kept verbatim apart from the input: these read a scene
// render target 1:1 instead of a cover-fitted, y-flipped video frame.
const SCENE_SAMPLE = /* wgsl */ `
      let coord = vec2u(index % dimensions.x, index / dimensions.x);
      let sceneDimensions = textureDimensions(sceneTexture);
      let sceneUv = (vec2f(coord) + vec2f(0.5)) / vec2f(dimensions);
      let sceneCoord = clamp(
        vec2i(sceneUv * vec2f(sceneDimensions)),
        vec2i(0),
        vec2i(sceneDimensions) - vec2i(1)
      );
      let sceneColor = textureLoad(sceneTexture, sceneCoord, 0).rgb;
      let currentLuminance = dot(sceneColor, vec3f(0.299, 0.587, 0.114));
      let previousState = textureLoad(stateReadTexture, vec2i(coord), 0);
      let difference = abs(currentLuminance - previousState.r);`;

const SIGNATURE = (name) => /* wgsl */ `
    fn ${name}(
      sceneTexture: texture_2d<f32>,
      stateReadTexture: texture_2d<f32>,
      stateWriteTexture: texture_storage_2d<rgba8unorm, write>,
      hasPreviousFrame: bool,
      motionThreshold: f32,
      trailDecay: f32,
      index: u32
    ) -> void {
      let dimensions = textureDimensions(stateWriteTexture);
      let pixelCount = dimensions.x * dimensions.y;

      if (index >= pixelCount) {
        return;
      }
${SCENE_SAMPLE}`;

// R: luminance, G: persistent motion mask.
const computeMotionMask = wgslFn(`${SIGNATURE('computeMotionMask')}
      var motionAmount = 0.0;

      if (hasPreviousFrame) {
        let thresholdedMotion = smoothstep(
          motionThreshold,
          motionThreshold * 4.0,
          difference
        );

        motionAmount = pow(thresholdedMotion, 0.5);
      }

      let decayedTrail = max(previousState.g * trailDecay - 0.025, 0.0);
      let motionTrail = max(decayedTrail, motionAmount);

      textureStore(
        stateWriteTexture,
        vec2i(coord),
        vec4f(currentLuminance, motionTrail, 0.0, 1.0)
      );
    }
`);

// R: luminance, G: current motion, A: motion trail.
const computeBlobMotion = wgslFn(`${SIGNATURE('computeBlobMotion')}
      var motion = 0.0;

      if (hasPreviousFrame) {
        motion = smoothstep(
          motionThreshold,
          motionThreshold * 20.0,
          difference
        ) * 20.0;
      }

      let trail = max(previousState.a * trailDecay, motion);

      textureStore(
        stateWriteTexture,
        vec2i(coord),
        vec4f(currentLuminance, motion, 0.0, trail)
      );
    }
`);

const neighbor = (name, offset) => /* wgsl */ `
      let ${name}Coord = clamp(
        vec2i(coord) ${offset},
        vec2i(0),
        vec2i(dimensions) - vec2i(1)
      );
      let ${name}Match = abs(
        currentLuminance - textureLoad(stateReadTexture, ${name}Coord, 0).r
      );`;

// R: luminance, GB: flow direction encoded to [0, 1], A: motion trail. The
// direction compares this pixel against its neighbors in the previous frame.
const computeFlow = wgslFn(`${SIGNATURE('computeFlow')}
      var motion = 0.0;

      if (hasPreviousFrame) {
        motion = smoothstep(
          motionThreshold,
          motionThreshold * 10.0,
          difference
        ) * 10.0;
      }
${neighbor('left', '- vec2i(1, 0)')}
${neighbor('right', '+ vec2i(1, 0)')}
${neighbor('up', '- vec2i(0, 1)')}
${neighbor('down', '+ vec2i(0, 1)')}
      let rawFlow = vec2f(
        rightMatch - leftMatch,
        downMatch - upMatch
      );
      let flowLength = length(rawFlow);
      var flowDirection = vec2f(0.0);

      if (flowLength > 0.001 && motion > 0.0) {
        flowDirection = rawFlow / flowLength;
      }

      let previousFlow = previousState.gb * 2.0 - 1.0;
      let trailFlow = mix(
        previousFlow * trailDecay,
        flowDirection,
        clamp(motion, 0.0, 1.0)
      );
      let encodedTrailFlow = trailFlow * 0.5 + 0.5;
      let trailAlpha = max(previousState.a * trailDecay, motion);

      textureStore(
        stateWriteTexture,
        vec2i(coord),
        vec4f(currentLuminance, encodedTrailFlow, trailAlpha)
      );
    }
`);

export const DETECTORS = {
  mask: computeMotionMask,
  blobs: computeBlobMotion,
  flow: computeFlow,
};

// Two nodes so each frame reads the state the previous frame wrote (A→B, then
// B→A) without a read_write storage texture, which Safari lacks.
export function createDetectionNodes(detector, resources, uniforms) {
  const { width, height, stateTextures, sceneTarget } = resources;
  const node = (readIndex, writeIndex) =>
    DETECTORS[detector]({
      sceneTexture: texture(sceneTarget.texture),
      stateReadTexture: texture(stateTextures[readIndex]),
      stateWriteTexture: storageTexture(
        stateTextures[writeIndex]
      ).toWriteOnly(),
      hasPreviousFrame: uniforms.hasPreviousFrame,
      motionThreshold: uniforms.motionThreshold,
      trailDecay: uniforms.trailDecay,
      index: instanceIndex,
    }).compute(width * height, [8]);

  return [node(0, 1), node(1, 0)];
}
