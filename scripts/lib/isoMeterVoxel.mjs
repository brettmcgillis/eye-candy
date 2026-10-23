import { loadKernelModules, withRenderer } from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';

// Barrels only — see docs/iso-meter-pipeline.md.
const ENTRIES = { render: '/src/modules/isoMeterRender/index.js' };

// The scene's voxel view, headless: isoMeterRender's voxel stage on the
// headless renderer.
export async function createVoxelCapturer(kernel, options) {
  const { render } = await loadKernelModules(ENTRIES);
  const headless = await createHeadlessRenderer({
    height: Math.round(options.height * options.pixelRatio),
    width: Math.round(options.width * options.pixelRatio),
  });
  const stage = render.createVoxelStage({
    height: options.height,
    pixelRatio: options.pixelRatio,
    readFrame: headless.readFrame,
    renderer: headless.renderer,
    samples: options.samples,
    transparent: options.transparent,
    width: options.width,
  });
  return {
    capture: (args) => stage.capture(stage.frameOf(args)),
    dispose() {
      stage.dispose();
      headless.dispose();
    },
    get loaded() {
      return stage.loaded;
    },
    load: (...args) => stage.load(...args),
  };
}

export const withVoxelCapturer = (kernel, options, work) =>
  withRenderer(options, () => createVoxelCapturer(kernel, options), work);
