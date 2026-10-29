import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/paperCuts/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import { withResolvedDesign } from './paperCutsDesigns.mjs';
import { installGltfLoader, installTextureLoader } from './r3fHeadless.mjs';

export async function loadKernel() {
  const { THREE } = await loadThree();
  installTextureLoader(THREE);
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  installGltfLoader(GLTFLoader);
  return loadKernelModules({
    paper: '/src/modules/paperCuts/index.js',
    look: '/src/modules/paperCutsRender/index.js',
  });
}
export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});
export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    async () => {
      const headless = await createHeadlessRenderer({
        width: options.width * options.pixelRatio,
        height: options.height * options.pixelRatio,
      });
      const stage = await kernel.look.createPaperStage({
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

export const rollArgs = (kernel, args) =>
  withResolvedDesign(kernel.paper, kernel.look.rollArgs(args));
