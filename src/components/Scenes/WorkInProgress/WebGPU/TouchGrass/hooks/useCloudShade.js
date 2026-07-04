import { useEffect, useMemo } from 'react';

import { createCloudShade, createCloudUniforms } from '../utils/clouds';

// Builds the shared cloud-shadow TSL function once and keeps its uniforms in
// sync with Leva. The returned Fn identity is stable, so materials that bake
// it in never rebuild on cloud tweaks.
export default function useCloudShade({
  cloudCoverage,
  cloudFloor,
  cloudScale,
  cloudSpeed,
  globalMotionSpeed,
}) {
  const uniforms = useMemo(() => createCloudUniforms(), []);

  useEffect(() => {
    uniforms.coverage.value = cloudCoverage;
  }, [cloudCoverage, uniforms]);
  useEffect(() => {
    uniforms.floorLevel.value = cloudFloor;
  }, [cloudFloor, uniforms]);
  useEffect(() => {
    uniforms.scale.value = cloudScale;
  }, [cloudScale, uniforms]);
  useEffect(() => {
    uniforms.speed.value = cloudSpeed * (globalMotionSpeed ?? 1);
  }, [cloudSpeed, globalMotionSpeed, uniforms]);

  return useMemo(() => createCloudShade(uniforms), [uniforms]);
}
