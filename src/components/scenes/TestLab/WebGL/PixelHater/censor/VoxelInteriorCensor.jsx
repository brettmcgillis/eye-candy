import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

const vertexShader = /* glsl */ `
  varying vec3 vCenterWorld;

  void main() {
    vec4 centerWorld = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vCenterWorld = centerWorld.xyz;

    vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D fullSceneTexture;
  uniform vec2 resolution;
  uniform vec3 fallbackColor;
  uniform mat4 viewProjectionMatrix;
  varying vec3 vCenterWorld;

  vec2 clampUv(vec2 uv, vec2 texel) {
    return clamp(uv, texel * 0.5, vec2(1.0) - texel * 0.5);
  }

  void main() {
    vec2 texel = 1.0 / resolution;

    vec4 clip = viewProjectionMatrix * vec4(vCenterWorld, 1.0);
    vec2 ndc = clip.xy / max(clip.w, 0.000001);
    vec2 uv = clampUv(ndc * 0.5 + 0.5, texel);

    vec4 color = texture2D(fullSceneTexture, uv);
    if (color.a < 0.001) {
      color = vec4(fallbackColor, 1.0);
    }

    gl_FragColor = vec4(color.rgb, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const LOCAL_VOXEL_BOX = new THREE.Box3(
  new THREE.Vector3(-0.5, -0.5, -0.5),
  new THREE.Vector3(0.5, 0.5, 0.5)
);

const bvhCache = new WeakMap();

function getBvh(geometry) {
  let bvh = bvhCache.get(geometry);
  if (!bvh) {
    bvh = new MeshBVH(geometry);
    bvhCache.set(geometry, bvh);
  }
  return bvh;
}

function isMeshDescendant(root, candidate) {
  let current = candidate;
  while (current) {
    if (current === root) return true;
    current = current.parent;
  }
  return false;
}

export default function VoxelInteriorCensor({
  voxelSize = 0.25,
  cornerRadius = 0,
  insideOnly = false,
  maxInstances = 8192,
  children,
  ...props
}) {
  const groupRef = useRef();
  const shapeRef = useRef();
  const instancesRef = useRef();

  const { gl, scene, camera } = useThree();

  const fullSceneTarget = useMemo(() => new THREE.WebGLRenderTarget(1, 1), []);
  const sizeVec = useMemo(() => new THREE.Vector2(), []);
  const clearColor = useMemo(() => new THREE.Color(), []);
  const viewProjectionMatrix = useMemo(() => new THREE.Matrix4(), []);

  const cubeGeometry = useMemo(() => {
    if (cornerRadius > 0) {
      return new RoundedBoxGeometry(1, 1, 1, 4, Math.min(cornerRadius, 0.49));
    }
    return new THREE.BoxGeometry(1, 1, 1);
  }, [cornerRadius]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          fullSceneTexture: { value: null },
          resolution: { value: new THREE.Vector2() },
          fallbackColor: { value: new THREE.Color(1, 1, 1) },
          viewProjectionMatrix: { value: new THREE.Matrix4() },
        },
        transparent: false,
        depthWrite: true,
      }),
    []
  );

  useEffect(() => {
    if (instancesRef.current) {
      instancesRef.current.geometry = cubeGeometry;
    }
  }, [cubeGeometry]);

  useEffect(() => {
    return () => {
      fullSceneTarget.dispose();
      cubeGeometry.dispose();
      material.dispose();
    };
  }, [fullSceneTarget, cubeGeometry, material]);

  // Demo-like voxelization: sample scene geometry occupancy inside container bounds.
  useLayoutEffect(() => {
    const shapeMesh = shapeRef.current;
    const instancedMesh = instancesRef.current;
    const group = groupRef.current;

    if (!shapeMesh || !instancedMesh || !group || !shapeMesh.geometry) return;

    shapeMesh.updateWorldMatrix(true, false);
    shapeMesh.geometry.computeBoundingBox();
    const bbox = shapeMesh.geometry.boundingBox;
    if (!bbox) return;

    const containerWorldBox = bbox.clone().applyMatrix4(shapeMesh.matrixWorld);
    const sourceWorldBox = new THREE.Box3();
    const voxelSources = [];
    scene.traverse((obj) => {
      if (!obj.isMesh) return;
      if (!obj.visible) return;
      if (!obj.geometry || !obj.geometry.attributes?.position) return;
      if (isMeshDescendant(group, obj)) return;

      if (!obj.geometry.boundingBox) {
        obj.geometry.computeBoundingBox();
      }
      if (!obj.geometry.boundingBox) return;

      sourceWorldBox
        .copy(obj.geometry.boundingBox)
        .applyMatrix4(obj.matrixWorld);
      if (!sourceWorldBox.intersectsBox(containerWorldBox)) return;

      const bvh = getBvh(obj.geometry);
      voxelSources.push({
        bvh,
        worldToLocal: new THREE.Matrix4().copy(obj.matrixWorld).invert(),
      });
    });

    if (voxelSources.length === 0) {
      instancedMesh.count = 0;
      instancedMesh.instanceMatrix.needsUpdate = true;
      return;
    }

    const safeVoxel = Math.max(voxelSize, 0.01);
    const size = bbox.getSize(new THREE.Vector3());
    const estimatedCellCount =
      Math.ceil(size.x / safeVoxel) *
      Math.ceil(size.y / safeVoxel) *
      Math.ceil(size.z / safeVoxel);
    const maxProbeCells = Math.max(maxInstances * 4, 20000);
    const stride =
      estimatedCellCount > maxProbeCells
        ? Math.ceil(Math.cbrt(estimatedCellCount / maxProbeCells))
        : 1;
    const step = safeVoxel * stride;

    const localPos = new THREE.Vector3();
    const worldPos = new THREE.Vector3();
    const localVoxelMatrix = new THREE.Matrix4();
    const worldVoxelMatrix = new THREE.Matrix4();
    const boxToMeshLocal = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3().setScalar(step);
    const ray = new THREE.Ray();
    ray.direction.set(0, 0, 1);

    let count = 0;
    let reachedLimit = false;

    for (let x = bbox.min.x + step * 0.5; x <= bbox.max.x; x += step) {
      for (let y = bbox.min.y + step * 0.5; y <= bbox.max.y; y += step) {
        for (let z = bbox.min.z + step * 0.5; z <= bbox.max.z; z += step) {
          if (count >= maxInstances) {
            reachedLimit = true;
            break;
          }

          localPos.set(x, y, z);
          localVoxelMatrix.compose(localPos, quat, scale);
          worldVoxelMatrix.multiplyMatrices(
            shapeMesh.matrixWorld,
            localVoxelMatrix
          );

          worldPos.copy(localPos);
          shapeMesh.localToWorld(worldPos);

          let surfaceHit = false;
          let insideHit = false;

          for (let i = 0; i < voxelSources.length; i += 1) {
            const source = voxelSources[i];

            boxToMeshLocal.multiplyMatrices(
              source.worldToLocal,
              worldVoxelMatrix
            );
            if (source.bvh.intersectsBox(LOCAL_VOXEL_BOX, boxToMeshLocal)) {
              surfaceHit = true;
            }

            if (!surfaceHit || insideOnly) {
              ray.origin.copy(worldPos).applyMatrix4(source.worldToLocal);
              const hit = source.bvh.raycastFirst(ray, THREE.DoubleSide);
              if (hit && hit.face.normal.dot(ray.direction) > 0.0) {
                insideHit = true;
              }
            }

            if (surfaceHit && insideHit) break;
          }

          if ((surfaceHit && !insideOnly) || insideHit) {
            instancedMesh.setMatrixAt(count, localVoxelMatrix);
            count += 1;
          }
        }
        if (reachedLimit) break;
      }
      if (reachedLimit) break;
    }

    instancedMesh.count = count;
    instancedMesh.instanceMatrix.needsUpdate = true;
  }, [voxelSize, insideOnly, maxInstances, scene]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    gl.getDrawingBufferSize(sizeVec);
    if (
      fullSceneTarget.width !== sizeVec.x ||
      fullSceneTarget.height !== sizeVec.y
    ) {
      fullSceneTarget.setSize(sizeVec.x, sizeVec.y);
    }

    material.uniforms.resolution.value.copy(sizeVec);
    viewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    material.uniforms.viewProjectionMatrix.value.copy(viewProjectionMatrix);

    const previousRT = gl.getRenderTarget();
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
    gl.setRenderTarget(fullSceneTarget);
    gl.clear();
    gl.render(scene, camera);

    gl.setRenderTarget(previousRT);
    gl.toneMapping = savedToneMapping;
    gl.setClearColor(clearColor, savedClearAlpha);

    group.visible = true;

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
