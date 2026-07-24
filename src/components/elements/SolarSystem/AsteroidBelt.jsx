import * as THREE from 'three';

import React, { memo, useLayoutEffect, useMemo, useRef } from 'react';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';
import { MAX_ANIMATION_DELTA, TAU } from './solarSystem.constants';

const ASTEROID_GLTF_PATH = modelFile('asteroidPack.glb');
const sharedColor = new THREE.Color();
const sharedDummy = new THREE.Object3D();

function createSeededRandom(seed = 1) {
  let value = Math.floor(seed) % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function buildAsteroidInstances({
  count,
  innerRadius,
  outerRadius,
  thickness,
  scaleMin,
  scaleMax,
  seed,
}) {
  const random = createSeededRandom(seed);

  return Array.from({ length: count }, () => {
    const angle = random() * TAU;
    const radius = THREE.MathUtils.lerp(
      innerRadius,
      outerRadius,
      Math.sqrt(random())
    );
    const y = (random() - 0.5) * thickness;
    const tilt = (random() - 0.5) * 0.35;
    const spin = (random() - 0.5) * TAU;
    const wobble = (random() - 0.5) * TAU;

    return {
      position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
      rotation: [tilt, spin, wobble],
      scale: THREE.MathUtils.lerp(scaleMin, scaleMax, random()),
      variantSeed: random(),
    };
  });
}

function collectAsteroidVariants(scene) {
  const variants = [];

  scene.updateWorldMatrix(true, true);
  scene.traverse((child) => {
    if (!child.isMesh || !child.geometry || !child.material) {
      return;
    }

    const geometry = child.geometry.clone();
    const localTransform = child.matrix.clone();

    // Match the example loader behavior: keep each rock's authored rotation and
    // scale, but do not bake its source translation into the geometry. The
    // example resets mesh positions into the belt ring after cloning.
    localTransform.setPosition(0, 0, 0);
    geometry.applyMatrix4(localTransform);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    variants.push({
      geometry,
      key: child.uuid,
      material: child.material,
    });
  });

  return variants;
}

function createSpriteTexture() {
  if (typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.beginPath();

  for (let index = 0; index <= 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const radius = 26 + Math.sin(angle * 3.1) * 7 + Math.cos(angle * 5.4) * 4;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();

  const gradient = ctx.createRadialGradient(0, -4, 4, 0, 0, 42);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.5, 'rgba(215,215,215,0.94)');
  gradient.addColorStop(1, 'rgba(120,120,120,0)');
  ctx.fillStyle = gradient;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const AsteroidVariantMesh = memo(function AsteroidVariantMesh({
  color,
  geometry,
  instances,
  material,
  opacity,
}) {
  const meshRef = useRef(null);
  const instancedMaterial = useMemo(() => {
    const clonedMaterial = material.clone();
    const tint = new THREE.Color(color);

    if (clonedMaterial.color) {
      clonedMaterial.color.multiply(tint);
    }

    clonedMaterial.transparent = opacity < 1;
    clonedMaterial.opacity = opacity;
    clonedMaterial.depthWrite = opacity >= 1;
    return clonedMaterial;
  }, [color, material, opacity]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    instances.forEach((instance, index) => {
      sharedDummy.position.set(...instance.position);
      sharedDummy.rotation.set(...instance.rotation);
      sharedDummy.scale.setScalar(instance.scale);
      sharedDummy.updateMatrix();
      mesh.setMatrixAt(index, sharedDummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, [instances]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, instancedMaterial, instances.length]}
      frustumCulled={false}
      castShadow={false}
      receiveShadow={false}
    />
  );
});

const AsteroidBeltMeshes = memo(function AsteroidBeltMeshes({
  asteroidInstances,
  color,
  opacity,
}) {
  const { scene } = useGLTF(ASTEROID_GLTF_PATH);
  const variants = useMemo(() => collectAsteroidVariants(scene), [scene]);
  const groupedInstances = useMemo(() => {
    if (!variants.length) {
      return [];
    }

    const buckets = Array.from({ length: variants.length }, () => []);

    asteroidInstances.forEach((instance) => {
      const variantIndex = Math.min(
        variants.length - 1,
        Math.floor(instance.variantSeed * variants.length)
      );
      buckets[variantIndex].push(instance);
    });

    return buckets;
  }, [asteroidInstances, variants]);

  return variants.map((variant, index) => {
    if (!groupedInstances[index]?.length) {
      return null;
    }

    return (
      <AsteroidVariantMesh
        key={variant.key}
        color={color}
        geometry={variant.geometry}
        instances={groupedInstances[index]}
        material={variant.material}
        opacity={opacity}
      />
    );
  });
});

const AsteroidBeltSprites = memo(function AsteroidBeltSprites({
  asteroidInstances,
  color,
  opacity,
  spriteSize,
}) {
  const spriteTexture = useMemo(() => createSpriteTexture(), []);
  const geometry = useMemo(() => {
    const positions = new Float32Array(asteroidInstances.length * 3);
    const colors = new Float32Array(asteroidInstances.length * 3);

    asteroidInstances.forEach((instance, index) => {
      const baseIndex = index * 3;
      const [x, y, z] = instance.position;
      positions[baseIndex] = x;
      positions[baseIndex + 1] = y;
      positions[baseIndex + 2] = z;

      const brightness = THREE.MathUtils.mapLinear(
        instance.scale,
        0.012,
        0.055,
        0.78,
        1.08
      );
      sharedColor.set(color).multiplyScalar(brightness);
      colors[baseIndex] = sharedColor.r;
      colors[baseIndex + 1] = sharedColor.g;
      colors[baseIndex + 2] = sharedColor.b;
    });

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    bufferGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return bufferGeometry;
  }, [asteroidInstances, color]);

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        alphaTest={0.2}
        color={color}
        depthWrite={false}
        map={spriteTexture}
        opacity={opacity}
        size={spriteSize}
        sizeAttenuation
        toneMapped={false}
        transparent
        vertexColors
      />
    </points>
  );
});

function AsteroidBelt({
  color = '#756d63',
  count = 640,
  innerRadius = 2.92,
  mode = 'mesh',
  opacity = 0.82,
  outerRadius = 3.25,
  rotationSpeed = 0.08,
  scaleMax = 0.055,
  scaleMin = 0.018,
  seed = 1,
  spriteCount,
  spriteSize = 7,
  thickness = 0.08,
  speedMultiplier = 1,
}) {
  const beltRef = useRef(null);
  const activeCount = mode === 'sprite' ? (spriteCount ?? count) : count;
  const asteroidInstances = useMemo(
    () =>
      buildAsteroidInstances({
        count: activeCount,
        innerRadius,
        outerRadius,
        thickness,
        scaleMin,
        scaleMax,
        seed,
      }),
    [activeCount, innerRadius, outerRadius, thickness, scaleMin, scaleMax, seed]
  );

  useFrame((_, delta) => {
    if (!beltRef.current || rotationSpeed === 0) {
      return;
    }

    beltRef.current.rotation.y +=
      Math.min(delta, MAX_ANIMATION_DELTA) * rotationSpeed * speedMultiplier;
  });

  return (
    <group ref={beltRef}>
      {mode === 'sprite' ? (
        <AsteroidBeltSprites
          asteroidInstances={asteroidInstances}
          color={color}
          opacity={opacity}
          spriteSize={spriteSize}
        />
      ) : (
        <AsteroidBeltMeshes
          asteroidInstances={asteroidInstances}
          color={color}
          opacity={opacity}
        />
      )}
    </group>
  );
}

useGLTF.preload(ASTEROID_GLTF_PATH);

export default memo(AsteroidBelt);
