import * as THREE from 'three';

import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

const vertexShader = /* glsl */ `
  varying vec3 vCenterWorld;
  varying vec3 vNormalWorld;

  void main() {
    vec4 centerWorld = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vCenterWorld = centerWorld.xyz;

    mat3 iMat = mat3(modelMatrix * instanceMatrix);
    vNormalWorld = normalize(iMat * normal);

    vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D clippedSceneTexture;
  uniform sampler2D fullSceneTexture;
  uniform vec2 resolution;
  uniform vec3 fallbackColor;
  uniform mat4 viewProjectionMatrix;
  uniform vec3 cameraWorldPos;
  varying vec3 vCenterWorld;
  varying vec3 vNormalWorld;

  vec2 clampUv(vec2 uv, vec2 texel) {
    return clamp(uv, texel * 0.5, vec2(1.0) - texel * 0.5);
  }

  void main() {
    vec2 texel = 1.0 / resolution;

    vec4 clip = viewProjectionMatrix * vec4(vCenterWorld, 1.0);
    vec2 ndc = clip.xy / max(clip.w, 0.000001);
    vec2 uv = clampUv(ndc * 0.5 + 0.5, texel);

    vec4 color = texture2D(clippedSceneTexture, uv);
    if (color.a < 0.001) {
      color = texture2D(fullSceneTexture, uv);
    }
    if (color.a < 0.001) {
      color = vec4(fallbackColor, 1.0);
    }

    vec3 toCamera = normalize(cameraWorldPos - vCenterWorld);
    float light = 0.55 + 0.45 * max(dot(normalize(vNormalWorld), toCamera), 0.0);

    gl_FragColor = vec4(color.rgb * light, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function VoxelInstancedCensor({
  voxelSize = 0.25,
  maxInstances = 4096,
  clipOffset = 0,
  children,
  ...props
}) {
  const groupRef = useRef();
  const shapeRef = useRef();
  const instancesRef = useRef();

  const { gl, scene, camera } = useThree();

  const clippedTarget = useMemo(() => new THREE.WebGLRenderTarget(1, 1), []);
  const fullSceneTarget = useMemo(() => new THREE.WebGLRenderTarget(1, 1), []);

  const cubeGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const sizeVec = useMemo(() => new THREE.Vector2(), []);
  const clearColor = useMemo(() => new THREE.Color(), []);
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const cameraWorldPos = useMemo(() => new THREE.Vector3(), []);
  const clipPlane = useMemo(() => new THREE.Plane(), []);
  const viewProjectionMatrix = useMemo(() => new THREE.Matrix4(), []);

  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const bboxSize = useMemo(() => new THREE.Vector3(), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          clippedSceneTexture: { value: null },
          fullSceneTexture: { value: null },
          resolution: { value: new THREE.Vector2() },
          fallbackColor: { value: new THREE.Color(1, 1, 1) },
          viewProjectionMatrix: { value: new THREE.Matrix4() },
          cameraWorldPos: { value: new THREE.Vector3() },
        },
        transparent: false,
        depthWrite: true,
      }),
    [] // eslint-disable-line
  );

  useEffect(() => {
    return () => {
      clippedTarget.dispose();
      fullSceneTarget.dispose();
      cubeGeometry.dispose();
      material.dispose();
    };
  }, [clippedTarget, fullSceneTarget, cubeGeometry, material]);

  useLayoutEffect(() => {
    const shapeMesh = shapeRef.current;
    const instancedMesh = instancesRef.current;
    if (!shapeMesh || !instancedMesh || !shapeMesh.geometry) return;

    shapeMesh.geometry.computeBoundingBox();
    const bbox = shapeMesh.geometry.boundingBox;
    if (!bbox) return;

    bbox.getSize(bboxSize);

    const safeVoxel = Math.max(voxelSize, 0.02);
    const estimated =
      Math.ceil(bboxSize.x / safeVoxel) *
      Math.ceil(bboxSize.y / safeVoxel) *
      Math.ceil(bboxSize.z / safeVoxel);

    const stride =
      estimated > maxInstances
        ? Math.ceil(Math.cbrt(estimated / maxInstances))
        : 1;
    const step = safeVoxel * stride;
    const cubeScale = step * 0.9;

    let index = 0;
    for (let x = bbox.min.x + step * 0.5; x <= bbox.max.x; x += step) {
      for (let y = bbox.min.y + step * 0.5; y <= bbox.max.y; y += step) {
        for (let z = bbox.min.z + step * 0.5; z <= bbox.max.z; z += step) {
          if (index >= maxInstances) break;
          tempObject.position.set(x, y, z);
          tempObject.scale.set(cubeScale, cubeScale, cubeScale);
          tempObject.rotation.set(0, 0, 0);
          tempObject.updateMatrix();
          instancedMesh.setMatrixAt(index, tempObject.matrix);
          index += 1;
        }
      }
    }

    instancedMesh.count = index;
    instancedMesh.instanceMatrix.needsUpdate = true;
  }, [voxelSize, maxInstances, tempObject, bboxSize]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    gl.getDrawingBufferSize(sizeVec);
    if (
      clippedTarget.width !== sizeVec.x ||
      clippedTarget.height !== sizeVec.y
    ) {
      clippedTarget.setSize(sizeVec.x, sizeVec.y);
      fullSceneTarget.setSize(sizeVec.x, sizeVec.y);
    }

    material.uniforms.resolution.value.copy(sizeVec);
    viewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    material.uniforms.viewProjectionMatrix.value.copy(viewProjectionMatrix);
    camera.getWorldPosition(cameraWorldPos);
    material.uniforms.cameraWorldPos.value.copy(cameraWorldPos);

    group.getWorldPosition(worldPos);
    camera.getWorldDirection(camDir);
    clipPlane.setFromNormalAndCoplanarPoint(camDir, worldPos);
    clipPlane.constant += clipOffset;

    const previousRT = gl.getRenderTarget();
    const savedClip = gl.clippingPlanes;
    const savedToneMapping = gl.toneMapping;
    const savedClearAlpha = gl.getClearAlpha();
    gl.getClearColor(clearColor);

    gl.toneMapping = THREE.NoToneMapping;

    if (scene.background && scene.background.isColor) {
      material.uniforms.fallbackColor.value.copy(scene.background);
    } else {
      material.uniforms.fallbackColor.value.setRGB(1, 1, 1);
    }

    group.visible = false;

    gl.setClearColor(clearColor, savedClearAlpha);
    gl.clippingPlanes = [];
    gl.setRenderTarget(fullSceneTarget);
    gl.clear();
    gl.render(scene, camera);

    gl.setClearColor(0x000000, 0);
    gl.clippingPlanes = [clipPlane];
    gl.setRenderTarget(clippedTarget);
    gl.clear();
    gl.render(scene, camera);

    gl.setRenderTarget(previousRT);
    gl.clippingPlanes = savedClip;
    gl.toneMapping = savedToneMapping;
    gl.setClearColor(clearColor, savedClearAlpha);

    group.visible = true;

    material.uniforms.clippedSceneTexture.value = clippedTarget.texture;
    material.uniforms.fullSceneTexture.value = fullSceneTarget.texture;
  });

  return (
    <group ref={groupRef} {...props}>
      <mesh ref={shapeRef} visible={false}>
        {children}
      </mesh>

      <instancedMesh
        ref={instancesRef}
        args={[cubeGeometry, material, maxInstances]}
        frustumCulled={false}
      />
    </group>
  );
}
