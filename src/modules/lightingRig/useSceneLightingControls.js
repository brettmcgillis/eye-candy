import { useCallback, useMemo } from 'react';

import buildSceneLightingControls from './buildSceneLightingControls';
import {
  buildSceneLightingRuntimeConfig,
  normalizeSceneLightingDeclaration,
} from './sceneLightingUtils';

export default function useSceneLightingControls(options = {}) {
  const normalizedLighting = useMemo(() => {
    return normalizeSceneLightingDeclaration(options.lighting);
  }, [options.lighting]);

  const lightingControls = useMemo(() => {
    return buildSceneLightingControls({
      ...options,
      lighting: options.lighting,
    });
  }, [
    options.controlOverrides,
    options.controlsSnapshotRef,
    options.lighting,
    options.lightingFolderPath,
  ]);

  const buildLighting = useCallback(
    (controls = {}) => {
      return buildSceneLightingRuntimeConfig({
        controls,
        lighting: options.lighting,
      });
    },
    [options.lighting]
  );

  return {
    buildLighting,
    lightingControls,
    normalizedLighting,
  };
}
