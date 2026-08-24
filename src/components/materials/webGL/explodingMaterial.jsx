import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

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

const EXPLOSION_VERTEX_HEADER = `
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
`;

const EXPLOSION_VERTEX_TRANSFORM = `
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
`;

function createMaterial(type, props) {
  const base = {
    side: THREE.DoubleSide,
    flatShading: props.flatShading,
    wireframe: props.wireframe,
  };
  switch (type) {
    case 'Physical':
      return new THREE.MeshPhysicalMaterial({
        ...base,
        color: props.color,
        roughness: props.roughness,
        metalness: props.metalness,
        clearcoat: props.clearcoat,
        clearcoatRoughness: props.clearcoatRoughness,
        sheen: props.sheen,
        sheenRoughness: props.sheenRoughness,
        sheenColor: props.sheenColor,
        iridescence: props.iridescence,
        iridescenceIOR: props.iridescenceIOR,
        emissive: props.emissive,
        emissiveIntensity: props.emissiveIntensity,
      });
    case 'Phong':
      return new THREE.MeshPhongMaterial({
        ...base,
        color: props.color,
        shininess: props.shininess,
        specular: props.specular,
        emissive: props.emissive,
        emissiveIntensity: props.emissiveIntensity,
      });
    case 'Lambert':
      return new THREE.MeshLambertMaterial({
        ...base,
        color: props.color,
        emissive: props.emissive,
        emissiveIntensity: props.emissiveIntensity,
      });
    case 'Toon':
      return new THREE.MeshToonMaterial({
        ...base,
        color: props.color,
        emissive: props.emissive,
        emissiveIntensity: props.emissiveIntensity,
      });
    case 'Basic':
      return new THREE.MeshBasicMaterial({ ...base, color: props.color });
    case 'Normal':
      return new THREE.MeshNormalMaterial({ ...base });
    case 'Matcap':
      return new THREE.MeshMatcapMaterial({ ...base, color: props.color });
    case 'Standard':
    default:
      return new THREE.MeshStandardMaterial({
        ...base,
        color: props.color,
        roughness: props.roughness,
        metalness: props.metalness,
        emissive: props.emissive,
        emissiveIntensity: props.emissiveIntensity,
      });
  }
}

