import { folder, useControls } from 'leva';
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import algorithms from './particleAlgorithms';

function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.8, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function useParticleLabControls() {
  const algorithmKeys = useMemo(() => Object.keys(algorithms), []);

  const baseControls = useControls(
    'Particle Lab',
    {
      Fractal: folder(
        {
          algorithm: {
            value: 'Abyssal Jellyfish',
            options: algorithmKeys,
          },
          pointsCount: {
            label: 'Point Count',
            value: 150000,
            min: 10000,
            max: 300000,
            step: 5000,
          },
          animatePoints: { value: false },
        },
        { collapsed: false }
      ),
      Styling: folder(
        {
          color1: { label: 'Core Color', value: '#ff0055' },
          color2: { label: 'Mid Color', value: '#4422ff' },
          color3: { label: 'Edge Color', value: '#00ffff' },
          pointSize: {
            label: 'Point Size',
            value: 0.046,
            min: 0.01,
            max: 0.2,
            step: 0.001,
          },
          opacity: { value: 1.0, min: 0.05, max: 1.0, step: 0.01 },
        },
        { collapsed: false }
      ),
      Transform: folder(
        {
          alignX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
          alignY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
          rotationSpeedX: {
            label: 'Rotation X',
            value: 0.0033,
            min: -0.05,
            max: 0.05,
            step: 0.0001,
          },
          rotationSpeedY: {
            label: 'Rotation Y',
            value: 0,
            min: -0.05,
            max: 0.05,
            step: 0.0001,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: false }
  );

  const selectedAlgorithm = algorithms[baseControls.algorithm];
  const [paramState, setParamState] = useState(() => ({
    ...selectedAlgorithm.defaults,
  }));

  useControls(
    'Particle Lab Parameters',
    () => {
      const schema = {};
      Object.keys(selectedAlgorithm.ranges).forEach((key) => {
        const [min, max, step = 0.01] = selectedAlgorithm.ranges[key];
        schema[key] = {
          value: paramState[key] ?? selectedAlgorithm.defaults[key],
          min,
          max,
          step,
          onChange: (nextValue) => {
            const value = Number(nextValue);
            if (!Number.isFinite(value)) return;
            setParamState((prev) => {
              if (prev[key] === value) return prev;
              return { ...prev, [key]: value };
            });
          },
        };
      });
      return schema;
    },
    [baseControls.algorithm, paramState]
  );

  useEffect(() => {
    setParamState((prev) => {
      const next = { ...selectedAlgorithm.defaults };
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);

      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key])
      ) {
        return prev;
      }

      return next;
    });
  }, [baseControls.algorithm, selectedAlgorithm.defaults]);

  const resolvedParams = { ...selectedAlgorithm.defaults };
  Object.keys(selectedAlgorithm.defaults).forEach((key) => {
    const value = Number(paramState[key]);
    resolvedParams[key] = Number.isFinite(value) ? value : resolvedParams[key];
  });

  const paramsKey = `${baseControls.algorithm}:${Object.keys(resolvedParams)
    .map((key) => `${key}:${resolvedParams[key]}`)
    .join('|')}`;

  return {
    ...baseControls,
    params: resolvedParams,
    paramsKey,
  };
}

