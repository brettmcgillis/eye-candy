import * as THREE from 'three';

import React, { useEffect, useMemo } from 'react';

import { MAX_RIPPLES } from '../hooks/useOceanRuntime';

function getSunDirection({ azimuth, elevation }) {
  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const theta = THREE.MathUtils.degToRad(azimuth);

  return new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
}

const WAVE_PREAMBLE = [
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
  'uniform float uRippleRadius;',
  'uniform float uRippleExpansion;',
  'uniform float uRippleFrequency;',
  'uniform float uRippleSpeed;',
  'uniform float uRippleDecay;',
  `uniform vec4 uRippleData[${MAX_RIPPLES}];`,
  'varying float vRippleHeight;',
  'varying float vWaveHeight;',
  'varying vec3 vWorldPosition;',
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
  '      uTime * uChopSpeed * (0.75 + float(i) * 0.28);',
  '    height += sin(theta) * chopWaves[i].w * uChopAmplitude;',
  '  }',
  '',
  '  for (int i = 0; i < DETAIL_COUNT; i++) {',
  '    vec2 direction = normalize(detailWaves[i].xy);',
  '    float theta =',
  '      dot(direction, xz) * detailWaves[i].z * uDetailFrequency +',
  '      uTime * uDetailSpeed * (1.0 + float(i) * 0.35);',
  '    height += sin(theta) * detailWaves[i].w * uDetailAmplitude;',
  '  }',
  '',
  '  return height;',
  '}',
  '',
  'float sampleRippleHeight(vec2 xz) {',
  '  float ripple = 0.0;',
  '',
  `  for (int i = 0; i < ${MAX_RIPPLES}; i++) {`,
  '    vec4 rippleData = uRippleData[i];',
  '    float age = uTime - rippleData.z;',
  '',
  '    if (rippleData.w <= 0.0 || age < 0.0) {',
  '      continue;',
  '    }',
  '',
  '    float radius = uRippleRadius + age * uRippleExpansion;',
  '    float distanceToRipple = distance(xz, rippleData.xy);',
  '',
  '    if (distanceToRipple > radius) {',
  '      continue;',
  '    }',
  '',
  '    float influence =',
  '      1.0 - smoothstep(radius * 0.35, radius, distanceToRipple);',
  '    float decay = exp(-age * uRippleDecay);',
  '    float oscillation = sin(',
  '      distanceToRipple * uRippleFrequency - age * uRippleSpeed',
  '    );',
  '',
  '    ripple += oscillation * influence * decay * rippleData.w;',
  '  }',
  '',
  '  return ripple;',
  '}',
  '',
  'float sampleOceanHeight(vec2 xz) {',
  '  return sampleBaseOceanHeight(xz) + sampleRippleHeight(xz);',
  '}',
  '',
  'vec3 sampleOceanNormal(vec2 xz) {',
  '  float epsilon = max(uNormalEpsilon, 0.01);',
  '  float left = sampleOceanHeight(xz - vec2(epsilon, 0.0));',
  '  float right = sampleOceanHeight(xz + vec2(epsilon, 0.0));',
  '  float back = sampleOceanHeight(xz - vec2(0.0, epsilon));',
  '  float front = sampleOceanHeight(xz + vec2(0.0, epsilon));',
  '',
  '  return normalize(vec3(left - right, epsilon * 2.0, back - front));',
  '}',
].join('\n');

const VERTEX_COMMON_REPLACE = ['#include <common>', WAVE_PREAMBLE].join('\n');

const BEGINNORMAL_REPLACE = [
  'initOceanWaves();',
  'vec3 objectNormal = sampleOceanNormal(position.xz);',
  '#ifdef USE_TANGENT',
  '  vec3 objectTangent = vec3(tangent.xyz);',
  '#endif',
].join('\n');

const BEGIN_VERTEX_REPLACE = [
  'initOceanWaves();',
  'float rippleHeight = sampleRippleHeight(position.xz);',
  'float oceanHeight = sampleBaseOceanHeight(position.xz) + rippleHeight;',
  'vec3 transformed = vec3(position.x, position.y + oceanHeight, position.z);',
  'vRippleHeight = abs(rippleHeight);',
  'vWaveHeight = oceanHeight;',
].join('\n');

const WORLDPOS_REPLACE = [
  '#include <worldpos_vertex>',
  'vWorldPosition = worldPosition.xyz;',
].join('\n');

const FRAGMENT_COMMON_REPLACE = [
  '#include <common>',
  'varying float vRippleHeight;',
  'varying float vWaveHeight;',
  'varying vec3 vWorldPosition;',
  'uniform vec3 uDeepColor;',
  'uniform vec3 uShallowColor;',
  'uniform vec3 uHorizonColor;',
  'uniform vec3 uFoamColor;',
  'uniform vec3 uSunColor;',
  'uniform vec3 uSunDirection;',
  'uniform float uSunIntensity;',
  'uniform float uFresnelPower;',
  'uniform float uFresnelStrength;',
  'uniform float uFoamStrength;',
  'uniform float uFoamThreshold;',
  'uniform float uFoamSoftness;',
  'uniform float uFoamWaveInfluence;',
  'uniform float uSwellAmplitude;',
].join('\n');

