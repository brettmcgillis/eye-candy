import * as THREE from 'three';

import React, { useCallback, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import oceanShaderChunks from '../shaders/oceanShaderChunks';

function getSunDirection({ azimuth, elevation }) {
  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const theta = THREE.MathUtils.degToRad(azimuth);

  return new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
}

const MATERIAL_VERTEX_PREAMBLE = [
  'varying vec3 vRowItAloneWorldPosition;',
  oceanShaderChunks.OCEAN_HEIGHT_GLSL,
  oceanShaderChunks.OCEAN_NORMAL_GLSL,
].join('\n');

const MATERIAL_FRAGMENT_PREAMBLE = [
  'uniform sampler2D uMaskTexture;',
  'uniform vec2 uMaskCenter;',
  'uniform float uMaskScale;',
  'uniform float uMaskDebug;',
  'varying vec3 vRowItAloneWorldPosition;',
].join('\n');

const BEGIN_NORMAL_REPLACE = [
  'initOceanWaves();',
  'vec2 normalCoord = vec2(position.x, -position.y);',
  'vec3 objectNormal = sampleOceanNormal(normalCoord);',
  '#ifdef USE_TANGENT',
  '  vec3 objectTangent = vec3( tangent.xyz );',
  '#endif',
].join('\n');

const BEGIN_VERTEX_REPLACE = [
  'vec2 heightCoord = vec2(position.x, -position.y);',
  'float interactionHeight = sampleInteractiveHeight(heightCoord);',
  'float oceanHeight = sampleBaseOceanHeight(heightCoord) + interactionHeight;',
  'vec3 transformed = vec3(position.x, position.y, position.z + oceanHeight);',
  'vRowItAloneWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;',
  '#ifdef USE_ALPHAHASH',
  '  vPosition = vec3( position );',
  '#endif',
].join('\n');

const DITHERING_FRAGMENT_REPLACE = [
  '#include <dithering_fragment>',
  'vec2 maskUV =',
  '  (vec2(-vRowItAloneWorldPosition.x, -vRowItAloneWorldPosition.z) -',
  '    vec2(-uMaskCenter.x, -uMaskCenter.y)) / uMaskScale + 0.5;',
  'float maskValue = texture2D(uMaskTexture, maskUV).r;',
  '',
  'if (maskValue < 0.5) {',
  '  if (uMaskDebug > 0.5) {',
  '    gl_FragColor.rgb = vec3(1.0, 0.18, 0.1);',
  '    gl_FragColor.a = max(gl_FragColor.a, 0.95);',
  '  } else {',
  '    discard;',
  '  }',
  '}',
].join('\n');

export default function OceanSurface({
  maskDebug = false,
  maskPass,
  ocean,
  runtime,
  sun,
}) {
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
  const maskDebugUniform = useMemo(() => ({ value: 0 }), []);

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
      compiledShader.uniforms.uMaskCenter = maskPass.maskCenterUniform;
      compiledShader.uniforms.uMaskDebug = maskDebugUniform;
      compiledShader.uniforms.uMaskScale = maskPass.maskScaleUniform;
      compiledShader.uniforms.uMaskTexture = maskPass.maskTextureUniform;

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
      compiledShader.fragmentShader = compiledShader.fragmentShader.replace(
        '#include <common>',
        ['#include <common>', MATERIAL_FRAGMENT_PREAMBLE].join('\n')
      );
      compiledShader.fragmentShader = compiledShader.fragmentShader.replace(
        '#include <dithering_fragment>',
        DITHERING_FRAGMENT_REPLACE
      );

      surfaceMaterial.userData.shader = compiledShader;
    };

    surfaceMaterial.customProgramCacheKey = () =>
      'row-it-alone-water-heightmap-hero-mask';

    return surfaceMaterial;
  }, [
    ocean.deepColor,
    ocean.opacity,
    ocean.shallowColor,
    maskDebugUniform,
    maskPass.maskCenterUniform,
    maskPass.maskScaleUniform,
    maskPass.maskTextureUniform,
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
    runtime.clearInteractionTarget();
    runtime.clearPointerTarget();
  }, [runtime]);

  useEffect(
    () => () => {
      runtime.clearInteractionTarget();
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

  useEffect(() => {
    maskDebugUniform.value = maskDebug ? 1 : 0;
  }, [maskDebug, maskDebugUniform]);

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
        renderOrder={20}
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