function ParticleCloud({ config }) {
  const pointsRef = useRef();
  const geometryRef = useRef();
  const texture = useMemo(createCircleTexture, []);
  const alignedPositionsRef = useRef(null);
  const wasAnimatingRef = useRef(false);
  const currentCentroidRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const alg = algorithms[config.algorithm];
    const rawPositions = [];
    const colors = new Float32Array(config.pointsCount * 3);

    alg.generate(config.params, rawPositions, config.pointsCount);

    if (rawPositions.length === 0 || !geometryRef.current) return;

    const actualCount = rawPositions.length / 3;
    const centroid = currentCentroidRef.current;
    centroid.set(0, 0, 0);

    for (let i = 0; i < rawPositions.length; i += 3) {
      centroid.x += rawPositions[i];
      centroid.y += rawPositions[i + 1];
      centroid.z += rawPositions[i + 2];
    }
    centroid.divideScalar(actualCount);

    let maxDist = 0;
    for (let i = 0; i < rawPositions.length; i += 3) {
      const dx = rawPositions[i] - centroid.x;
      const dy = rawPositions[i + 1] - centroid.y;
      const dz = rawPositions[i + 2] - centroid.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d > maxDist) maxDist = d;
    }

    const currentScaleFactor = 15.0 / (maxDist || 1.0);

    const alignedPositions = new Float32Array(rawPositions.length);
    alignedPositionsRef.current = alignedPositions;

    const matrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(config.alignX, config.alignY, 0, 'XYZ')
    );
    const m = matrix.elements;

    const c1 = new THREE.Color(config.color1);
    const c2 = new THREE.Color(config.color2);
    const c3 = new THREE.Color(config.color3);

    for (let i = 0; i < rawPositions.length; i += 3) {
      const bx = (rawPositions[i] - centroid.x) * currentScaleFactor;
      const by = (rawPositions[i + 1] - centroid.y) * currentScaleFactor;
      const bz = (rawPositions[i + 2] - centroid.z) * currentScaleFactor;

      alignedPositions[i] = m[0] * bx + m[4] * by + m[8] * bz;
      alignedPositions[i + 1] = m[1] * bx + m[5] * by + m[9] * bz;
      alignedPositions[i + 2] = m[2] * bx + m[6] * by + m[10] * bz;

      const distNorm = Math.sqrt(bx * bx + by * by + bz * bz) / 15.0;
      const timeNorm = i / 3 / actualCount;

      let t = distNorm * 0.4 + timeNorm * 0.6;
      t = Math.max(0, Math.min(1, t));

      const col =
        t < 0.5
          ? c1.clone().lerp(c2, t * 2.0)
          : c2.clone().lerp(c3, (t - 0.5) * 2.0);

      colors[i] = col.r;
      colors[i + 1] = col.g;
      colors[i + 2] = col.b;
    }

    geometryRef.current.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(alignedPositions), 3)
    );
    geometryRef.current.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.attributes.color.needsUpdate = true;

    wasAnimatingRef.current = false;
  }, [
    config.algorithm,
    config.paramsKey,
    config.pointsCount,
    config.alignX,
    config.alignY,
    config.color1,
    config.color2,
    config.color3,
  ]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    const geometry = geometryRef.current;
    const alignedPositions = alignedPositionsRef.current;

    if (!points || !geometry || !alignedPositions) return;

    const positionAttr = geometry.attributes.position;
    if (!positionAttr) return;

    if (config.animatePoints) {
      wasAnimatingRef.current = true;
      const time = performance.now() * 0.001;
      const positions = positionAttr.array;
      const len = alignedPositions.length;
      const { type } = algorithms[config.algorithm];
      const pointCount = len / 3;

      if (type === 'ode') {
        const flowSpeed = Math.max(1, Math.floor(pointCount * 0.05));
        const offset = Math.floor(time * flowSpeed);

        const dashLength = Math.max(1, Math.floor(pointCount * 0.015));
        const gapLength = Math.max(1, Math.floor(pointCount * 0.03));
        const patternLength = dashLength + gapLength;

        for (let i = 0; i < len; i += 3) {
          const ptIdx = i / 3;

          if (ptIdx % patternLength < dashLength) {
            const trackIdx = (ptIdx + offset) % pointCount;
            const srcI = trackIdx * 3;
            positions[i] = alignedPositions[srcI];
            positions[i + 1] = alignedPositions[srcI + 1];
            positions[i + 2] = alignedPositions[srcI + 2];
          } else {
            positions[i] = 999999;
            positions[i + 1] = 999999;
            positions[i + 2] = 999999;
          }
        }
      } else {
        const speed = 0.4;
        const amp = 0.25;

        for (let i = 0; i < len; i += 3) {
          const bx = alignedPositions[i];
          const by = alignedPositions[i + 1];
          const bz = alignedPositions[i + 2];

          positions[i] = bx + Math.sin(time * speed + by) * amp;
          positions[i + 1] = by + Math.cos(time * speed * 1.1 + bz) * amp;
          positions[i + 2] = bz + Math.sin(time * speed * 0.9 + bx) * amp;
        }
      }

      positionAttr.needsUpdate = true;
    } else if (wasAnimatingRef.current) {
      const positions = positionAttr.array;
      for (let i = 0; i < positions.length; i += 1) {
        positions[i] = alignedPositions[i];
      }
      positionAttr.needsUpdate = true;
      wasAnimatingRef.current = false;
    }

    points.rotation.y += config.rotationSpeedX * (delta * 60);
    points.rotation.x += config.rotationSpeedY * (delta * 60);
  });

  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
      if (geometryRef.current) geometryRef.current.dispose();
    };
  }, [texture]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial
        size={config.pointSize}
        vertexColors
        transparent
        opacity={config.opacity}
        map={texture || undefined}
        alphaTest={0.01}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function ParticleLab() {
  const config = useParticleLabControls();

  return (
    <>
      <color attach="background" args={['#020205']} />
      <fog attach="fog" args={['#020205', 0.015]} />
      <ambientLight intensity={0.4} />
      <PerspectiveCamera makeDefault position={[0, 10, 30]} fov={45} />
      <OrbitControls enableDamping dampingFactor={0.05} autoRotate={false} />
      <ParticleCloud config={config} />
    </>
  );
}
