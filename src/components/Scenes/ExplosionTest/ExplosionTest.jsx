import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { CameraControls, MeshTransmissionMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import useExplosionTestControls from './useExplosionTestControls';

const GEOMETRY_SUFFIX = 'Geometry';
const MATERIAL_SUFFIX = 'Material';

function sanitizeMaterialProps(props) {
  if (!props) return {};
  const next = { ...props };
  delete next.children;
  delete next.attach;
  delete next.args;
  delete next.ref;
  delete next.onBeforeCompile;
  return next;
}

function getGeometryFromMeshElement(meshElement) {
  if (!React.isValidElement(meshElement)) return null;
  const { geometry: directGeometry, children } = meshElement.props || {};

  if (directGeometry?.isBufferGeometry) {
    return directGeometry.clone();
  }

  const childElements = React.Children.toArray(children);
  const geometryElement = childElements.find(
    (child) =>
      React.isValidElement(child) &&
      typeof child.type === 'string' &&
      child.type.endsWith(GEOMETRY_SUFFIX)
  );

  if (!geometryElement || typeof geometryElement.type !== 'string') {
    return null;
  }

  const constructorName = `${geometryElement.type
    .charAt(0)
    .toUpperCase()}${geometryElement.type.slice(1)}`;
  const GeometryConstructor = THREE[constructorName];
  if (typeof GeometryConstructor !== 'function') {
    return null;
  }

  const args = geometryElement.props?.args || [];
  return new GeometryConstructor(...args);
}

function getMaterialPropsFromMeshElement(meshElement) {
  if (!React.isValidElement(meshElement)) return null;
  const childElements = React.Children.toArray(meshElement.props?.children);
  const materialElement = childElements.find(
    (child) =>
      React.isValidElement(child) &&
      typeof child.type === 'string' &&
      child.type.endsWith(MATERIAL_SUFFIX)
  );
  if (!materialElement) return null;
  return sanitizeMaterialProps(materialElement.props);
}

function materialInstanceToProps(material) {
  if (!material || !material.isMaterial) return null;
  return sanitizeMaterialProps({
    color: material.color?.getHexString
      ? `#${material.color.getHexString()}`
      : undefined,
    roughness: material.roughness,
    metalness: material.metalness,
    emissive: material.emissive?.getHexString
      ? `#${material.emissive.getHexString()}`
      : undefined,
    emissiveIntensity: material.emissiveIntensity,
    wireframe: material.wireframe,
    transparent: material.transparent,
    opacity: material.opacity,
    side: material.side,
    flatShading: material.flatShading,
  });
}

function toArray3(value, fallback = [0, 0, 0]) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value.x === 'number') return [value.x, value.y, value.z];
  return fallback;
}

function toArray4(value, fallback = [0, 0, 0, 1]) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value.x === 'number') return [value.x, value.y, value.z, value.w];
  return fallback;
}

function extractExplodingSources(child) {
  if (!React.isValidElement(child)) return [];

  if (child.type === 'mesh') {
    const geometry = getGeometryFromMeshElement(child);
    if (!geometry) return [];

    const materialFromChild = getMaterialPropsFromMeshElement(child);
    const materialFromProp = materialInstanceToProps(child.props?.material);
    return [
      {
        geometry,
        transform: {
          position: toArray3(child.props?.position),
          rotation: toArray3(child.props?.rotation),
          quaternion: child.props?.quaternion
            ? toArray4(child.props.quaternion)
            : undefined,
          scale: child.props?.scale,
        },
        materialProps: materialFromChild || materialFromProp,
      },
    ];
  }

  if (child.type === 'primitive' && child.props?.object?.isObject3D) {
    const root = child.props.object.clone(true);
    if (child.props.position) {
      root.position.set(...toArray3(child.props.position));
    }
    if (child.props.rotation) {
      root.rotation.set(...toArray3(child.props.rotation));
    }
    if (child.props.quaternion) {
      root.quaternion.set(...toArray4(child.props.quaternion));
    }
    if (child.props.scale) {
      const { scale } = child.props;
      if (Array.isArray(scale)) root.scale.set(scale[0], scale[1], scale[2]);
      else if (typeof scale === 'number') root.scale.setScalar(scale);
      else if (typeof scale.x === 'number') root.scale.copy(scale);
    }
    root.updateMatrixWorld(true);

    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const sources = [];
    root.traverse((node) => {
      if (!node.isMesh || !node.geometry) return;
      node.matrixWorld.decompose(position, quaternion, scale);
      sources.push({
        geometry: node.geometry.clone(),
        transform: {
          position: [position.x, position.y, position.z],
          quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
          scale: [scale.x, scale.y, scale.z],
        },
        materialProps: materialInstanceToProps(node.material),
      });
    });
    return sources;
  }

  return [];
}

