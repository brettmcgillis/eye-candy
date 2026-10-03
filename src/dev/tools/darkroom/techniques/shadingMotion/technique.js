import {
  SHADING_MOTION_MODES,
  createShadingMotion,
  shadingMotionDefaults,
  updateShadingMotionUniforms,
} from '@modules/tsl';

import createPost from '../shared/createPost';
import { FITS } from '../shared/createSourcePlane';
import { choice, color, flag, num } from '../shared/specs';

const OPTIONS = {
  fit: choice('Fit', FITS, 'cover'),
  mode: choice('Mode', SHADING_MOTION_MODES, 'heatmap'),
  detectionScale: num('Detection scale', 0.25, 0.1, 1, 0.05),
  maxBlobs: num('Max blobs', 9, 1, 32, 1),
  fill: choice('Blob fill', ['none', 'thermal', 'dither'], 'none'),
  segments: flag('Blob segments', false),
  motionThreshold: num('Motion threshold', 0.02, 0, 0.5, 0.005),
  trailDecay: num('Trail decay', 0.98, 0, 0.999, 0.001),
  accentColor: color('Accent', '#ff5999'),
  lineColor: color('Lines', '#ffffff'),
  asciiRows: num('ASCII rows', 64, 8, 256, 1),
  pixelSize: num('Pixel size', 8, 1, 64, 1),
  arrowRows: num('Arrow rows', 32, 4, 128, 1),
  ditherRows: num('Dither rows', 400, 32, 1200, 1),
  boxScale: num('Box scale', 0.5, 0.1, 2, 0.01),
  segmentCurve: num('Segment curve', 0, 0, 1, 0.01),
  fillOutside: flag('Fill outside', false),
};

const BAKED = ['mode', 'detectionScale', 'maxBlobs', 'fill', 'segments'];

export default {
  description:
    'Motion detection between frames — heatmaps, masks, ASCII, tracked blobs, optical-flow arrows. Needs moving pictures.',
  engine: 'webgpu',
  id: 'shadingMotion',
  inputs: ['video', 'live'],
  label: 'Shading Motion',
  options: OPTIONS,
  order: 60,
  sections: [
    { keys: ['fit', ...BAKED], title: 'Detector' },
    {
      keys: Object.keys(OPTIONS).filter(
        (key) => key !== 'fit' && !BAKED.includes(key)
      ),
      title: 'Look',
    },
  ],

  // Each mode (and blob fill) starts from the detector defaults it shipped
  // with.
  derive(values, changed) {
    if (changed && !['mode', 'fill'].includes(changed)) return values;
    const defaults = shadingMotionDefaults(values.mode, values.fill);
    return Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        key in defaults ? defaults[key] : value,
      ])
    );
  },

  create(stage) {
    return createPost(stage, {
      baked: BAKED,
      build({ options, plane, size }) {
        const effect = createShadingMotion({ ...options, ...size });
        return {
          colorNode: effect.colorNode,
          dispose: () => effect.dispose(),
          prepare: (renderer) =>
            effect.update(renderer, plane.scene, plane.camera),
          update: (values) =>
            updateShadingMotionUniforms(effect.uniforms, values),
        };
      },
    });
  },
};
