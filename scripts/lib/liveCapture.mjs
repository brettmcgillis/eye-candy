// The Live-tab capture finish now lives in runStills (generatorCli.mjs);
// re-exported for the CLIs that still call it themselves.
export { finishCapture, readCapture } from './generatorCli.mjs';
