import * as THREE from 'three';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const DEFAULT_POSITION = Object.freeze({ x: 0, y: 0, z: 0 });

function vectorFromObject(value = DEFAULT_POSITION) {
  return [value.x ?? 0, value.y ?? 0, value.z ?? 0];
}

function createDiskTexture(innerColor, outerColor) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.08,
    size * 0.5,
    size * 0.5,
    size * 0.5
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.16, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.23, innerColor);
  gradient.addColorStop(0.48, outerColor);
  gradient.addColorStop(0.72, 'rgba(255, 92, 18, 0.42)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.globalCompositeOperation = 'screen';
  context.fillStyle = 'rgba(255, 255, 235, 0.52)';
  context.beginPath();
  context.ellipse(
    size * 0.62,
    size * 0.49,
    size * 0.33,
    size * 0.035,
    0,
    0,
    Math.PI * 2
  );
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

const BlackHoleV2 = memo(function BlackHoleV2({ config }) {
  const diskRef = useRef(null);
  const lensRef = useRef(null);
  const position = vectorFromObject(config.blackHolePosition);
  const metricWorldScale = config.metricWorldScale ?? 1;
  const coreRadius = config.mockBlackHoleDiameter * metricWorldScale * 0.5;
  const diskRadius = config.mockDiskDiameter * metricWorldScale * 0.5;
  const diskTubeRadius =
    Math.max(config.mockDiskThickness, 0.004) * metricWorldScale;
  const lensRadius = config.mockLensDiameter * metricWorldScale * 0.5;
  const diskTexture = useMemo(
    () =>
      createDiskTexture(config.mockDiskInnerColor, config.mockDiskOuterColor),
    [config.mockDiskInnerColor, config.mockDiskOuterColor]
  );
  const lensColor = useMemo(
    () => new THREE.Color(config.mockLensColor),
    [config.mockLensColor]
  );

  useEffect(() => {
    return () => {
      diskTexture.dispose();
    };
  }, [diskTexture]);

  useFrame((state, delta) => {
    if (diskRef.current) {
      diskRef.current.rotation.z += delta * 0.18;
    }

    if (lensRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.7) * 0.018;
      lensRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position}>
      <mesh ref={lensRef} renderOrder={2}>
        <sphereGeometry args={[lensRadius, 64, 32]} />
        <meshBasicMaterial
          color={lensColor}
          depthTest
          depthWrite={false}
          opacity={0.16}
          transparent
        />
      </mesh>
      <mesh ref={diskRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={3}>
        <ringGeometry args={[coreRadius * 1.18, diskRadius, 192]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#ffffff"
          depthTest
          depthWrite={false}
          map={diskTexture}
          opacity={1}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={3}>
        <torusGeometry
          args={[coreRadius * 1.35, diskTubeRadius * 0.42, 12, 160]}
        />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color={config.mockDiskInnerColor}
          depthTest
          depthWrite={false}
          opacity={0.85}
          transparent
        />
      </mesh>
      <mesh renderOrder={4}>
        <sphereGeometry args={[coreRadius, 64, 32]} />
        <meshBasicMaterial color="#000000" depthTest depthWrite />
      </mesh>
    </group>
  );
});

export default BlackHoleV2;
