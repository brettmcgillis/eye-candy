import { createIsoBuilder } from '@modules/isoLines';

const builder = createIsoBuilder();
let image = null;

const buffersOf = (build) => [
  build.values.buffer,
  ...(build.colors ? [build.colors.buffer] : []),
];

// The field takes a few milliseconds a frame, so the scene builds here and
// keeps drawing the last build until the next one lands. A source image
// only travels when it changes.
globalThis.onmessage = ({ data }) => {
  if ('image' in data) ({ image } = data);
  const build = builder.build(data.config, {
    aspect: data.aspect,
    image,
    time: data.time,
  });
  globalThis.postMessage({ build, id: data.id }, buffersOf(build));
};
