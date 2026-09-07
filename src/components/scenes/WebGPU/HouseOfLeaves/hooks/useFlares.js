import { useEffect, useMemo } from 'react';

import createFlareRegistry from '../utils/flares';

export default function useFlares() {
  const flares = useMemo(() => createFlareRegistry(), []);
  useEffect(() => () => flares.dispose(), [flares]);
  return flares;
}