function applyExplosionShader(material, positionTexture, normalTexture) {
  const shaderState = { shader: null };
  const mat = material;
  mat.onBeforeCompile = (incomingShader) => {
    const shader = incomingShader;
    shaderState.shader = shader;
    shader.uniforms.uPositionTex = { value: positionTexture };
    shader.uniforms.uNormalTex = { value: normalTexture };
    shader.uniforms.uPointer = { value: new THREE.Vector3(9999, 9999, 9999) };
    shader.uniforms.uEffectRadius = { value: 0.45 };
    shader.uniforms.uExplodeStrength = { value: 0.3 };
    shader.uniforms.uFalloff = { value: 0.65 };
    shader.uniforms.uShakeAmount = { value: 0.025 };
    shader.uniforms.uShakeSpeed = { value: 18 };
    shader.uniforms.uHover = { value: 0 };
    shader.uniforms.uMoveEnergy = { value: 0 };
    shader.uniforms.uTime = { value: 0 };

    shader.vertexShader =
      `${EXPLOSION_VERTEX_HEADER}\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        EXPLOSION_VERTEX_TRANSFORM
      );
  };
  mat.needsUpdate = true;
  return shaderState;
}

const ExplodingMaterial = forwardRef(function ExplodingMaterial(
  {
    meshRef,
    materialType = 'Standard',
    color = '#ffffff',
    roughness = 0.35,
    metalness = 0.15,
    shininess = 30,
    specular = '#111111',
    clearcoat = 0,
    clearcoatRoughness = 0,
    emissive = '#000000',
    emissiveIntensity = 0,
    flatShading = false,
    wireframe = false,
    sheen = 0,
    sheenRoughness = 1,
    sheenColor = '#ffffff',
    iridescence = 0,
    iridescenceIOR = 1.3,
    explodeStrength = 0.3,
    pointerRadius = 0.45,
    falloff = 0.65,
    shakeAmount = 0.025,
    shakeSpeed = 18,
    returnSpeed = 10,
    motionBoost = 14,
    damping = 6,
  },
  ref
) {
  const shaderStateRef = useRef(null);
  const materialInstanceRef = useRef(null);
  const motionBoostRef = useRef(motionBoost);
  motionBoostRef.current = motionBoost;
  const stateRef = useRef({
    hoverAmount: 0,
    moveEnergy: 0,
    pointerTarget: new THREE.Vector3(9999, 9999, 9999),
    pointerSmooth: new THREE.Vector3(9999, 9999, 9999),
    lastPointer: null,
    hovering: false,
  });

  useImperativeHandle(
    ref,
    () => ({
      handlePointerMove(event) {
        const mesh = meshRef.current;
        if (!mesh) return;
        const st = stateRef.current;
        st.hovering = true;
        const localPoint = mesh.worldToLocal(event.point.clone());
        st.pointerTarget.copy(localPoint);
        if (!st.lastPointer) {
          st.pointerSmooth.copy(localPoint);
          st.lastPointer = localPoint.clone();
          st.moveEnergy = 0.4;
          return;
        }
        const movement = localPoint.distanceTo(st.lastPointer);
        st.moveEnergy = Math.min(
          2.5,
          st.moveEnergy + movement * motionBoostRef.current
        );
        st.lastPointer.copy(localPoint);
      },
      handlePointerLeave() {
        const st = stateRef.current;
        st.hovering = false;
        st.pointerTarget.set(9999, 9999, 9999);
        st.lastPointer = null;
      },
      get hovering() {
        return stateRef.current.hovering;
      },
      get pointerSmooth() {
        return stateRef.current.pointerSmooth;
      },
    }),
    []
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh?.geometry) return undefined;

    const originalGeometry = mesh.geometry;
    const originalMaterial = mesh.material;
    const { geometry, positionTexture, normalTexture } =
      buildExplodedGeometryData(originalGeometry);

    const material = createMaterial(materialType, {
      color,
      roughness,
      metalness,
      shininess,
      specular,
      clearcoat,
      clearcoatRoughness,
      emissive,
      emissiveIntensity,
      flatShading,
      wireframe,
      sheen,
      sheenRoughness,
      sheenColor,
      iridescence,
      iridescenceIOR,
    });
    const shaderState = applyExplosionShader(
      material,
      positionTexture,
      normalTexture
    );
    shaderStateRef.current = shaderState;
    materialInstanceRef.current = material;

    mesh.geometry = geometry;
    mesh.material = material;

    return () => {
      mesh.geometry = originalGeometry;
      mesh.material = originalMaterial;
      geometry.dispose();
      material.dispose();
      positionTexture.dispose();
      normalTexture.dispose();
    };
  }, [materialType]);

  useFrame((state, delta) => {
    const shaderState = shaderStateRef.current;
    const { shader } = shaderState || {};
    if (!shader) return;

    const st = stateRef.current;
    st.hoverAmount = THREE.MathUtils.damp(
      st.hoverAmount,
      st.hovering ? 1 : 0,
      returnSpeed,
      delta
    );
    st.moveEnergy = THREE.MathUtils.damp(st.moveEnergy, 0, damping, delta);
    st.pointerSmooth.lerp(st.pointerTarget, 1 - Math.exp(-20 * delta));

    shader.uniforms.uHover.value = st.hoverAmount;
    shader.uniforms.uMoveEnergy.value = st.moveEnergy;
    shader.uniforms.uPointer.value.copy(st.pointerSmooth);
    shader.uniforms.uEffectRadius.value = pointerRadius;
    shader.uniforms.uExplodeStrength.value = explodeStrength;
    shader.uniforms.uFalloff.value = falloff;
    shader.uniforms.uShakeAmount.value = shakeAmount;
    shader.uniforms.uShakeSpeed.value = shakeSpeed;
    shader.uniforms.uTime.value = state.clock.getElapsedTime();

    const mat = materialInstanceRef.current;
    if (!mat) return;
    if (mat.color) mat.color.set(color);
    if ('roughness' in mat) mat.roughness = roughness;
    if ('metalness' in mat) mat.metalness = metalness;
    if ('shininess' in mat) mat.shininess = shininess;
    if (mat.specular) mat.specular.set(specular);
    if ('clearcoat' in mat) mat.clearcoat = clearcoat;
    if ('clearcoatRoughness' in mat)
      mat.clearcoatRoughness = clearcoatRoughness;
    if (mat.emissive) mat.emissive.set(emissive);
    if ('emissiveIntensity' in mat) mat.emissiveIntensity = emissiveIntensity;
    if ('wireframe' in mat) mat.wireframe = wireframe;
    if ('sheen' in mat) mat.sheen = sheen;
    if ('sheenRoughness' in mat) mat.sheenRoughness = sheenRoughness;
    if (mat.sheenColor) mat.sheenColor.set(sheenColor);
    if ('iridescence' in mat) mat.iridescence = iridescence;
    if ('iridescenceIOR' in mat) mat.iridescenceIOR = iridescenceIOR;
    if ('flatShading' in mat && mat.flatShading !== flatShading) {
      mat.flatShading = flatShading;
      mat.needsUpdate = true;
    }
  });

  return null;
});

export default ExplodingMaterial;
