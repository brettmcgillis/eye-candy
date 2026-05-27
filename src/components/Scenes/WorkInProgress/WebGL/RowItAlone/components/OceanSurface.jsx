import * as THREE from 'three';
import { TextureLoader } from 'three';
import { Water } from 'three/addons/objects/Water.js';

import React, { useCallback, useEffect, useMemo } from 'react';

import { useFrame, useLoader } from '@react-three/fiber';

function getSunDirection({ azimuth, elevation }) {
  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const theta = THREE.MathUtils.degToRad(azimuth);

  return new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
}

const WAVE_VERTEX_PREAMBLE = [
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
  'varying float vInteractionHeight;',
  'varying float vWaveHeight;',
  'varying vec3 vWaveNormal;',
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
  '  return normalize(vec3(left - right, epsilon * 2.0, back - front));',
  '}',
].join('\n');

const WATER_VERTEX_REPLACE = [
  'initOceanWaves();',
  'vec2 oceanCoord = position.xy;',
  'float interactiveHeight = sampleInteractiveHeight(oceanCoord);',
  'float oceanHeight = sampleBaseOceanHeight(oceanCoord) + interactiveHeight;',
  'vec3 transformedPosition = vec3(',
  '  position.x,',
  '  position.y,',
  '  position.z + oceanHeight',
  ');',
  'vInteractionHeight = interactiveHeight;',
  'vWaveHeight = oceanHeight;',
  'vWaveNormal = sampleOceanNormal(oceanCoord);',
  'mirrorCoord = modelMatrix * vec4( transformedPosition, 1.0 );',
  'worldPosition = mirrorCoord.xyzw;',
  'mirrorCoord = textureMatrix * mirrorCoord;',
  'vec4 mvPosition = modelViewMatrix * vec4( transformedPosition, 1.0 );',
  'gl_Position = projectionMatrix * mvPosition;',
].join('\n');

const FRAGMENT_PREAMBLE = [
  'uniform float uSwellAmplitude;',
  'uniform vec3 uDeepColor;',
  'uniform vec3 uShallowColor;',
  'uniform vec3 uHorizonColor;',
  'uniform vec3 uFoamColor;',
  'uniform float uFresnelPower;',
  'uniform float uFresnelStrength;',
  'uniform float uFoamStrength;',
  'uniform float uFoamThreshold;',
  'uniform float uFoamSoftness;',
  'uniform float uFoamWaveInfluence;',
  'varying float vInteractionHeight;',
  'varying float vWaveHeight;',
  'varying vec3 vWaveNormal;',
].join('\n');

