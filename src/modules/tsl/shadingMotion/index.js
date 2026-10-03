/* eslint-disable no-param-reassign */
import { texture, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import buildBlobOutput from './blobOutputs';
import { createBlobBuffer, createBlobNodes } from './blobTracker';
import buildFlowOutput from './flowOutput';
import { createDetectionNodes } from './kernels';
import { buildMaskOutput } from './maskOutputs';

export {
  createVelocityMaterial,
  createVelocityTarget,
  motionBlurNode,
  velocityMapNode,
} from './motionBlur';

export const SHADING_MOTION_MODES = [
  'mask',
  'heatmap',
  'ditheredMask',
  'ascii',
  'blobs',
  'flow',
];

const DETECTOR = {
  mask: 'mask',
  heatmap: 'mask',
  ditheredMask: 'mask',
  ascii: 'mask',
  blobs: 'blobs',
  flow: 'flow',
};

const DETECTOR_DEFAULTS = {
  mask: { motionThreshold: 0.02, trailDecay: 0.98, detectionScale: 0.25 },
  blobs: { motionThreshold: 0.02, trailDecay: 0.82, detectionScale: 0.5 },
  flow: { motionThreshold: 0.01, trailDecay: 0.94, detectionScale: 0.5 },
};

const MODE_DEFAULTS = {
  ditheredMask: { accentColor: '#2282ef' },
  flow: { accentColor: '#2282ee' },
};

const BASE_DEFAULTS = {
  accentColor: '#ff5999',
  lineColor: '#ffffff',
  asciiRows: 64,
  pixelSize: 8,
  arrowRows: 32,
  ditherRows: 400,
  boxScale: 0.5,
  segmentCurve: 0,
  fillOutside: false,
};

const SCALARS = [
  'motionThreshold',
  'trailDecay',
  'asciiRows',
  'pixelSize',
  'arrowRows',
  'ditherRows',
  'boxScale',
  'segmentCurve',
];
const COLORS = ['accentColor', 'lineColor'];

function resolveOptions(mode, fill, options) {
  const merged = {
    ...BASE_DEFAULTS,
    ...DETECTOR_DEFAULTS[DETECTOR[mode]],
    ...MODE_DEFAULTS[mode],
  };
  if (fill !== 'none') merged.boxScale = 0.75;
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) merged[key] = value;
  });
  return merged;
}

export const shadingMotionDefaults = (mode, fill = 'none') =>
  resolveOptions(mode, fill, {});

function createUniforms(values) {
  const uniforms = Object.fromEntries(
    SCALARS.map((key) => [key, uniform(values[key])])
  );
  COLORS.forEach((key) => {
    uniforms[key] = uniform(new THREE.Color(values[key]));
  });
  uniforms.fillOutside = uniform(values.fillOutside ? 1 : 0);
  uniforms.hasPreviousFrame = uniform(false);
  return uniforms;
}

export function updateShadingMotionUniforms(uniforms, values) {
  SCALARS.forEach((key) => {
    if (values[key] !== undefined) uniforms[key].value = values[key];
  });
  COLORS.forEach((key) => {
    if (values[key] !== undefined) uniforms[key].value.set(values[key]);
  });
  if (values.fillOutside !== undefined)
    uniforms.fillOutside.value = values.fillOutside ? 1 : 0;
}

function makeStateTexture(width, height) {
  const stateTexture = new THREE.StorageTexture(width, height);
  stateTexture.minFilter = THREE.NearestFilter;
  stateTexture.magFilter = THREE.NearestFilter;
  return stateTexture;
}

// `detectionScale`, `maxBlobs`, `fill`, `segments` and size are baked in.
export function createShadingMotion({
  mode: requestedMode,
  width,
  height,
  maxBlobs = 9,
  fill = 'none',
  segments = false,
  ...options
}) {
  const mode = SHADING_MOTION_MODES.includes(requestedMode)
    ? requestedMode
    : 'heatmap';
  const detector = DETECTOR[mode];
  const values = resolveOptions(mode, fill, options);
  const uniforms = createUniforms(values);

  const detectionWidth = Math.max(1, Math.floor(width * values.detectionScale));
  const detectionHeight = Math.max(
    1,
    Math.floor(height * values.detectionScale)
  );
  const resources = {
    width: detectionWidth,
    height: detectionHeight,
    sceneTarget: new THREE.RenderTarget(width, height, {
      type: THREE.HalfFloatType,
      depthBuffer: true,
    }),
    stateTextures: [
      makeStateTexture(detectionWidth, detectionHeight),
      makeStateTexture(detectionWidth, detectionHeight),
    ],
    blobBuffer: detector === 'blobs' ? createBlobBuffer(maxBlobs) : null,
  };

  const detectionNodes = createDetectionNodes(detector, resources, uniforms);
  const blobNodes = resources.blobBuffer
    ? createBlobNodes(maxBlobs, resources)
    : null;

  const state = texture(resources.stateTextures[1]);
  const scene = texture(resources.sceneTarget.texture);
  const context = { state, scene, u: uniforms };

  let colorNode;
  if (detector === 'flow') colorNode = buildFlowOutput(context);
  else if (detector === 'blobs')
    colorNode = buildBlobOutput({
      ...context,
      blobBuffer: resources.blobBuffer,
      maxBlobs,
      fill,
      segments,
    });
  else colorNode = buildMaskOutput(mode, context);

  let writeIndex = 1;
  let hasPreviousFrame = false;

  return {
    colorNode,
    uniforms,
    blobBuffer: resources.blobBuffer,
    update(renderer, sceneToRender, camera) {
      const restoreTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(resources.sceneTarget);
      renderer.clear();
      renderer.render(sceneToRender, camera);
      renderer.setRenderTarget(restoreTarget);

      const computeIndex = 1 - writeIndex;
      uniforms.hasPreviousFrame.value = hasPreviousFrame;
      renderer.compute(detectionNodes[computeIndex]);
      if (blobNodes) renderer.compute(blobNodes[computeIndex]);
      state.value = resources.stateTextures[writeIndex];

      hasPreviousFrame = true;
      writeIndex = computeIndex;
    },
    dispose() {
      resources.sceneTarget.dispose();
      resources.stateTextures.forEach((stateTexture) => stateTexture.dispose());
    },
  };
}
