import * as THREE from 'three';

import React, { useCallback, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

function getSunDirection({ azimuth, elevation }) {
  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const theta = THREE.MathUtils.degToRad(azimuth);

  return new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
}

const MATERIAL_VERTEX_PREAMBLE = [
  'uniform float uTime;',
  'uniform float uSwellAmplitude;',
  'uniform float uSwellFrequency;',
  'uniform float uSwellSpeed;',
  'uniform float uChopAmplitude;',
  'uniform float uChopFrequency;',
  'uniform float uChopSpeed;',
  'uniform float uDetailAmplitude;',
  'uniform float uDetailFrequency;',
  'uniform float uDetailSpeed;',
  'uniform float uNormalEpsilon;',
  'uniform sampler2D uInteractionHeightmap;',
  'uniform float uInteractionBounds;',
  '',
  'const int SWELL_COUNT = 3;',
  'const int CHOP_COUNT = 3;',
  'const int DETAIL_COUNT = 3;',
  'vec4 swellWaves[SWELL_COUNT];',
  'vec4 chopWaves[CHOP_COUNT];',
  'vec4 detailWaves[DETAIL_COUNT];',
  '',
  'void initOceanWaves() {',
  '  swellWaves[0] = vec4(0.86, 0.51, 0.42, 1.0);',
  '  swellWaves[1] = vec4(-0.34, 0.94, 0.66, 0.72);',
  '  swellWaves[2] = vec4(0.57, -0.82, 0.92, 0.48);',
  '',
  '  chopWaves[0] = vec4(0.91, -0.21, 1.55, 1.0);',
  '  chopWaves[1] = vec4(-0.72, -0.69, 2.1, 0.65);',
  '  chopWaves[2] = vec4(0.18, 0.98, 2.65, 0.4);',
  '',
  '  detailWaves[0] = vec4(-0.9, 0.43, 4.2, 1.0);',
  '  detailWaves[1] = vec4(0.49, 0.87, 5.1, 0.58);',
  '  detailWaves[2] = vec4(-0.17, -0.98, 6.6, 0.32);',
  '}',
  '',
  'float sampleBaseOceanHeight(vec2 xz) {',
  '  float height = 0.0;',
  '',
  '  for (int i = 0; i < SWELL_COUNT; i++) {',
  '    vec2 direction = normalize(swellWaves[i].xy);',
  '    float theta =',
  '      dot(direction, xz) * swellWaves[i].z * uSwellFrequency +',
  '      uTime * uSwellSpeed * (0.55 + float(i) * 0.23);',
  '    height += sin(theta) * swellWaves[i].w * uSwellAmplitude;',
  '  }',
  '',
  '  for (int i = 0; i < CHOP_COUNT; i++) {',
  '    vec2 direction = normalize(chopWaves[i].xy);',
  '    float theta =',
  '      dot(direction, xz) * chopWaves[i].z * uChopFrequency +',
  '      uTime * uChopSpeed * (0.55 + float(i) * 0.23);',
  '    height += sin(theta) * chopWaves[i].w * uChopAmplitude;',
  '  }',
  '',
  '  for (int i = 0; i < DETAIL_COUNT; i++) {',
  '    vec2 direction = normalize(detailWaves[i].xy);',
  '    float theta =',
  '      dot(direction, xz) * detailWaves[i].z * uDetailFrequency +',
  '      uTime * uDetailSpeed * (0.55 + float(i) * 0.23);',
  '    height += sin(theta) * detailWaves[i].w * uDetailAmplitude;',
  '  }',
  '',
  '  return height;',
  '}',
  '',
  'float sampleInteractiveHeight(vec2 xz) {',
  '  vec2 uv = vec2(',
  '    xz.x / uInteractionBounds + 0.5,',
  '    0.5 - xz.y / uInteractionBounds',
  '  );',
  '',
  '  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {',
  '    return 0.0;',
  '  }',
  '',
  '  return texture2D(uInteractionHeightmap, uv).x;',
  '}',
  '',
  'float sampleOceanHeight(vec2 xz) {',
  '  return sampleBaseOceanHeight(xz) + sampleInteractiveHeight(xz);',
  '}',
  '',
  'vec3 sampleOceanNormal(vec2 xz) {',
  '  float epsilon = max(uNormalEpsilon, 0.01);',
  '  float left = sampleOceanHeight(xz - vec2(epsilon, 0.0));',
  '  float right = sampleOceanHeight(xz + vec2(epsilon, 0.0));',
  '  float back = sampleOceanHeight(xz - vec2(0.0, epsilon));',
  '  float front = sampleOceanHeight(xz + vec2(0.0, epsilon));',
  '',
  '  return normalize(vec3(left - right, back - front, epsilon * 2.0));',
  '}',
].join('\n');

const BEGIN_NORMAL_REPLACE = [
  'initOceanWaves();',
  'vec3 objectNormal = sampleOceanNormal(position.xy);',
  '#ifdef USE_TANGENT',
  '  vec3 objectTangent = vec3( tangent.xyz );',
  '#endif',
].join('\n');

const BEGIN_VERTEX_REPLACE = [
  'float interactionHeight = sampleInteractiveHeight(position.xy);',
  'float oceanHeight = sampleBaseOceanHeight(position.xy) + interactionHeight;',
  'vec3 transformed = vec3(position.x, position.y, position.z + oceanHeight);',
  '#ifdef USE_ALPHAHASH',
  '  vPosition = vec3( position );',
  '#endif',
].join('\n');

export default function OceanSurface({ ocean, runtime, sun }) {
  const geometry = useMemo(
    () =>
      new THREE.PlaneGeometry(
        ocean.planeSize,
        ocean.planeSize,
        ocean.planeSegments,
        ocean.planeSegments
      ),
    [ocean.planeSegments, ocean.planeSize]
  );
  const sunDirection = useMemo(
    () => getSunDirection(sun),
    [sun.azimuth, sun.elevation]
  );

  const material = useMemo(() => {
    const surfaceMaterial = new THREE.MeshStandardMaterial({
      color: ocean.shallowColor,
      emissive: ocean.deepColor,
      emissiveIntensity: 0.08,
      fog: true,
      metalness: 0.82,
      opacity: ocean.opacity,
      roughness: 0.12,
      side: THREE.DoubleSide,
      transparent: ocean.opacity < 0.999,
    });

    surfaceMaterial.onBeforeCompile = (shader) => {
      const compiledShader = shader;

      Object.entries(runtime.uniforms).forEach(([key, uniform]) => {
        compiledShader.uniforms[key] = uniform;
      });

      compiledShader.vertexShader = compiledShader.vertexShader.replace(
        '#include <common>',
        ['#include <common>', MATERIAL_VERTEX_PREAMBLE].join('\n')
      );
      compiledShader.vertexShader = compiledShader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        BEGIN_NORMAL_REPLACE
      );
      compiledShader.vertexShader = compiledShader.vertexShader.replace(
        '#include <begin_vertex>',
        BEGIN_VERTEX_REPLACE
      );

      surfaceMaterial.userData.shader = compiledShader;
    };

    surfaceMaterial.customProgramCacheKey = () =>
      'row-it-alone-water-heightmap-mesh';

    return surfaceMaterial;
  }, [
    geometry,
    ocean.deepColor,
    ocean.opacity,
    ocean.shallowColor,
    runtime.uniforms,
  ]);

  const handlePointerMove = useCallback(
    (event) => {
      event.stopPropagation();
      runtime.setPointerTarget(event.point.x, event.point.z);
      runtime.emitInteractiveRipple(event.point.x, event.point.z);
    },
    [runtime]
  );

  const handlePointerOut = useCallback(() => {
    runtime.clearPointerTarget();
  }, [runtime]);

  useEffect(
    () => () => {
      runtime.clearPointerTarget();
    },
    [runtime]
  );

  useEffect(() => {
    material.color.set(ocean.shallowColor);
    material.emissive.set(ocean.deepColor);
    material.emissiveIntensity = 0.08;
    material.depthWrite = ocean.opacity >= 0.999;
    material.metalness = THREE.MathUtils.clamp(
      0.45 + ocean.fresnelStrength * 0.32,
      0,
      1
    );
    material.opacity = ocean.opacity;
    material.roughness = THREE.MathUtils.clamp(
      0.24 - ocean.fresnelStrength * 0.08,
      0.02,
      0.3
    );
    material.transparent = ocean.opacity < 0.999;
    material.userData.sunDirection = sunDirection.clone();
  }, [
    ocean.deepColor,
    ocean.fresnelStrength,
    ocean.opacity,
    ocean.shallowColor,
    material,
    sunDirection,
  ]);

  useFrame(() => {
    if (material.userData.shader) {
      material.userData.shader.uniforms.uTime.value = runtime.timeRef.current;
    }
  });

  return (
    <>
      <mesh
        castShadow
        geometry={geometry}
        material={material}
        receiveShadow
        rotation-x={-Math.PI / 2}
      />
      <mesh
        geometry={geometry}
        onPointerDown={handlePointerMove}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        position-y={0.02}
        rotation-x={-Math.PI / 2}
      >
        <meshBasicMaterial
          depthWrite={false}
          opacity={0}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
    </>
  );
}