function ExplodingThing({
  source,
  explodeStrength,
  pointerRadius,
  falloff,
  shakeAmount,
  shakeSpeed,
  returnSpeed,
  motionBoost,
  damping,
  showPointerRadiusDebug,
  color,
  roughness,
  metalness,
}) {
  const meshRef = useRef(null);
  const interactionShellRef = useRef(null);
  const debugSphereRef = useRef(null);
  const materialRef = useRef(null);
  const shaderRef = useRef(null);
  const hoverRef = useRef(false);
  const hoverAmountRef = useRef(0);
  const moveEnergyRef = useRef(0);
  const pointerTargetRef = useRef(new THREE.Vector3(9999, 9999, 9999));
  const pointerSmoothedRef = useRef(new THREE.Vector3(9999, 9999, 9999));
  const lastPointerRef = useRef(null);
  const shellPointRef = useRef(new THREE.Vector3());
  const inverseMatrixRef = useRef(new THREE.Matrix4());
  const localRayRef = useRef(new THREE.Ray());
  const localRayOriginRef = useRef(new THREE.Vector3());
  const localRayDirectionRef = useRef(new THREE.Vector3());
  const outerSphereRef = useRef(new THREE.Sphere(new THREE.Vector3(), 1));
  const outerHitRef = useRef(new THREE.Vector3());
  const sourceGeometryRef = useRef(null);
  const sourceMaterialProps = source.materialProps;

  const {
    geometry,
    positionTexture,
    normalTexture,
    shapeRadius,
    meshTransform,
  } = useMemo(() => {
    const sourceGeometry = source?.geometry?.clone?.();
    if (!sourceGeometry) {
      return null;
    }
    sourceGeometryRef.current = sourceGeometry;

    const geometryData = sourceGeometry.toNonIndexed();
    geometryData.computeBoundingSphere();
    const computedRadius = geometryData.boundingSphere?.radius || 1;
    const base = Float32Array.from(geometryData.attributes.position.array);
    const vertexCount = base.length / 3;
    const triCount = vertexCount / 3;
    const normals = new Float32Array(base.length);
    const random = new Float32Array(triCount);
    const triCenters = new Float32Array(base.length);
    const dataUvs = new Float32Array(vertexCount * 2);
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

    const posTexture = new THREE.DataTexture(
      posData,
      textureSize,
      textureSize,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    posTexture.needsUpdate = true;
    posTexture.magFilter = THREE.NearestFilter;
    posTexture.minFilter = THREE.NearestFilter;
    posTexture.generateMipmaps = false;
    posTexture.flipY = false;

    const nrmTexture = new THREE.DataTexture(
      normalData,
      textureSize,
      textureSize,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    nrmTexture.needsUpdate = true;
    nrmTexture.magFilter = THREE.NearestFilter;
    nrmTexture.minFilter = THREE.NearestFilter;
    nrmTexture.generateMipmaps = false;
    nrmTexture.flipY = false;

    geometryData.setAttribute('aDataUv', new THREE.BufferAttribute(dataUvs, 2));
    geometryData.setAttribute(
      'aTriCenter',
      new THREE.BufferAttribute(triCenters, 3)
    );

    return {
      geometry: geometryData,
      positionTexture: posTexture,
      normalTexture: nrmTexture,
      shapeRadius: computedRadius,
      meshTransform: {
        position: source.transform?.position || [0, 0, 0],
        rotation: source.transform?.rotation,
        quaternion: source.transform?.quaternion,
        scale: source.transform?.scale,
      },
    };
  }, [source]);

  useEffect(
    () => () => {
      sourceGeometryRef.current?.dispose();
    },
    []
  );

  useEffect(
    () => () => {
      if (!geometry) return;
      geometry.dispose();
      positionTexture.dispose();
      normalTexture.dispose();
    },
    [geometry, normalTexture, positionTexture]
  );

  useEffect(() => {
    outerSphereRef.current.radius = shapeRadius || 1;
  }, [shapeRadius]);

  if (!geometry) return null;

  const resolveLocalInteractionPoint = (event) => {
    if (!meshRef.current) return null;

    const inverseMatrix = inverseMatrixRef.current
      .copy(meshRef.current.matrixWorld)
      .invert();
    localRayOriginRef.current
      .copy(event.ray.origin)
      .applyMatrix4(inverseMatrix);
    localRayDirectionRef.current
      .copy(event.ray.direction)
      .transformDirection(inverseMatrix);
    localRayRef.current.set(
      localRayOriginRef.current,
      localRayDirectionRef.current
    );

    const hit = localRayRef.current.intersectSphere(
      outerSphereRef.current,
      outerHitRef.current
    );
    if (hit) return outerHitRef.current;

    shellPointRef.current.copy(event.point);
    const fallback = meshRef.current.worldToLocal(shellPointRef.current);
    const length = fallback.length();
    if (length > 0.0001) {
      fallback.multiplyScalar((shapeRadius || 1) / length);
    }
    return fallback;
  };

  useFrame((state, delta) => {
    const hoverTarget = hoverRef.current ? 1 : 0;
    hoverAmountRef.current = THREE.MathUtils.damp(
      hoverAmountRef.current,
      hoverTarget,
      returnSpeed,
      delta
    );
    moveEnergyRef.current = THREE.MathUtils.damp(
      moveEnergyRef.current,
      0,
      damping,
      delta
    );
    pointerSmoothedRef.current.lerp(
      pointerTargetRef.current,
      1 - Math.exp(-20 * delta)
    );
    if (debugSphereRef.current) {
      const isVisible =
        showPointerRadiusDebug &&
        hoverRef.current &&
        pointerSmoothedRef.current.lengthSq() < 10000;
      debugSphereRef.current.visible = isVisible;
      if (isVisible) {
        debugSphereRef.current.position.copy(pointerSmoothedRef.current);
        debugSphereRef.current.scale.setScalar(pointerRadius);
      }
    }

    const shader = shaderRef.current;
    if (!shader) return;

    shader.uniforms.uHover.value = hoverAmountRef.current;
    shader.uniforms.uMoveEnergy.value = moveEnergyRef.current;
    shader.uniforms.uPointer.value.copy(pointerSmoothedRef.current);
    shader.uniforms.uEffectRadius.value = pointerRadius;
    shader.uniforms.uExplodeStrength.value = explodeStrength;
    shader.uniforms.uFalloff.value = falloff;
    shader.uniforms.uShakeAmount.value = shakeAmount;
    shader.uniforms.uShakeSpeed.value = shakeSpeed;
    shader.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <mesh
      ref={meshRef}
      position={meshTransform.position}
      rotation={meshTransform.rotation}
      quaternion={meshTransform.quaternion}
      scale={meshTransform.scale}
      geometry={geometry}
    >
      <mesh
        ref={interactionShellRef}
        onPointerOver={(event) => {
          event.stopPropagation();
          if (!meshRef.current) return;
          hoverRef.current = true;
          const localPoint = resolveLocalInteractionPoint(event);
          if (!localPoint) return;
          pointerTargetRef.current.copy(localPoint);
          pointerSmoothedRef.current.copy(localPoint);
          lastPointerRef.current = localPoint.clone();
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          hoverRef.current = false;
          pointerTargetRef.current.set(9999, 9999, 9999);
          lastPointerRef.current = null;
        }}
        onPointerMove={(event) => {
          event.stopPropagation();
          if (!meshRef.current) return;
          hoverRef.current = true;
          const localPoint = resolveLocalInteractionPoint(event);
          if (!localPoint) return;
          pointerTargetRef.current.copy(localPoint);

          if (lastPointerRef.current) {
            const movement = localPoint.distanceTo(lastPointerRef.current);
            moveEnergyRef.current = Math.min(
              2.5,
              moveEnergyRef.current + movement * motionBoost
            );
            lastPointerRef.current.copy(localPoint);
          } else {
            moveEnergyRef.current = 0.4;
            lastPointerRef.current = localPoint.clone();
          }
        }}
      >
        <sphereGeometry args={[(shapeRadius || 1) + pointerRadius, 24, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={debugSphereRef} visible={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ff2d2d"
          wireframe
          toneMapped={false}
          depthTest={false}
        />
      </mesh>
      <meshStandardMaterial
        {...sourceMaterialProps}
        ref={materialRef}
        color={sourceMaterialProps?.color || color}
        roughness={sourceMaterialProps?.roughness ?? roughness}
        metalness={sourceMaterialProps?.metalness ?? metalness}
        side={sourceMaterialProps?.side ?? THREE.DoubleSide}
        onBeforeCompile={(incomingShader) => {
          const shader = incomingShader;
          shaderRef.current = shader;
          shader.uniforms.uPositionTex = { value: positionTexture };
          shader.uniforms.uNormalTex = { value: normalTexture };
          shader.uniforms.uPointer = {
            value: pointerSmoothedRef.current.clone(),
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
            float triRand = normalRand.w;
            float safeRadius = max(0.0001, uEffectRadius);
            float dist = distance(aTriCenter, uPointer);
            float inRange = step(dist, safeRadius);
            float edgeBlend = max(0.0, 1.0 - dist / safeRadius);
            float localInfluence = inRange * pow(edgeBlend, max(1.0, uFalloff * 4.0));
            float shake = uHover * localInfluence * uShakeAmount * sin(uTime * uShakeSpeed + triRand * 50.26548);
            float travel = uHover * uExplodeStrength * localInfluence * (0.35 + triRand * 0.95) * (0.5 + uMoveEnergy);
            float offset = travel + shake;
            vec3 transformed = basePos + triNormal * offset;
            `
          );
        }}
      />
    </mesh>
  );
}

function ExplodingThings({
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
  color,
  roughness,
  metalness,
}) {
  const items = useMemo(() => {
    const childItems = React.Children.toArray(children).filter(
      React.isValidElement
    );
    return childItems.flatMap((child) => extractExplodingSources(child));
  }, [children]);

  return (
    <>
      {items.map((item, index) => (
        <ExplodingThing
          key={item.key || `exploding-thing-${index}`}
          source={item}
          explodeStrength={explodeStrength}
          pointerRadius={pointerRadius}
          falloff={falloff}
          shakeAmount={shakeAmount}
          shakeSpeed={shakeSpeed}
          returnSpeed={returnSpeed}
          motionBoost={motionBoost}
          damping={damping}
          showPointerRadiusDebug={showPointerRadiusDebug}
          color={color}
          roughness={roughness}
          metalness={metalness}
        />
      ))}
    </>
  );
}

export default function ExplosionTest() {
  const latestResolvedSettingsRef = useRef({});
  const controls = useExplosionTestControls(latestResolvedSettingsRef);

  const resolvedSettings = controls;
  latestResolvedSettingsRef.current = resolvedSettings;

  return (
    <>
      <CameraControls />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 6]} intensity={1.35} color="#ffffff" />
      <pointLight
        position={[0, 6, -10]}
        intensity={1}
        color="#ffffff"
        lookAt={[0, 0, 0]}
      />

      <color attach="background" args={[resolvedSettings.backgroundColor]} />

      <mesh
        position={[
          resolvedSettings.innerX,
          resolvedSettings.innerY,
          resolvedSettings.innerZ,
        ]}
      >
        <sphereGeometry args={[resolvedSettings.innerRadius, 64, 64]} />
        <MeshTransmissionMaterial
          color={resolvedSettings.glassColor}
          transmission={resolvedSettings.transmission}
          thickness={resolvedSettings.thickness}
          chromaticAberration={resolvedSettings.chromaticAberration}
          anisotropy={resolvedSettings.anisotropy}
          distortion={resolvedSettings.distortion}
          distortionScale={resolvedSettings.distortionScale}
          temporalDistortion={resolvedSettings.temporalDistortion}
          roughness={0}
          ior={1.35}
          backside
        />
      </mesh>
      <ExplodingThings
        explodeStrength={resolvedSettings.explodeStrength}
        pointerRadius={resolvedSettings.pointerRadius}
        falloff={resolvedSettings.falloff}
        shakeAmount={resolvedSettings.shakeAmount}
        shakeSpeed={resolvedSettings.shakeSpeed}
        returnSpeed={resolvedSettings.returnSpeed}
        motionBoost={resolvedSettings.motionBoost}
        damping={resolvedSettings.damping}
        showPointerRadiusDebug={resolvedSettings.showPointerRadiusDebug}
        color={resolvedSettings.secondColor}
        roughness={resolvedSettings.secondRoughness}
        metalness={resolvedSettings.secondMetalness}
      >
        <mesh
          position={[
            resolvedSettings.outerX,
            resolvedSettings.outerY,
            resolvedSettings.outerZ,
          ]}
        >
          <sphereGeometry args={[resolvedSettings.outerRadius, 64, 64]} />
          <meshStandardMaterial
            color={resolvedSettings.secondColor}
            roughness={resolvedSettings.secondRoughness}
            metalness={resolvedSettings.secondMetalness}
          />
        </mesh>
        <mesh
          position={[
            resolvedSettings.outerX + 2.35,
            resolvedSettings.outerY + 0.2,
            resolvedSettings.outerZ - 0.45,
          ]}
          scale={[0.82, 0.82, 0.82]}
        >
          <sphereGeometry args={[resolvedSettings.outerRadius, 64, 64]} />
          <meshStandardMaterial
            color="#8ad7ff"
            roughness={0.08}
            metalness={0.92}
          />
        </mesh>
      </ExplodingThings>
    </>
  );
}
