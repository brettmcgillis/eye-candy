import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import createBladeMaterial from '../utils/bladeMaterial';
import createGrassField from '../utils/grassGeometry';
import { toHeightConfig } from '../utils/heightField';
import { GRASS_MAX_BLADES, MAX_GRASS_DISTURBERS } from '../utils/sceneLayout';

function GrassField({ terrain, grass, disturbersRef }) {
  const paramsRef = useRef(grass);
  paramsRef.current = grass;

  const heightCfg = useMemo(() => toHeightConfig(terrain), [terrain]);
  const maskCfg = useMemo(
    () => ({
      maskScale: grass.grassMaskScale,
      maskEdge: grass.grassMaskEdge,
      coverage: grass.grassCoverage,
      maskSeedX: 3.7,
      maskSeedY: 9.1,
    }),
    [grass.grassMaskScale, grass.grassMaskEdge, grass.grassCoverage]
  );

  const { geometry, material, uniforms } = useMemo(() => {
    const maxCount = Math.max(
      256,
      Math.floor(GRASS_MAX_BLADES * grass.grassDensity)
    );
    const field = createGrassField(maxCount, heightCfg, maskCfg);
    const blade = createBladeMaterial({
      offsetAttribute: field.geometry.getAttribute('instanceOffset'),
      dataAttribute: field.geometry.getAttribute('instanceData'),
    });
    return {
      geometry: field.geometry,
      material: blade.material,
      uniforms: blade.uniforms,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heightCfg, maskCfg, grass.grassDensity]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useEffect(() => {
    uniforms.bladeHeight.value = grass.bladeHeight;
    uniforms.bladeWidth.value = grass.bladeWidth;
    uniforms.bladeBend.value = grass.bladeBend;
    uniforms.windAngle.value = grass.windAngle;
    uniforms.windStrength.value = grass.windStrength;
    uniforms.windSpeed.value = grass.windSpeed;
    uniforms.windScale.value = grass.windScale;
    uniforms.translucency.value = grass.grassTranslucency;
    uniforms.rootColor.value.set(grass.grassRootColor);
    uniforms.tipColor.value.set(grass.grassTipColor);
  }, [grass, uniforms]);

  useFrame(() => {
    const list = disturbersRef?.current ?? [];
    const count = Math.min(list.length, MAX_GRASS_DISTURBERS);
    const { disturbRadius, disturbStrength } = paramsRef.current;
    const { array } = uniforms.disturbers;
    for (let i = 0; i < count; i += 1) {
      array[i].set(list[i].x, list[i].z, disturbRadius, disturbStrength);
    }
    uniforms.disturbCount.value = count;
  });

  if (!grass.grassEnabled) {
    return null;
  }

  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
      receiveShadow
    />
  );
}

export default memo(GrassField);
