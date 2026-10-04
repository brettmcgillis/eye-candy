import { configFrom } from '@modules/trucheterie3d';

// Latest wins: while a build runs, newer requests replace each other and only
// the last one is built next, so dragging a slider never queues a backlog.
export default function createTubeClient(onBuilt) {
  const worker = new Worker(new URL('./tubes.worker.js', import.meta.url), {
    type: 'module',
  });
  let id = 0;
  let busy = false;
  let pending = null;

  const send = (config) => {
    busy = true;
    id += 1;
    worker.postMessage({ config: configFrom(config), id });
  };

  worker.onerror = (event) => {
    busy = false;
    // eslint-disable-next-line no-console
    console.error('Trucheterie3D tube worker failed to load', event.message);
  };

  worker.onmessage = ({ data }) => {
    busy = false;
    if (data.error) {
      // eslint-disable-next-line no-console
      console.error('Trucheterie3D tube build failed', data.error);
    }
    if (pending) {
      const next = pending;
      pending = null;
      send(next);
      return;
    }
    if (!data.error) onBuilt(data);
  };

  return {
    build(config) {
      if (busy) pending = config;
      else send(config);
    },
    dispose: () => worker.terminate(),
  };
}
