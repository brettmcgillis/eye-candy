import { useEffect, useMemo } from 'react';

import {
  buildSurfaceShell,
  createGrayScott3dField,
} from '@modules/reactionDiffusion';

import useSkullGraph from './useSkullGraph';

const SHELL_BAND = 2;

// The skull's surface graph and a Gray-Scott field running on a thin shell
// around it.
export default function useSkullField(config) {
  const surface = useSkullGraph(config);

  const shell = useMemo(
    () =>
      buildSurfaceShell({
        band: SHELL_BAND,
        padding: 8,
        positions: surface.graph.positions,
        resolution: config.fieldResolution,
        values: surface.reach,
      }),
    [config.fieldResolution, surface]
  );

  const field = useMemo(
    () => createGrayScott3dField({ dims: shell.dims, voxels: shell.shell }),
    [shell]
  );
  useEffect(() => () => field.dispose(), [field]);

  const range = useMemo(() => {
    let maxReach = 0;
    surface.reach.forEach((r) => {
      if (Number.isFinite(r)) maxReach = Math.max(maxReach, r);
    });
    return { maxReach, minReach: 0 };
  }, [surface]);

  return { field, range, shell, surface };
}
