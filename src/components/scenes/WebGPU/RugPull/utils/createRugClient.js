import { WEAVE_KEYS, configFrom } from '@modules/rugPull';

export const weaveKey = (config) =>
  WEAVE_KEYS.map((key) => config[key]).join('|');

// One weave in flight; newer requests coalesce into the next one rather
// than queueing behind it.
export default function createRugClient(onBuild) {
  const worker = new Worker(new URL('./rug.worker.js', import.meta.url), {
    type: 'module',
  });
  let busy = false;
  let pending = null;
  let id = 0;

  function send(config) {
    busy = true;
    id += 1;
    worker.postMessage({ config: configFrom(config), id });
  }

  worker.onmessage = ({ data }) => {
    busy = false;
    onBuild(data.build);
    if (pending) {
      const next = pending;
      pending = null;
      send(next);
    }
  };

  return {
    request(config) {
      if (busy) pending = config;
      else send(config);
    },
    dispose: () => worker.terminate(),
  };
}
