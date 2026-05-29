import * as THREE from 'three';

import React, { forwardRef, useEffect, useMemo } from 'react';

import noiseGlsl from '../../../../../elements/perlinNoiseBall/noiseGlsl';

const GrassPatchGL = forwardRef(function GrassPatchGL(
  { colorDark, colorLight, floorY, geometry },
  ref
) {
  const material = useMemo(() => {
    const darkColor = new THREE.Color(colorDark);
    const lightColor = new THREE.Color(colorLight);
    const box = geometry.boundingBox;
    const radius = geometry.boundingSphere?.radius ?? 1;
    const height = box ? box.max.y - box.min.y : 1;
    const nextMaterial = new THREE.MeshStandardMaterial({
      color: darkColor,
      metalness: 0,
      roughness: 0.96,
    });

    nextMaterial.onBeforeCompile = (shader) => {
      const nextShader = shader;

      nextShader.uniforms.uPatchDark = { value: darkColor.clone() };
      nextShader.uniforms.uPatchHeight = { value: height };
      nextShader.uniforms.uPatchLight = { value: lightColor.clone() };
      nextShader.uniforms.uPatchRadius = { value: radius };

      nextShader.vertexShader = nextShader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying vec3 vPatchPos;'
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvPatchPos = transformed;'
        );

      nextShader.fragmentShader = nextShader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>\n${noiseGlsl}\nvarying vec3 vPatchPos;\nuniform vec3 uPatchDark;\nuniform float uPatchHeight;\nuniform vec3 uPatchLight;\nuniform float uPatchRadius;`
        )
        .replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          `
          float macroNoise = pnoise(vec3(vPatchPos.xz * 2.2, 0.0), vec3(10.0));
          float detailNoise = pnoise(vec3(vPatchPos.xz * 6.8 + vec2(1.7, 4.1), 0.0), vec3(10.0));
          float topMask = clamp(vPatchPos.y / max(uPatchHeight, 0.0001), 0.0, 1.0);
          float radialMask = 1.0 - clamp(length(vPatchPos.xz) / max(uPatchRadius, 0.0001), 0.0, 1.0);
          float tone = clamp(
            0.52 + macroNoise * 0.26 + detailNoise * 0.12 + topMask * 0.14 + radialMask * 0.08,
            0.0,
            1.0
          );
          vec3 patchColor = mix(uPatchDark, uPatchLight, tone);
          vec4 diffuseColor = vec4(patchColor, opacity);
          `
        );
    };

    nextMaterial.customProgramCacheKey = () => 'fur-lab-grass-patch';
    nextMaterial.needsUpdate = true;

    return nextMaterial;
  }, [colorDark, colorLight, geometry]);

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

export default GrassPatchGL;
