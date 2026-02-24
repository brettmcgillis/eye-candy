import * as THREE from 'three';

import React, { useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

function buildExplodedGeometryData(sourceGeometry) {
  const geometry = sourceGeometry.toNonIndexed();
  const base = Float32Array.from(geometry.attributes.position.array);
  const vertexCount = base.length / 3;
  const triCount = vertexCount / 3;

  const normals = new Float32Array(base.length);
  const triCenters = new Float32Array(base.length);
  const dataUvs = new Float32Array(vertexCount * 2);
  const random = new Float32Array(triCount);

  const edgeA = new THREE.Vector3();
  const edgeB = new THREE.Vector3();
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let tri = 0; tri < triCount; tri += 1) {
    const triStart = tri * 9;
    v0.set(base[triStart], base[triStart + 1], base[triStart + 2]);
    v1.set(base[triStart + 3], base[triStart + 4], base[triStart + 5]);
    v2.set(base[triStart + 6], base[triStart + 7], base[triStart + 8]);

    edgeA.subVectors(v1, v0);
    edgeB.subVectors(v2, v0);
    normal.crossVectors(edgeA, edgeB).normalize();
    const triRandom = Math.random();
    random[tri] = triRandom;

    const centerX = (v0.x + v1.x + v2.x) / 3;
    const centerY = (v0.y + v1.y + v2.y) / 3;
    const centerZ = (v0.z + v1.z + v2.z) / 3;

    for (let point = 0; point < 3; point += 1) {
      const vertexStart = triStart + point * 3;
      normals[vertexStart] = normal.x;
      normals[vertexStart + 1] = normal.y;
      normals[vertexStart + 2] = normal.z;
      triCenters[vertexStart] = centerX;
      triCenters[vertexStart + 1] = centerY;
      triCenters[vertexStart + 2] = centerZ;
    }
  }

  const textureSize = Math.ceil(Math.sqrt(vertexCount));
  const posData = new Float32Array(textureSize * textureSize * 4);
  const normalData = new Float32Array(textureSize * textureSize * 4);

  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const positionStart = vertex * 3;
    const uvStart = vertex * 2;
    const texelStart = vertex * 4;
    const x = vertex % textureSize;
    const y = Math.floor(vertex / textureSize);
    const tri = Math.floor(vertex / 3);

    posData[texelStart] = base[positionStart];
    posData[texelStart + 1] = base[positionStart + 1];
    posData[texelStart + 2] = base[positionStart + 2];
    posData[texelStart + 3] = 1;

    normalData[texelStart] = normals[positionStart];
    normalData[texelStart + 1] = normals[positionStart + 1];
    normalData[texelStart + 2] = normals[positionStart + 2];
    normalData[texelStart + 3] = random[tri];

    dataUvs[uvStart] = (x + 0.5) / textureSize;
    dataUvs[uvStart + 1] = (y + 0.5) / textureSize;
  }

  const positionTexture = new THREE.DataTexture(
    posData,
    textureSize,
    textureSize,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  positionTexture.needsUpdate = true;
  positionTexture.magFilter = THREE.NearestFilter;
  positionTexture.minFilter = THREE.NearestFilter;
  positionTexture.generateMipmaps = false;
  positionTexture.flipY = false;

  const normalTexture = new THREE.DataTexture(
    normalData,
    textureSize,
    textureSize,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  normalTexture.needsUpdate = true;
  normalTexture.magFilter = THREE.NearestFilter;
  normalTexture.minFilter = THREE.NearestFilter;
  normalTexture.generateMipmaps = false;
  normalTexture.flipY = false;

  geometry.setAttribute('aDataUv', new THREE.BufferAttribute(dataUvs, 2));
  geometry.setAttribute('aTriCenter', new THREE.BufferAttribute(triCenters, 3));

  return { geometry, positionTexture, normalTexture };
}

export default function ExplodableGroup({
  children,
  explodeStrength,
  pointerRadius,
  falloff,
  shakeAmount,
  shakeSpeed,
  returnSpeed,
  motionBoost,
  damping,
  showPointerRadiusDebug,
  ...props
}) {
  const groupRef = useRef(null);
  const debugSphereRef = useRef(null);
  const meshStateMapRef = useRef(new Map());
  const activeMeshRef = useRef(null);
  const hoveringRef = useRef(false);
  const worldPointerRef = useRef(new THREE.Vector3(9999, 9999, 9999));
  const worldPointerSmoothRef = useRef(new THREE.Vector3(9999, 9999, 9999));

  useEffect(() => {
    if (!groupRef.current) return undefined;
    const meshStateMap = meshStateMapRef.current;
    const disposers = [];

    groupRef.current.traverse((node) => {
      const meshNode = node;
      if (
        !meshNode.isMesh ||
        !meshNode.geometry ||
        Array.isArray(meshNode.material)
      ) {
        return;
      }

      const originalGeometry = meshNode.geometry;
      const originalMaterial = meshNode.material;
      const { geometry, positionTexture, normalTexture } =
        buildExplodedGeometryData(originalGeometry);
      const material = originalMaterial.clone();
      const shaderState = { shader: null };

      material.side = THREE.DoubleSide;
      material.onBeforeCompile = (incomingShader) => {
        const shader = incomingShader;
        shaderState.shader = shader;
        shader.uniforms.uPositionTex = { value: positionTexture };
        shader.uniforms.uNormalTex = { value: normalTexture };
        shader.uniforms.uPointer = {
          value: new THREE.Vector3(9999, 9999, 9999),
        };
        shader.uniforms.uEffectRadius = { value: pointerRadius };
        shader.uniforms.uExplodeStrength = { value: explodeStrength };
        shader.uniforms.uFalloff = { value: falloff };
        shader.uniforms.uShakeAmount = { value: shakeAmount };
        shader.uniforms.uShakeSpeed = { value: shakeSpeed };
        shader.uniforms.uHover = { value: 0 };
        shader.uniforms.uMoveEnergy = { value: 0 };
        shader.uniforms.uTime = { value: 0 };

        shader.vertexShader = `
          attribute vec2 aDataUv;
          attribute vec3 aTriCenter;
          uniform sampler2D uPositionTex;
          uniform sampler2D uNormalTex;
          uniform vec3 uPointer;
          uniform float uEffectRadius;
          uniform float uExplodeStrength;
          uniform float uFalloff;
          uniform float uShakeAmount;
          uniform float uShakeSpeed;
          uniform float uHover;
          uniform float uMoveEnergy;
          uniform float uTime;
        ${shader.vertexShader}`.replace(
          '#include <begin_vertex>',
          `
          vec3 basePos = texture2D(uPositionTex, aDataUv).xyz;
          vec4 normalRand = texture2D(uNormalTex, aDataUv);
          vec3 triNormal = normalize(normalRand.xyz);
          vec3 centerDir = normalize(aTriCenter);
          vec3 explodeDir = normalize(mix(triNormal, centerDir, 0.6));
          float triRand = normalRand.w;
          float safeRadius = max(0.0001, uEffectRadius);
          float dist = distance(aTriCenter, uPointer);
          float inRange = step(dist, safeRadius);
          float edgeBlend = max(0.0, 1.0 - dist / safeRadius);
          float localInfluence = inRange * pow(edgeBlend, max(1.0, uFalloff * 4.0));
          float shake = uHover * localInfluence * uShakeAmount * sin(uTime * uShakeSpeed + triRand * 50.26548);
          float travel = uHover * uExplodeStrength * localInfluence * (0.35 + triRand * 0.95) * (0.5 + uMoveEnergy);
          float offset = travel + shake;
          vec3 triCenter = aTriCenter;
          vec3 triLocal = basePos - triCenter;
          float crack = max(0.0, offset) * 0.9;
          vec3 transformed = triCenter + triLocal * (1.0 + crack) + explodeDir * offset;
          `
        );
      };
      material.needsUpdate = true;

      meshNode.geometry = geometry;
      meshNode.material = material;

      meshStateMap.set(meshNode, {
        shaderState,
        pointerTarget: new THREE.Vector3(9999, 9999, 9999),
        pointerSmooth: new THREE.Vector3(9999, 9999, 9999),
        hoverAmount: 0,
        moveEnergy: 0,
        lastPointer: null,
        originalGeometry,
        originalMaterial,
        geometry,
        material,
        positionTexture,
        normalTexture,
      });

      disposers.push(() => {
        const state = meshStateMap.get(meshNode);
        if (!state) return;
        meshNode.geometry = state.originalGeometry;
        meshNode.material = state.originalMaterial;
        state.geometry.dispose();
        state.material.dispose();
        state.positionTexture.dispose();
        state.normalTexture.dispose();
        meshStateMap.delete(meshNode);
      });
    });

    return () => {
      disposers.forEach((dispose) => dispose());
    };
  }, []);

  useFrame((state, delta) => {
    const meshStateMap = meshStateMapRef.current;
    const activeMesh = activeMeshRef.current;

    meshStateMap.forEach((meshState, mesh) => {
      const stateRef = meshState;
      const isActive = hoveringRef.current && mesh === activeMesh;
      const hoverTarget = isActive ? 1 : 0;
      stateRef.hoverAmount = THREE.MathUtils.damp(
        stateRef.hoverAmount,
        hoverTarget,
        returnSpeed,
        delta
      );
      stateRef.moveEnergy = THREE.MathUtils.damp(
        stateRef.moveEnergy,
        0,
        damping,
        delta
      );
      stateRef.pointerSmooth.lerp(
        stateRef.pointerTarget,
        1 - Math.exp(-20 * delta)
      );

      const { shader } = stateRef.shaderState;
      if (!shader) return;
      shader.uniforms.uHover.value = stateRef.hoverAmount;
      shader.uniforms.uMoveEnergy.value = stateRef.moveEnergy;
      shader.uniforms.uPointer.value.copy(stateRef.pointerSmooth);
      shader.uniforms.uEffectRadius.value = pointerRadius;
      shader.uniforms.uExplodeStrength.value = explodeStrength;
      shader.uniforms.uFalloff.value = falloff;
      shader.uniforms.uShakeAmount.value = shakeAmount;
      shader.uniforms.uShakeSpeed.value = shakeSpeed;
      shader.uniforms.uTime.value = state.clock.getElapsedTime();
    });

    worldPointerSmoothRef.current.lerp(
      worldPointerRef.current,
      1 - Math.exp(-20 * delta)
    );

    if (!debugSphereRef.current || !groupRef.current) return;
    const showDebug =
      showPointerRadiusDebug &&
      hoveringRef.current &&
      worldPointerSmoothRef.current.lengthSq() < 10000;
    debugSphereRef.current.visible = showDebug;
    if (showDebug) {
      const local = groupRef.current.worldToLocal(
        worldPointerSmoothRef.current.clone()
      );
      debugSphereRef.current.position.copy(local);
      debugSphereRef.current.scale.setScalar(pointerRadius);
    }
  });

  return (
    <group
      ref={groupRef}
      {...props}
      onPointerMove={(event) => {
        if (!event.object?.isMesh) return;
        const state = meshStateMapRef.current.get(event.object);
        if (!state) return;
        event.stopPropagation();

        hoveringRef.current = true;
        activeMeshRef.current = event.object;
        worldPointerRef.current.copy(event.point);

        const localPoint = event.object.worldToLocal(event.point.clone());
        state.pointerTarget.copy(localPoint);
        if (!state.lastPointer) {
          state.pointerSmooth.copy(localPoint);
          state.lastPointer = localPoint.clone();
          state.moveEnergy = 0.4;
          return;
        }

        const movement = localPoint.distanceTo(state.lastPointer);
        state.moveEnergy = Math.min(
          2.5,
          state.moveEnergy + movement * motionBoost
        );
        state.lastPointer.copy(localPoint);
      }}
      onPointerLeave={() => {
        hoveringRef.current = false;
        activeMeshRef.current = null;
        worldPointerRef.current.set(9999, 9999, 9999);
        meshStateMapRef.current.forEach((meshState) => {
          const stateRef = meshState;
          stateRef.pointerTarget.set(9999, 9999, 9999);
          stateRef.lastPointer = null;
        });
      }}
    >
      {children}
      <mesh ref={debugSphereRef} visible={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ff2d2d"
          wireframe
          toneMapped={false}
          depthTest={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
