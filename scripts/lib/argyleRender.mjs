import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/argyle/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});
export const loadKernel = () =>
  loadKernelModules({
    kernel: '/src/modules/argyle/index.js',
    look: '/src/modules/argyleRender/index.js',
  });
export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    async () => {
      const headless = await createHeadlessRenderer({
        width: options.width * options.pixelRatio,
        height: options.height * options.pixelRatio,
      });
      const stage = kernel.look.createStage({
        ...options,
        width: options.width * options.pixelRatio,
        height: options.height * options.pixelRatio,
        renderer: headless.renderer,
        readFrame: headless.readFrame,
      });
      return {
        ...stage,
        dispose() {
          stage.dispose();
          headless.dispose();
        },
      };
    },
    work
  );
