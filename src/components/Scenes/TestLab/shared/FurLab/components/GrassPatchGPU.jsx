import {
  clamp,
  float,
  length,
  mix,
  positionLocal,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { forwardRef, useEffect, useMemo } from 'react';

import { signedPerlinApprox } from '../../../../../elements/perlinNoiseBall/perlinNoiseNodes';

const GrassPatchGPU = forwardRef(function GrassPatchGPU(
  { colorDark, colorLight, floorY, geometry },
  ref
) {
  const uniforms = useMemo(
    () => ({
      darkColor: uniform(new THREE.Color(colorDark)),
      height: uniform(1),
      lightColor: uniform(new THREE.Color(colorLight)),
      radius: uniform(1),
    }),
    []
  );

  useEffect(() => {
    const box = geometry.boundingBox;

    uniforms.darkColor.value.set(colorDark);
    uniforms.lightColor.value.set(colorLight);
    uniforms.radius.value = geometry.boundingSphere?.radius ?? 1;
    uniforms.height.value = box ? box.max.y - box.min.y : 1;
  }, [colorDark, colorLight, geometry, uniforms]);

  const material = useMemo(() => {
    const macroNoise = signedPerlinApprox(positionLocal.mul(2.2));
    const detailNoise = signedPerlinApprox(
      positionLocal.mul(6.8).add(vec3(1.7, 0.0, 4.1))
    );
    const topMask = clamp(
      positionLocal.y.div(uniforms.height.max(float(0.0001))),
      0.0,
      1.0
    );
    const radialMask = float(1.0).sub(
      clamp(
        length(vec3(positionLocal.x, 0.0, positionLocal.z)).div(
          uniforms.radius.max(float(0.0001))
        ),
        0.0,
        1.0
      )
    );
    const tone = clamp(
      float(0.52)
        .add(macroNoise.mul(0.26))
        .add(detailNoise.mul(0.12))
        .add(topMask.mul(0.14))
        .add(radialMask.mul(0.08)),
      0.0,
      1.0
    );
    const nextMaterial = new THREE.MeshStandardNodeMaterial({
      color: new THREE.Color(colorDark),
      metalness: 0,
      roughness: 0.96,
    });

    nextMaterial.colorNode = mix(uniforms.darkColor, uniforms.lightColor, tone);

    return nextMaterial;
  }, [colorDark, uniforms]);

  useEffect(
    () => () => {
      material.dispose();
    },
    [material]
  );

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, floorY, 0]}
      receiveShadow
      ref={ref}
    />
  );
});

export default GrassPatchGPU;
