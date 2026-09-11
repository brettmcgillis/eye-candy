import { useEffect, useMemo } from 'react';

import {
  createErosionField,
  createFieldUniforms,
  createShadingUniforms,
} from '@modules/terrainErosion';

export default function useErosionField(resolution) {
  const uniforms = useMemo(
    () => ({ ...createFieldUniforms(), ...createShadingUniforms() }),
    []
  );

  const field = useMemo(
    () => createErosionField({ resolution, uniforms }),
    [resolution, uniforms]
  );

  useEffect(() => () => field.dispose(), [field]);

  return { field, uniforms };
}
