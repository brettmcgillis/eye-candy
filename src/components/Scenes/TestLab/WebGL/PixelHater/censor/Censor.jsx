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

    vec3 color = texture2D(sceneTexture, uvQuantized).rgb;
    gl_FragColor = vec4(color, 1.0);
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
  const sizeVec = useMemo(() => new THREE.Vector2(), []);
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
          resolution: { value: new THREE.Vector2() },
          pixelSize: { value: pixelSize },
          refractionStrength: { value: refraction },
        },
        depthWrite: true,
      }),
    [] // eslint-disable-line
  );

  useEffect(() => {
    return () => {
      renderTarget.dispose();
      material.dispose();
    };
  }, [renderTarget, material]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    gl.getDrawingBufferSize(sizeVec);
    if (renderTarget.width !== sizeVec.x || renderTarget.height !== sizeVec.y) {
      renderTarget.setSize(sizeVec.x, sizeVec.y);
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
    gl.clippingPlanes = [clipPlane];

    // Disable tone mapping during FBO render so we capture raw linear values.
    // The ShaderMaterial applies tonemapping + colorspace in its fragment shader
    // to avoid double-tonemapping (which causes darkening).
    const savedToneMapping = gl.toneMapping;
    gl.toneMapping = THREE.NoToneMapping;

    const previousRT = gl.getRenderTarget();
    gl.setRenderTarget(renderTarget);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(previousRT);

    gl.toneMapping = savedToneMapping;
    gl.clippingPlanes = savedClip;
    mesh.visible = true;

    material.uniforms.sceneTexture.value = renderTarget.texture;
  });

  return (
    <mesh ref={meshRef} material={material} {...props}>
      {children}
    </mesh>
  );
}
