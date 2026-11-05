export const RIG_KEYS = [
  'seed',
  'rigCount',
  'rigSpread',
  'rigDistanceMin',
  'rigDistanceMax',
  'rigHeightMin',
  'rigHeightMax',
  'rigScale',
];

export const CABLE_KEYS = [
  ...RIG_KEYS,
  'frontPortShare',
  'extraCables',
  'cableDropStep',
  'cableWander',
  'cableCoils',
  'cableSlack',
  'settleIterations',
  'settleTicks',
];

export const cableSettings = (config) =>
  Object.fromEntries(CABLE_KEYS.map((key) => [key, config[key]]));

export const cableKey = (config) =>
  CABLE_KEYS.map((key) => config[key]).join('|');

const cache = new Map();
const CACHE_LIMIT = 6;

export function settleCables(settings, key) {
  if (cache.has(key)) return { promise: cache.get(key), cancel: () => {} };
  const worker = new Worker(new URL('./cables.worker.js', import.meta.url), {
    type: 'module',
  });
  let reject;
  let done = false;
  const promise = new Promise((resolve, fail) => {
    reject = fail;
    worker.onmessage = ({ data }) => {
      done = true;
      worker.terminate();
      resolve(data);
    };
    worker.onerror = (error) => {
      worker.terminate();
      cache.delete(key);
      fail(error);
    };
    worker.postMessage(settings);
  });
  cache.set(key, promise);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
  return {
    promise,
    cancel: () => {
      if (done) return;
      worker.terminate();
      cache.delete(key);
      reject(new Error('cancelled'));
    },
  };
}