const RIPPLE_OUTGOING_LIGHT_REPLACE = [
  'float interactionFoam = smoothstep(0.003, 0.035, abs(vInteractionHeight));',
  'vec3 waveNormal = normalize(vWaveNormal);',
  'float fresnel = pow(',
  '  1.0 - max(dot(waveNormal, eyeDirection), 0.0),',
  '  max(uFresnelPower, 0.001)',
  ');',
  'float waveBand = smoothstep(',
  '  -uSwellAmplitude * 1.3,',
  '  uSwellAmplitude * 1.3,',
  '  vWaveHeight',
  ');',
  'float foam = smoothstep(',
  '  uFoamThreshold,',
  '  uFoamThreshold + uFoamSoftness,',
  '  (1.0 - waveNormal.y) + max(vWaveHeight, 0.0) * uFoamWaveInfluence',
  ');',
  'vec3 reflectedView = normalize(reflect(-eyeDirection, waveNormal));',
  'vec3 waterTint = mix(',
  '  uDeepColor,',
  '  uShallowColor,',
  '  clamp(waveBand * 0.72 + (1.0 - waveNormal.y) * 0.2, 0.0, 1.0)',
  ');',
  'vec3 reflectedSky = mix(',
  '  waterTint,',
  '  uHorizonColor,',
  '  smoothstep(-0.05, 0.85, reflectedView.y)',
  ');',
  'vec3 stylizedWater = mix(',
  '  albedo + waterTint * 0.08,',
  '  reflectedSky + reflectionSample * 0.65,',
  '  clamp(fresnel * uFresnelStrength, 0.0, 1.0)',
  ');',
  'vec3 outgoingLight = mix(',
  '  stylizedWater,',
  '  uFoamColor,',
  '  clamp(foam * uFoamStrength + interactionFoam * 0.2, 0.0, 1.0)',
  ');',
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
  const waterNormals = useLoader(TextureLoader, '/textures/waternormals.jpg');
  const sunDirection = useMemo(
    () => getSunDirection(sun),
    [sun.azimuth, sun.elevation]
  );

  useEffect(() => {
    waterNormals.wrapS = THREE.RepeatWrapping;
    waterNormals.wrapT = THREE.RepeatWrapping;
    waterNormals.colorSpace = THREE.NoColorSpace;
  }, [waterNormals]);

  const water = useMemo(() => {
    const waterMesh = new Water(geometry, {
      alpha: ocean.opacity,
      fog: true,
      sunColor: sun.color,
      sunDirection: sunDirection.clone(),
      textureHeight: 512,
      textureWidth: 512,
      waterColor: ocean.deepColor,
      waterNormals,
      distortionScale: ocean.distortionScale,
    });

    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.receiveShadow = true;

    const { material } = waterMesh;

    Object.entries(runtime.uniforms).forEach(([key, uniform]) => {
      material.uniforms[key] = uniform;
    });

    material.uniforms.alpha.value = ocean.opacity;
    material.uniforms.size.value = ocean.normalMapSize;
    material.vertexShader = material.vertexShader.replace(
      'varying vec4 worldPosition;',
      ['varying vec4 worldPosition;', WAVE_VERTEX_PREAMBLE].join('\n')
    );
    material.vertexShader = material.vertexShader.replace(
      [
        'mirrorCoord = modelMatrix * vec4( position, 1.0 );',
        'worldPosition = mirrorCoord.xyzw;',
        'mirrorCoord = textureMatrix * mirrorCoord;',
        'vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );',
        'gl_Position = projectionMatrix * mvPosition;',
      ].join('\n'),
      WATER_VERTEX_REPLACE
    );
    material.fragmentShader = material.fragmentShader.replace(
      'varying vec4 worldPosition;',
      ['varying vec4 worldPosition;', FRAGMENT_PREAMBLE].join('\n')
    );
    material.fragmentShader = material.fragmentShader.replace(
      'vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );',
      'vec3 surfaceNormal = normalize(mix(noise.xzy * vec3( 1.5, 1.0, 1.5 ), vWaveNormal, 0.92));'
    );
    material.fragmentShader = material.fragmentShader.replace(
      'vec3 outgoingLight = albedo;',
      RIPPLE_OUTGOING_LIGHT_REPLACE
    );
    material.customProgramCacheKey = () => 'row-it-alone-water-heightfield';
    material.needsUpdate = true;

    return waterMesh;
  }, [
    geometry,
    ocean.deepColor,
    ocean.distortionScale,
    ocean.normalMapSize,
    ocean.opacity,
    runtime.uniforms,
    sun.color,
    sunDirection,
    waterNormals,
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
    water.material.uniforms.distortionScale.value = ocean.distortionScale;
    water.material.uniforms.alpha.value = ocean.opacity;
    water.material.uniforms.size.value = ocean.normalMapSize;
    water.material.uniforms.sunColor.value.set(sun.color);
    water.material.uniforms.waterColor.value.set(ocean.deepColor);
    water.material.depthWrite = ocean.opacity >= 0.999;
    water.material.transparent = ocean.opacity < 0.999;
  }, [
    ocean.deepColor,
    ocean.distortionScale,
    ocean.normalMapSize,
    ocean.opacity,
    sun.color,
    water,
  ]);

  useFrame(() => {
    water.material.uniforms.sunDirection.value.copy(sunDirection).normalize();
    water.material.uniforms.time.value = runtime.timeRef.current;
  });

  return (
    <>
      <primitive object={water} />
      <mesh
        geometry={geometry}
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
