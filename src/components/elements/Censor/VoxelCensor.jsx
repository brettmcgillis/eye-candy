import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

const vertexShader = /* glsl */ `
  varying vec3 vViewNormal;

  void main() {
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D sceneTexture;
  uniform sampler2D sceneDepthTexture;
  uniform sampler2D fullSceneTexture;
  uniform vec3 fallbackColor;
  uniform vec2 resolution;
  uniform float pixelSize;
  uniform float effectMode;
  uniform float voxelWorldSize;
  uniform float voxelSteps;
  uniform mat4 projectionMatrixInverse;
  uniform mat4 viewMatrixInverse;
  uniform mat4 viewProjectionMatrix;
  uniform vec3 cameraWorldPos;
  varying vec3 vViewNormal;

  vec2 clampUv(vec2 uv, vec2 texel) {
    return clamp(uv, texel * 0.5, vec2(1.0) - texel * 0.5);
  }

  vec3 dominantAxisNormal(vec3 v) {
    vec3 a = abs(v);
    if (a.x > a.y && a.x > a.z) return vec3(sign(v.x), 0.0, 0.0);
    if (a.y > a.z) return vec3(0.0, sign(v.y), 0.0);
    return vec3(0.0, 0.0, sign(v.z));
  }

  vec3 worldFromDepth(vec2 uv, float depth) {
    vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 viewPos = projectionMatrixInverse * clip;
    viewPos /= max(viewPos.w, 0.000001);
    vec4 worldPos = viewMatrixInverse * viewPos;
    return worldPos.xyz;
  }

  vec2 uvFromWorld(vec3 worldPos) {
    vec4 clip = viewProjectionMatrix * vec4(worldPos, 1.0);
    vec2 ndc = clip.xy / max(clip.w, 0.000001);
    return ndc * 0.5 + 0.5;
  }

  vec4 sampleMaskedBase(vec2 uvBaseQuantized) {
    vec4 sampleColor = texture2D(sceneTexture, uvBaseQuantized);
    if (sampleColor.a < 0.001) {
      sampleColor = texture2D(fullSceneTexture, uvBaseQuantized);
    }
    if (sampleColor.a < 0.001) {
      sampleColor = vec4(fallbackColor, 1.0);
    }
    return vec4(sampleColor.rgb, 1.0);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    vec2 blockCount = resolution / vec2(pixelSize);
    vec2 texel = 1.0 / resolution;

    vec2 uvBaseQuantized = round(uv * blockCount) / blockCount;
    uvBaseQuantized = clampUv(uvBaseQuantized, texel);

    vec4 outputColor = sampleMaskedBase(uvBaseQuantized);

    float clippedDepth = texture2D(sceneDepthTexture, uvBaseQuantized).x;
    if (clippedDepth < 0.999999) {
      vec3 worldPos = worldFromDepth(uvBaseQuantized, clippedDepth);
      float voxelSizeSafe = max(voxelWorldSize, 0.0001);

      vec3 voxelCell = floor(worldPos / voxelSizeSafe);
      vec3 voxelCenter = (voxelCell + vec3(0.5)) * voxelSizeSafe;
      vec3 normal = dominantAxisNormal(worldPos - voxelCenter);
      float shade = 0.7 + 0.3 * abs(dot(normalize(vViewNormal), normal));

      if (effectMode < 1.5) {
        vec2 voxelUv = clampUv(uvFromWorld(voxelCenter), texel);
        vec4 voxelColor = texture2D(fullSceneTexture, voxelUv);
        if (voxelColor.a < 0.001) voxelColor = vec4(fallbackColor, 1.0);
        outputColor = vec4(voxelColor.rgb * shade, 1.0);
      } else if (effectMode < 2.5) {
        vec3 rayDir = normalize(worldPos - cameraWorldPos);
        float maxDist = max(length(worldPos - cameraWorldPos), 0.0001);
        float stepDist = max(voxelSizeSafe * 0.5, 0.0001);
        vec3 marchPos = worldPos;

        for (int i = 0; i < 96; i += 1) {
          if (float(i) >= voxelSteps) break;
          float d = min((float(i) + 1.0) * stepDist, maxDist);
          marchPos = cameraWorldPos + rayDir * d;
          if (d >= maxDist) break;
        }

        vec3 rayCell = floor(marchPos / voxelSizeSafe);
        vec3 rayCenter = (rayCell + vec3(0.5)) * voxelSizeSafe;
        vec2 rayUv = clampUv(uvFromWorld(rayCenter), texel);
        vec4 rayColor = texture2D(fullSceneTexture, rayUv);
        if (rayColor.a < 0.001) rayColor = vec4(fallbackColor, 1.0);

        vec3 rayNormal = dominantAxisNormal(-rayDir);
        float rayShade = 0.55 + 0.45 * abs(dot(normalize(vViewNormal), rayNormal));
        outputColor = vec4(rayColor.rgb * rayShade, 1.0);
      } else {
        vec2 voxelUv = clampUv(uvFromWorld(voxelCenter), texel);
        vec4 voxelColor = texture2D(fullSceneTexture, voxelUv);
        if (voxelColor.a < 0.001) voxelColor = vec4(fallbackColor, 1.0);

        vec3 local = abs(fract(worldPos / voxelSizeSafe) - 0.5) * 2.0;
        float edge = max(local.x, max(local.y, local.z));
        float edgeMask = smoothstep(0.7, 0.98, edge);
        float edgeDarken = mix(1.0, 0.6, edgeMask);

        vec3 stylized = floor(voxelColor.rgb * 5.0) / 5.0;
        outputColor = vec4(stylized * shade * edgeDarken, 1.0);
      }
    }

    gl_FragColor = outputColor;

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function VoxelCensor({
  mode = 'voxelScreen',
  pixelSize = 8,
  voxelSize = 0.25,
  voxelSteps = 24,
  clipOffset = 0,
  children,
  ...props
}) {
  const meshRef = useRef();
  const { gl, scene, camera } = useThree();

  const renderTarget = useMemo(() => new THREE.WebGLRenderTarget(1, 1), []);
  const fullSceneRenderTarget = useMemo(
    () => new THREE.WebGLRenderTarget(1, 1),
    []
  );
  const sizeVec = useMemo(() => new THREE.Vector2(), []);
  const clearColor = useMemo(() => new THREE.Color(), []);
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const cameraWorldPos = useMemo(() => new THREE.Vector3(), []);
  const clipPlane = useMemo(() => new THREE.Plane(), []);
  const viewProjectionMatrix = useMemo(() => new THREE.Matrix4(), []);

  const effectModeByName = {
    voxelScreen: 1,
    voxelRaymarch: 2,
    voxelInstanced: 3,
  };

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          sceneTexture: { value: null },
          sceneDepthTexture: { value: null },
          fullSceneTexture: { value: null },
          fallbackColor: { value: new THREE.Color(1, 1, 1) },
          resolution: { value: new THREE.Vector2() },
          pixelSize: { value: pixelSize },
          effectMode: { value: 1 },
          voxelWorldSize: { value: voxelSize },
          voxelSteps: { value: voxelSteps },
          projectionMatrixInverse: { value: new THREE.Matrix4() },
          viewMatrixInverse: { value: new THREE.Matrix4() },
          viewProjectionMatrix: { value: new THREE.Matrix4() },
          cameraWorldPos: { value: new THREE.Vector3() },
        },
        transparent: false,
        depthWrite: true,
      }),
    [] // eslint-disable-line
  );

  useEffect(() => {
    renderTarget.depthTexture = new THREE.DepthTexture(1, 1);
    renderTarget.depthTexture.type = THREE.UnsignedShortType;
  }, [renderTarget]);

  useEffect(() => {
    return () => {
      renderTarget.dispose();
      fullSceneRenderTarget.dispose();
      material.dispose();
    };
  }, [renderTarget, fullSceneRenderTarget, material]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    gl.getDrawingBufferSize(sizeVec);
    if (renderTarget.width !== sizeVec.x || renderTarget.height !== sizeVec.y) {
      renderTarget.setSize(sizeVec.x, sizeVec.y);
      fullSceneRenderTarget.setSize(sizeVec.x, sizeVec.y);
    }

    material.uniforms.pixelSize.value = pixelSize;
    material.uniforms.effectMode.value = effectModeByName[mode] ?? 1;
    material.uniforms.voxelWorldSize.value = voxelSize;
    material.uniforms.voxelSteps.value = voxelSteps;
    material.uniforms.resolution.value.copy(sizeVec);
    material.uniforms.projectionMatrixInverse.value.copy(
      camera.projectionMatrixInverse
    );
    material.uniforms.viewMatrixInverse.value.copy(camera.matrixWorld);
    viewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    material.uniforms.viewProjectionMatrix.value.copy(viewProjectionMatrix);
    camera.getWorldPosition(cameraWorldPos);
    material.uniforms.cameraWorldPos.value.copy(cameraWorldPos);

    mesh.getWorldPosition(worldPos);
    camera.getWorldDirection(camDir);
    clipPlane.setFromNormalAndCoplanarPoint(camDir, worldPos);
    clipPlane.constant += clipOffset;

    mesh.visible = false;
    const savedClip = gl.clippingPlanes;

    const savedToneMapping = gl.toneMapping;
    gl.toneMapping = THREE.NoToneMapping;
    const savedClearAlpha = gl.getClearAlpha();
    gl.getClearColor(clearColor);
    if (scene.background && scene.background.isColor) {
      material.uniforms.fallbackColor.value.copy(scene.background);
    } else {
      material.uniforms.fallbackColor.value.setRGB(1, 1, 1);
    }

    const previousRT = gl.getRenderTarget();

    gl.setClearColor(clearColor, savedClearAlpha);
    gl.clippingPlanes = [];
    gl.setRenderTarget(fullSceneRenderTarget);
    gl.clear();
    gl.render(scene, camera);

    gl.setClearColor(0x000000, 0);
    gl.clippingPlanes = [clipPlane];
    gl.setRenderTarget(renderTarget);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(previousRT);

    gl.toneMapping = savedToneMapping;
    gl.setClearColor(clearColor, savedClearAlpha);
    gl.clippingPlanes = savedClip;
    mesh.visible = true;

    material.uniforms.sceneTexture.value = renderTarget.texture;
    material.uniforms.sceneDepthTexture.value = renderTarget.depthTexture;
    material.uniforms.fullSceneTexture.value = fullSceneRenderTarget.texture;
  });

  return (
    <mesh ref={meshRef} material={material} {...props}>
      {children}
    </mesh>
  );
}
