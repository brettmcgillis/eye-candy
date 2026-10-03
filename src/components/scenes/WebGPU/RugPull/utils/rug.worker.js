import { buildRug } from '@modules/rugPull';

// A fine weave takes up to a couple of hundred milliseconds, so the scene
// weaves here and keeps showing the last rug until the next one lands.
globalThis.onmessage = ({ data }) => {
  const build = buildRug(data.config);
  globalThis.postMessage({ build, id: data.id }, [
    build.rgba.buffer,
    build.roles.buffer,
  ]);
};
