import { configFrom } from '@modules/networkTest';

export default function createNetworkClient() {
  const worker = new Worker(new URL('./network.worker.js', import.meta.url), {
    type: 'module',
  });
  const waiting = new Map();
  let id = 0;

  worker.onmessage = ({ data }) => {
    waiting.get(data.id)?.(data.result);
    waiting.delete(data.id);
  };

  const call = (type, payload) =>
    new Promise((resolve) => {
      id += 1;
      waiting.set(id, resolve);
      worker.postMessage({ id, type, ...payload });
    });

  return {
    // A source with no share set is drawn alone, as on the CLI.
    build: (config, image = null) =>
      call('build', {
        config: {
          ...configFrom(config),
          imageShare: image && !config.imageShare ? 1 : config.imageShare,
        },
        image,
      }),
    wire: ({ chain, count, group }, positions, config) =>
      call('wire', {
        config: configFrom(config),
        points: { chain, count, group, positions: positions.slice() },
      }),
    dispose: () => worker.terminate(),
  };
}
