/* eslint-disable import/no-extraneous-dependencies */
import loadModules from './loadModules.mjs';

const STAGE = '/src/modules/rorschachRender/index.js';

export default async function createCapturer({ height, samples = 4, width }) {
  const { createHeadlessRenderer } = await import('./headlessWebgpu.mjs');
  const headless = await createHeadlessRenderer({ height, width });
  const { createRorschachStage } = (await loadModules([STAGE]))[STAGE];
  const stage = createRorschachStage({
    height,
    readFrame: headless.readFrame,
    renderer: headless.renderer,
    samples,
    width,
  });
  return {
    ...stage,
    dispose() {
      stage.dispose();
      headless.dispose();
    },
  };
}
