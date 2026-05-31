import { cameraPosition, normalize, positionWorld, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import { createNebulaField, createStarField } from '../utils/blackHoleShader';

/**
 * Full-screen star / nebula background for space mode. Renders as a large
 * inside-out sphere so the star field covers the entire background, including
 * the area outside the BlackHoleVolume bounding sphere. BlackHoleVolume itself
 * renders lensed stars inside its sphere (backgroundOpacity=1), so the two
 * fields create a seamless transition: bent stars near the hole, regular stars
 * farther out.
 */
const StarSkybox = memo(function StarSkybox({ config }) {
  const geometry = useMemo(() => new THREE.SphereGeometry(900, 32, 16), []);

  const uniforms = useMemo(
    () => ({
      starsEnabled: uniform(config.starsEnabled ? 1 : 0),
      starDensity: uniform(config.starDensity ?? 0.1),
      starSize: uniform(config.starSize ?? 1.2),
      starBrightness: uniform(config.starBrightness ?? 0.1),
      nebulaEnabled: uniform(config.nebulaEnabled ? 1 : 0),
      nebula1Scale: uniform(config.nebula1Scale ?? 2),
      nebula1Density: uniform(config.nebula1Density ?? 0.5),
      nebula1Brightness: uniform(config.nebula1Brightness ?? 0.01),
      nebula1Color: uniform(
        new THREE.Color(config.nebula1Color ?? '#071f44')
      ),
      nebula2Scale: uniform(config.nebula2Scale ?? 5.5),
      nebula2Density: uniform(config.nebula2Density ?? 0.05),
      nebula2Brightness: uniform(config.nebula2Brightness ?? 0.21),
      nebula2Color: uniform(
        new THREE.Color(config.nebula2Color ?? '#010615')
      ),
      starBackgroundColor: uniform(
        new THREE.Color(config.starBackgroundColor ?? '#000000')
      ),
    }),
    []
  );

  const material = useMemo(() => {
    const mat = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
    // Direction from camera to this point on the sky sphere — correct for star
    // field sampling regardless of where the camera is in world space.
    const dir = normalize(positionWorld.sub(cameraPosition));
    const starField = createStarField(uniforms);
    const nebulaField = createNebulaField(uniforms);
    mat.colorNode = uniforms.starBackgroundColor
      .add(starField(dir))
      .add(nebulaField(dir));
    return mat;
  }, [uniforms]);

  useEffect(() => {
    const u = uniforms;
    u.starsEnabled.value = config.starsEnabled ? 1 : 0;
    u.starDensity.value = config.starDensity ?? 0.1;
    u.starSize.value = config.starSize ?? 1.2;
    u.starBrightness.value = config.starBrightness ?? 0.1;
    u.nebulaEnabled.value = config.nebulaEnabled ? 1 : 0;
    u.nebula1Scale.value = config.nebula1Scale ?? 2;
    u.nebula1Density.value = config.nebula1Density ?? 0.5;
    u.nebula1Brightness.value = config.nebula1Brightness ?? 0.01;
    u.nebula1Color.value.set(config.nebula1Color ?? '#071f44');
    u.nebula2Scale.value = config.nebula2Scale ?? 5.5;
    u.nebula2Density.value = config.nebula2Density ?? 0.05;
    u.nebula2Brightness.value = config.nebula2Brightness ?? 0.21;
    u.nebula2Color.value.set(config.nebula2Color ?? '#010615');
    u.starBackgroundColor.value.set(config.starBackgroundColor ?? '#000000');
  }, [config, uniforms]);

  useEffect(() => {
    return () => {
      material.dispose();
      geometry.dispose();
    };
  }, [geometry, material]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-2000}
    />
  );
});

export default StarSkybox;