const NORMAL_FRAGMENT_REPLACE = [
  '#include <normal_fragment_begin>',
  'vec3 worldNormal = normalize(normal);',
  'vec3 viewDirection = normalize(cameraPosition - vWorldPosition);',
  'vec3 reflectedView = normalize(reflect(-viewDirection, worldNormal));',
  'vec3 sunDirection = normalize(uSunDirection);',
  'float fresnel = pow(',
  '  1.0 - max(dot(worldNormal, viewDirection), 0.0),',
  '  max(uFresnelPower, 0.001)',
  ');',
  'float waveBand = smoothstep(',
  '  -uSwellAmplitude * 1.3,',
  '  uSwellAmplitude * 1.3,',
  '  vWaveHeight',
  ');',
  'float surfaceFacing = clamp(worldNormal.y * 0.5 + 0.5, 0.0, 1.0);',
  'vec3 waterColor = mix(',
  '  uDeepColor,',
  '  uShallowColor,',
  '  clamp(waveBand * 0.72 + (1.0 - surfaceFacing) * 0.2, 0.0, 1.0)',
  ');',
  'vec3 reflectedSky = mix(',
  '  waterColor,',
  '  uHorizonColor,',
  '  smoothstep(-0.05, 0.85, reflectedView.y)',
  ');',
  'float sunSpecular =',
  '  pow(max(dot(reflectedView, sunDirection), 0.0), 180.0) * uSunIntensity;',
  'float foam = smoothstep(',
  '  uFoamThreshold,',
  '  uFoamThreshold + uFoamSoftness,',
  '  (1.0 - worldNormal.y) + max(vWaveHeight, 0.0) * uFoamWaveInfluence',
  ');',
  'float rippleFoam = smoothstep(0.008, 0.06, vRippleHeight);',
  'vec3 litWater = mix(',
  '  waterColor + uShallowColor * (1.0 - fresnel) * 0.08,',
  '  reflectedSky + uSunColor * sunSpecular * 0.35,',
  '  clamp(fresnel * uFresnelStrength, 0.0, 1.0)',
  ');',
  'diffuseColor.rgb = mix(',
  '  litWater,',
  '  uFoamColor,',
  '  clamp(foam * uFoamStrength + rippleFoam * 0.85, 0.0, 1.0)',
  ');',
].join('\n');

export default function OceanMaterial({ ocean, runtime, sun }) {
  const sunDirection = useMemo(
    () => getSunDirection(sun),
    [sun.azimuth, sun.elevation]
  );
  const sunColorUniform = useMemo(
    () => ({ value: new THREE.Color(sun.color) }),
    [sun.color]
  );
  const sunDirectionUniform = useMemo(
    () => ({ value: sunDirection.clone() }),
    [sunDirection]
  );
  const sunIntensityUniform = useMemo(
    () => ({ value: sun.intensity }),
    [sun.intensity]
  );
  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      clearcoat: ocean.clearcoat,
      clearcoatRoughness: ocean.clearcoatRoughness,
      color: new THREE.Color('#ffffff'),
      envMapIntensity: ocean.envMapIntensity,
      metalness: ocean.metalness,
      opacity: ocean.opacity,
      roughness: ocean.roughness,
      side: THREE.FrontSide,
      transparent: true,
    });

    mat.onBeforeCompile = (shader) => {
      Object.entries(runtime.uniforms).forEach(([key, uniform]) => {
        shader.uniforms[key] = uniform;
      });
      shader.uniforms.uSunColor = sunColorUniform;
      shader.uniforms.uSunDirection = sunDirectionUniform;
      shader.uniforms.uSunIntensity = sunIntensityUniform;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        VERTEX_COMMON_REPLACE
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        BEGINNORMAL_REPLACE
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        BEGIN_VERTEX_REPLACE
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        WORLDPOS_REPLACE
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        FRAGMENT_COMMON_REPLACE
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        NORMAL_FRAGMENT_REPLACE
      );
    };

    mat.customProgramCacheKey = () => `row-it-alone-ocean-${MAX_RIPPLES}`;

    return mat;
  }, [
    ocean,
    runtime.uniforms,
    sunColorUniform,
    sunDirectionUniform,
    sunIntensityUniform,
  ]);

  useEffect(() => {
    material.clearcoat = ocean.clearcoat;
    material.clearcoatRoughness = ocean.clearcoatRoughness;
    material.envMapIntensity = ocean.envMapIntensity;
    material.metalness = ocean.metalness;
    material.opacity = ocean.opacity;
    material.roughness = ocean.roughness;
    material.transparent = ocean.opacity < 1;
    material.needsUpdate = true;
  }, [material, ocean]);

  useEffect(() => {
    sunDirectionUniform.value.copy(sunDirection);
    sunColorUniform.value.set(sun.color);
    sunIntensityUniform.value = sun.intensity;
  }, [
    sun.color,
    sun.intensity,
    sunColorUniform,
    sunDirection,
    sunDirectionUniform,
    sunIntensityUniform,
  ]);

  return <primitive object={material} attach="material" />;
}
