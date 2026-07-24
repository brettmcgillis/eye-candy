import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

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
  uniform float refractionStrength;
  varying vec3 vViewNormal;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    // Normal-based refraction offset (simulates glass distortion)
    uv += vViewNormal.xy * refractionStrength;

    // Quantize: pixelSize is block size in pixels.
    // Dividing screen resolution by block size gives block count per axis,
    // naturally preserving aspect ratio (isotropic cells).
    vec2 blockCount = resolution / vec2(pixelSize);
    vec2 uvQuantized = round(uv * blockCount) / blockCount;
    vec2 texel = 1.0 / resolution;
    uvQuantized = clamp(uvQuantized, texel * 0.5, vec2(1.0) - texel * 0.5);

    vec2 uvBaseQuantized = round((gl_FragCoord.xy / resolution) * blockCount) / blockCount;
    uvBaseQuantized = clamp(uvBaseQuantized, texel * 0.5, vec2(1.0) - texel * 0.5);

    vec4 sampleColor = texture2D(sceneTexture, uvQuantized);
    float clippedDepth = texture2D(sceneDepthTexture, uvQuantized).x;

    // Clear depth is 1.0; if depth is at far plane, clipped pass had no geometry.
    if (clippedDepth >= 0.999999) {
      sampleColor = texture2D(fullSceneTexture, uvBaseQuantized);
    }

    // If refracted lookup lands in an empty/transparent texel, fall back to
    // the non-refracted quantized sample to avoid see-through gaps.
    if (sampleColor.a < 0.001) {
      sampleColor = texture2D(sceneTexture, uvBaseQuantized);
    }

    // If clipped captures are empty, fall back to full-scene sample.
    if (sampleColor.a < 0.001) {
      sampleColor = texture2D(fullSceneTexture, uvBaseQuantized);
    }

    // Final guard: if no valid texel exists in either capture, use scene clear color.
    if (sampleColor.a < 0.001) {
      sampleColor = vec4(fallbackColor, 1.0);
    }

    gl_FragColor = vec4(sampleColor.rgb, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Self-contained CENSOR pixelation mesh (forward-rendered, no postprocessing).
 * Place in scene with a geometry child — everything behind it gets pixelated.
 * Uses a clipping plane during the FBO render so only objects behind the
 * censor surface are captured — foreground objects never bleed through.
 *
 *   <Censor pixelSize={8} refraction={0.02} position={[0, 0, 0]}>
 *     <boxGeometry args={[1, 1, 1]} />
 *   </Censor>
 */
export default function Censor({
  pixelSize = 8,
  refraction = 0,
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
  const clipPlane = useMemo(() => new THREE.Plane(), []);

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
          refractionStrength: { value: refraction },
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
    material.uniforms.refractionStrength.value = refraction;
    material.uniforms.resolution.value.copy(sizeVec);

    // Clip plane at the censor mesh's position, facing the camera.
    // This ensures the FBO only captures objects behind the censor surface.
    // clipOffset shifts the boundary toward the camera (positive = closer to camera),
    // useful for volumetric shapes where you want to include geometry inside the mesh.
    mesh.getWorldPosition(worldPos);
    camera.getWorldDirection(camDir);
    clipPlane.setFromNormalAndCoplanarPoint(camDir, worldPos);
    clipPlane.constant += clipOffset;

    mesh.visible = false;
    const savedClip = gl.clippingPlanes;

    // Disable tone mapping during FBO render so we capture raw linear values.
    // The ShaderMaterial applies tonemapping + colorspace in its fragment shader
    // to avoid double-tonemapping (which causes darkening).
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

    // Full scene capture should match normal scene rendering.
    gl.setClearColor(clearColor, savedClearAlpha);
    gl.clippingPlanes = [];
    gl.setRenderTarget(fullSceneRenderTarget);
    gl.clear();
    gl.render(scene, camera);

    // Clipped capture for "behind censor" content uses transparent clear so
    // empty texels are detectable in shader fallback logic.
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
