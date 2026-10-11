import React, { memo, useEffect, useMemo } from 'react';

import buildLunarTerrain from '../../utils/lunarTerrain';
import { createRegolithMaterial } from '../../utils/materials';

function LunarSurfaceLocation({ config }) {
  const {
    lunarCraterCount,
    lunarCurvature,
    lunarDarkColor,
    lunarGrain,
    lunarLightColor,
    lunarMaxCrater,
    lunarRoughness,
    lunarSeed,
  } = config;

  const geometry = useMemo(
    () =>
      buildLunarTerrain({
        clearRadius: 4,
        craterCount: lunarCraterCount,
        curvatureRadius: lunarCurvature,
        maxCraterRadius: lunarMaxCrater,
        roughness: lunarRoughness,
        seed: lunarSeed,
        segments: 384,
        size: 420,
      }),
    [
      lunarCraterCount,
      lunarCurvature,
      lunarMaxCrater,
      lunarRoughness,
      lunarSeed,
    ]
  );
  const { material, uniforms } = useMemo(() => createRegolithMaterial(), []);

  useEffect(() => {
    uniforms.dark.value.set(lunarDarkColor);
    uniforms.light.value.set(lunarLightColor);
    uniforms.grain.value = lunarGrain;
  }, [lunarDarkColor, lunarGrain, lunarLightColor, uniforms]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return <mesh geometry={geometry} material={material} receiveShadow />;
}

export default memo(LunarSurfaceLocation);
