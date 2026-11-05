import { use, useEffect, useRef, useState } from 'react';

import { cableKey, cableSettings, settleCables } from '../utils/cableClient';

const REBUILD_DELAY_MS = 250;

export default function useCables(config) {
  const key = cableKey(config);
  const configRef = useRef(config);
  configRef.current = config;
  const firstRef = useRef(null);
  if (!firstRef.current)
    firstRef.current = settleCables(cableSettings(config), key).promise;
  const initial = use(firstRef.current);
  const [latest, setLatest] = useState(null);
  const firstKey = useRef(key).current;

  useEffect(() => {
    if (key === firstKey && !latest) return undefined;
    let job = null;
    const timer = setTimeout(() => {
      job = settleCables(cableSettings(configRef.current), key);
      job.promise.then((cables) => setLatest(cables)).catch(() => {});
    }, REBUILD_DELAY_MS);
    return () => {
      clearTimeout(timer);
      job?.cancel();
    };
  }, [key]);

  return latest ?? initial;
}
