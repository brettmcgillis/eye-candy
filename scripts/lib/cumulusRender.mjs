import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/cumulus/renderOptions.mjs';
import createBrowser from './cumulusBrowser.mjs';
import { createParseCli, loadKernelModules } from './generatorCli.mjs';

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});
export const loadKernel = () =>
  loadKernelModules({ thoughts: '/src/modules/cumulus/index.js' });
export async function withCapturer(kernel, options, work) {
  const capturer = await createBrowser(options);
  try {
    return await work(capturer);
  } finally {
    await capturer.dispose();
  }
}
