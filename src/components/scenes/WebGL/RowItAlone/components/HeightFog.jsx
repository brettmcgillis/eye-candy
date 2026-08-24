import React, { useCallback, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

const HEIGHT_FOG_PARS_VERTEX = [
  THREE.ShaderChunk.fog_pars_vertex,
  '#ifdef USE_FOG',
  'varying vec3 vHeightFogWorldPosition;',
  '#endif',
].join('\n');

const HEIGHT_FOG_VERTEX = [
  THREE.ShaderChunk.fog_vertex,
  '#ifdef USE_FOG',
  'vec4 heightFogWorldPosition = vec4(position, 1.0);',
  '#ifdef USE_BATCHING',
  '  heightFogWorldPosition = batchingMatrix * heightFogWorldPosition;',
  '#endif',
  '#ifdef USE_INSTANCING',
  '  heightFogWorldPosition = instanceMatrix * heightFogWorldPosition;',
  '#endif',
  'heightFogWorldPosition = modelMatrix * heightFogWorldPosition;',
  'vHeightFogWorldPosition = heightFogWorldPosition.xyz;',
  '#endif',
].join('\n');

const HEIGHT_FOG_PARS_FRAGMENT = [
  THREE.ShaderChunk.fog_pars_fragment,
  '#ifdef USE_FOG',
  'varying vec3 vHeightFogWorldPosition;',
  'uniform float uHeightFogFloor;',
  'uniform float uHeightFogCeiling;',
  'uniform float uHeightFogNoiseScale;',
  'uniform float uHeightFogNoiseStrength;',
  'uniform vec3 uHeightFogFlow;',
  'uniform float uHeightFogSpeed;',
  'uniform float uHeightFogTime;',
  '',
  'float hash(vec3 p) {',
  '  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);',
  '}',
  '',
  'float noise(vec3 p) {',
  '  vec3 i = floor(p);',
  '  vec3 f = fract(p);',
  '  f = f * f * (3.0 - 2.0 * f);',
  '',
  '  float n000 = hash(i + vec3(0.0, 0.0, 0.0));',
  '  float n100 = hash(i + vec3(1.0, 0.0, 0.0));',
  '  float n010 = hash(i + vec3(0.0, 1.0, 0.0));',
  '  float n110 = hash(i + vec3(1.0, 1.0, 0.0));',
  '  float n001 = hash(i + vec3(0.0, 0.0, 1.0));',
  '  float n101 = hash(i + vec3(1.0, 0.0, 1.0));',
  '  float n011 = hash(i + vec3(0.0, 1.0, 1.0));',
  '  float n111 = hash(i + vec3(1.0, 1.0, 1.0));',
  '',
  '  float nx00 = mix(n000, n100, f.x);',
  '  float nx10 = mix(n010, n110, f.x);',
  '  float nx01 = mix(n001, n101, f.x);',
  '  float nx11 = mix(n011, n111, f.x);',
  '  float nxy0 = mix(nx00, nx10, f.y);',
  '  float nxy1 = mix(nx01, nx11, f.y);',
  '',
  '  return mix(nxy0, nxy1, f.z);',
  '}',
  '',
  'float fbm(vec3 p) {',
  '  float value = 0.0;',
  '  float amplitude = 0.5;',
  '',
  '  for (int i = 0; i < 4; i++) {',
  '    value += noise(p) * amplitude;',
  '    p *= 2.03;',
  '    amplitude *= 0.5;',
  '  }',
  '',
  '  return value;',
  '}',
  '#endif',
].join('\n');

const HEIGHT_FOG_FRAGMENT = [
  '#ifdef USE_FOG',
  'float fogDepth = vFogDepth;',
  'float expFactor = 1.0 - exp(-fogDensity * fogDensity * fogDepth * fogDepth);',
  'float heightFactor = 1.0 - smoothstep(',
  '  uHeightFogFloor,',
  '  uHeightFogCeiling,',
  '  vHeightFogWorldPosition.y',
  ');',
  'vec3 noiseCoord =',
  '  vHeightFogWorldPosition * uHeightFogNoiseScale +',
  '  uHeightFogFlow * uHeightFogTime * uHeightFogSpeed;',
  'float noiseFactor = mix(',
  '  1.0,',
  '  fbm(noiseCoord),',
  '  clamp(uHeightFogNoiseStrength, 0.0, 1.0)',
  ');',
  'float fogFactor = clamp(expFactor * heightFactor * noiseFactor, 0.0, 1.0);',
  'gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);',
  '#endif',
].join('\n');

export default function HeightFog({ fog }) {
  const materialsRef = useRef([]);
  const patchedMaterialsRef = useRef(new WeakSet());
  const shadersRef = useRef([]);
  const { scene } = useThree();

  const patchMaterial = useCallback(
    (material) => {
      if (!material || patchedMaterialsRef.current.has(material)) {
        return;
      }

      if (material.fog === false) {
        return;
      }

      const nextMaterial = material;

      patchedMaterialsRef.current.add(nextMaterial);
      materialsRef.current.push(nextMaterial);
      nextMaterial.userData.heightFogOriginalOnBeforeCompile =
        nextMaterial.onBeforeCompile;

      nextMaterial.onBeforeCompile = (shader, renderer) => {
        const nextShader = shader;

        nextMaterial.userData.heightFogOriginalOnBeforeCompile?.(
          nextShader,
          renderer
        );

        nextShader.uniforms.uHeightFogFloor = { value: fog.floor };
        nextShader.uniforms.uHeightFogCeiling = { value: fog.ceiling };
        nextShader.uniforms.uHeightFogNoiseScale = { value: fog.noiseScale };
        nextShader.uniforms.uHeightFogNoiseStrength = {
          value: fog.noiseStrength,
        };
        nextShader.uniforms.uHeightFogFlow = {
          value: new THREE.Vector3(...fog.flow),
        };
        nextShader.uniforms.uHeightFogSpeed = { value: fog.speed };
        nextShader.uniforms.uHeightFogTime = { value: 0 };
        shadersRef.current.push(nextShader);
      };

      nextMaterial.needsUpdate = true;
    },
    [fog]
  );

  useEffect(() => {
    const original = {
      fogFragment: THREE.ShaderChunk.fog_fragment,
      fogParsFragment: THREE.ShaderChunk.fog_pars_fragment,
      fogParsVertex: THREE.ShaderChunk.fog_pars_vertex,
      fogVertex: THREE.ShaderChunk.fog_vertex,
    };

    THREE.ShaderChunk.fog_pars_vertex = HEIGHT_FOG_PARS_VERTEX;
    THREE.ShaderChunk.fog_vertex = HEIGHT_FOG_VERTEX;
    THREE.ShaderChunk.fog_pars_fragment = HEIGHT_FOG_PARS_FRAGMENT;
    THREE.ShaderChunk.fog_fragment = HEIGHT_FOG_FRAGMENT;

    return () => {
      THREE.ShaderChunk.fog_fragment = original.fogFragment;
      THREE.ShaderChunk.fog_pars_fragment = original.fogParsFragment;
      THREE.ShaderChunk.fog_pars_vertex = original.fogParsVertex;
      THREE.ShaderChunk.fog_vertex = original.fogVertex;

      materialsRef.current.forEach((material) => {
        const nextMaterial = material;

        nextMaterial.onBeforeCompile =
          nextMaterial.userData.heightFogOriginalOnBeforeCompile;
        delete nextMaterial.userData.heightFogOriginalOnBeforeCompile;
        nextMaterial.needsUpdate = true;
      });
    };
  }, []);

  useFrame(({ clock }) => {
    scene.traverse((object) => {
      if (!object.material) {
        return;
      }

      if (Array.isArray(object.material)) {
        object.material.forEach(patchMaterial);
        return;
      }

      patchMaterial(object.material);
    });

    shadersRef.current = shadersRef.current.filter(Boolean);

    shadersRef.current.forEach((shader) => {
      const nextShader = shader;

      nextShader.uniforms.uHeightFogFloor.value = fog.floor;
      nextShader.uniforms.uHeightFogCeiling.value = fog.ceiling;
      nextShader.uniforms.uHeightFogNoiseScale.value = fog.noiseScale;
      nextShader.uniforms.uHeightFogNoiseStrength.value = fog.noiseStrength;
      nextShader.uniforms.uHeightFogFlow.value.set(...fog.flow);
      nextShader.uniforms.uHeightFogSpeed.value = fog.speed;
      nextShader.uniforms.uHeightFogTime.value = clock.elapsedTime;
    });
  });

  return <fogExp2 attach="fog" args={[fog.color, fog.density]} />;
}
