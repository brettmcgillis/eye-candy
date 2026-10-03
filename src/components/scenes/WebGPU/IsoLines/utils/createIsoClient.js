import { configFrom } from '@modules/isoLines';

// A source with no image weight set drives the field alone, as on the CLI.
const IMAGE_ALONE = {
  weightFocal: 0,
  weightImage: 1,
  weightNoise: 0,
  weightShape: 0,
};

export default function createIsoClient() {
  const worker = new Worker(new URL('./iso.worker.js', import.meta.url), {
    type: 'module',
  });
  const waiting = new Map();
  let id = 0;
  let sentImage;

  worker.onmessage = ({ data }) => {
    waiting.get(data.id)?.(data.build);
    waiting.delete(data.id);
  };

  return {
    build: (config, { aspect, image = null, time }) =>
      new Promise((resolve) => {
        id += 1;
        waiting.set(id, resolve);
        const flat = configFrom(config);
        const message = {
          aspect,
          config:
            image && !flat.weightImage ? { ...flat, ...IMAGE_ALONE } : flat,
          id,
          time,
        };
        if (image !== sentImage) {
          sentImage = image;
          message.image = image;
        }
        worker.postMessage(message);
      }),
    dispose: () => worker.terminate(),
  };
}
