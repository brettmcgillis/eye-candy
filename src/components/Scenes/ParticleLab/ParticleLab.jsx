import { folder, useControls } from 'leva';
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const generationState = {
  pointsCount: 150000,
};

// 8 retained favorites, 4 fixed, 5 custom algorithms.
const algorithms = {
  'Aizawa Sphere': {
    type: 'ode',
    defaults: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 0.1, dt: 0.01 },
    ranges: {
      a: [0.1, 2.0, 0.01],
      b: [0.1, 2.0, 0.01],
      c: [0.1, 2.0, 0.01],
      d: [1.0, 5.0, 0.01],
      e: [0.1, 1.0, 0.01],
      f: [0.0, 0.5, 0.01],
      dt: [0.001, 0.05, 0.001],
    },
    generate: (p, positions) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const dx = (z - p.b) * x - p.d * y;
        const dy = p.d * x + (z - p.b) * y;
        const dz =
          p.c +
          p.a * z -
          z ** 3 / 3 -
          (x * x + y * y) * (1 + p.e * z) +
          p.f * z * x ** 3;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.1;
          z = 0.1;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Thomas Labyrinth': {
    type: 'ode',
    defaults: { b: 0.19, dt: 0.05 },
    ranges: { b: [0.0, 0.5, 0.001], dt: [0.01, 0.1, 0.001] },
    generate: (p, positions) => {
      let x = 1.0;
      let y = 0.0;
      let z = 0.0;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const dx = Math.sin(y) - p.b * x;
        const dy = Math.sin(z) - p.b * y;
        const dz = Math.sin(x) - p.b * z;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 1;
          y = 0;
          z = 0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Nose-Hoover Braid': {
    type: 'ode',
    defaults: { a: 0.2, dt: 0.01 },
    ranges: { a: [0.1, 5.0, 0.1], dt: [0.001, 0.05, 0.001] },
    generate: (p, positions) => {
      let x = 1.0;
      let y = 0.0;
      let z = 0.0;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const dx = y;
        const dy = -x + y * z;
        const dz = p.a - y * y;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 1.0;
          y = 0.0;
          z = 0.0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Four-Wing Butterfly': {
    type: 'ode',
    defaults: { a: 0.2, b: 0.01, c: -0.4, dt: 0.05 },
    ranges: {
      a: [0.1, 0.5, 0.01],
      b: [-0.1, 0.1, 0.001],
      c: [-1.0, 0.0, 0.01],
      dt: [0.01, 0.1, 0.001],
    },
    generate: (p, positions) => {
      let x = 1.0;
      let y = 1.0;
      let z = 1.0;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const dx = p.a * x + y * z;
        const dy = p.b * x + p.c * y - x * z;
        const dz = -z - x * y;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 1.0;
          y = 1.0;
          z = 1.0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Clifford Cloud': {
    type: 'map',
    defaults: { a: 1.5, b: -1.8, c: 1.6, d: 0.9 },
    ranges: {
      a: [-3.0, 3.0, 0.01],
      b: [-3.0, 3.0, 0.01],
      c: [-3.0, 3.0, 0.01],
      d: [-3.0, 3.0, 0.01],
    },
    generate: (p, positions) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const nx = Math.sin(p.a * y) + p.c * Math.cos(p.a * x);
        const ny = Math.sin(p.b * x) + p.d * Math.cos(p.b * y);
        const nz = Math.sin(p.c * z) + p.a * Math.cos(p.d * x);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Hopalong Nebula': {
    type: 'map',
    defaults: { a: 2.01, b: -2.53, c: 1.61, d: -0.33, e: 2.0, f: -1.0 },
    ranges: {
      a: [-3, 3, 0.01],
      b: [-3, 3, 0.01],
      c: [-3, 3, 0.01],
      d: [-3, 3, 0.01],
      e: [-3, 3, 0.01],
      f: [-3, 3, 0.01],
    },
    generate: (p, positions) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const nx = Math.sin(p.a * y) - Math.cos(p.b * x) + Math.sin(p.e * z);
        const ny = Math.sin(p.c * x) - Math.cos(p.d * y) + Math.sin(p.f * z);
        const nz = Math.sin(p.e * x) - Math.cos(p.f * y) + Math.sin(p.a * z);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Quantum Lotus': {
    type: 'map',
    defaults: { a: 1.2, b: 0.8, c: -1.5, d: 2.0, e: 0.9, f: 1.5 },
    ranges: {
      a: [-3, 3, 0.01],
      b: [-3, 3, 0.01],
      c: [-3, 3, 0.01],
      d: [-3, 3, 0.01],
      e: [0.1, 1.5, 0.01],
      f: [-3, 3, 0.01],
    },
    generate: (p, positions) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const r = Math.sqrt(x * x + y * y);
        const nx = y * Math.cos(p.a) - x * Math.sin(p.b + r) - z;
        const ny = x * Math.cos(p.c) + y * Math.sin(p.d + r) - z;
        const nz = z * p.e + Math.sin(r * p.f);
        x = nx;
        y = ny;
        z = nz;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.1;
          z = 0.1;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Stellar Web': {
    type: 'map',
    defaults: { a: 2.1, b: -1.5, c: 1.8, d: 2.4, e: -1.2, f: 1.1 },
    ranges: {
      a: [-3, 3, 0.01],
      b: [-3, 3, 0.01],
      c: [-3, 3, 0.01],
      d: [-3, 3, 0.01],
      e: [-3, 3, 0.01],
      f: [-3, 3, 0.01],
    },
    generate: (p, positions) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const nx = p.a * Math.sin(y) - Math.cos(p.b * z) * x;
        const ny = p.c * Math.sin(z) - Math.cos(p.d * x) * y;
        const nz = p.e * Math.sin(x) - Math.cos(p.f * y) * z;
        x = nx;
        y = ny;
        z = nz;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.1;
          z = 0.1;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Abyssal Jellyfish': {
    type: 'map',
    defaults: { a: -1.72, b: 1.16, c: -1.35, d: 0.66 },
    ranges: {
      a: [-3, 3, 0.01],
      b: [-3, 3, 0.01],
      c: [-3, 3, 0.01],
      d: [-10, 10, 0.01],
    },
    generate: (p, positions) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const nx = Math.sin(p.a * y) + Math.cos(p.b * z) - Math.sin(p.c * x);
        const ny = Math.sin(p.a * z) + Math.cos(p.b * x) - Math.sin(p.c * y);
        const nz = Math.sin(p.a * x) + Math.cos(p.b * y) - Math.sin(p.d * z);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Ethereal Loom': {
    type: 'map',
    defaults: { a: 2.1, b: -1.2, c: 1.5 },
    ranges: { a: [-3, 3, 0.01], b: [-3, 3, 0.01], c: [-3, 3, 0.01] },
    generate: (p, positions) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const nx = Math.sin(p.a * y) * Math.sin(p.b * z) + Math.cos(p.c * x);
        const ny = Math.sin(p.b * z) * Math.sin(p.c * x) + Math.cos(p.a * y);
        const nz = Math.sin(p.c * x) * Math.sin(p.a * y) + Math.cos(p.b * z);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Chrono Core': {
    type: 'map',
    defaults: { a: 2.5, b: 1.47, c: 0.5, d: 0.1 },
    ranges: {
      a: [0.1, 3, 0.01],
      b: [0.1, 3, 0.01],
      c: [0.1, 3, 0.01],
      d: [0.1, 3, 0.01],
    },
    generate: (p, positions) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const r = Math.sqrt(x * x + y * y + z * z);
        const nx = Math.sin(p.a * y) + p.b * Math.cos(r);
        const ny = Math.sin(p.c * z) + p.d * Math.sin(r);
        const nz = Math.sin(p.a * x) + Math.cos(p.b * r);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Crystalline Spire': {
    type: 'ode',
    defaults: { a: 1.75, dt: 0.01 },
    ranges: { a: [1.0, 2.0, 0.01], dt: [0.001, 0.05, 0.001] },
    generate: (p, positions) => {
      let x = 1.0;
      let y = 0.0;
      let z = 0.0;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const dx = (-p.a * x - 4 * y - 4 * z - y * y) * p.dt;
        const dy = (-p.a * y - 4 * z - 4 * x - z * z) * p.dt;
        const dz = (-p.a * z - 4 * x - 4 * y - x * x) * p.dt;
        x += dx;
        y += dy;
        z += dz;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 1.0;
          y = 0.0;
          z = 0.0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Void Dragon': {
    type: 'ode',
    defaults: { a: 40.0, b: 3.0, c: 28.0, dt: 0.002 },
    ranges: {
      a: [10.0, 60.0, 0.1],
      b: [1.0, 10.0, 0.1],
      c: [10.0, 50.0, 0.1],
      dt: [0.001, 0.01, 0.001],
    },
    generate: (p, positions) => {
      let x = 0.1;
      let y = 0.5;
      let z = -0.6;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const dx = p.a * (y - x) * p.dt;
        const dy = ((p.c - p.a) * x - x * z + p.c * y) * p.dt;
        const dz = (x * y - p.b * z) * p.dt;
        x += dx;
        y += dy;
        z += dz;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.5;
          z = -0.6;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Astral Web': {
    type: 'map',
    defaults: { a: 1.1, b: 2.2, c: 1.5, d: 0.8 },
    ranges: {
      a: [0.1, 3, 0.01],
      b: [0.1, 3, 0.01],
      c: [0.1, 3, 0.01],
      d: [0.1, 3, 0.01],
    },
    generate: (p, positions) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const nx = Math.sin(p.a * (y - z)) + p.b * Math.cos(x);
        const ny = Math.sin(p.c * (z - x)) + p.d * Math.cos(y);
        const nz = Math.sin(p.a * (x - y)) + p.b * Math.cos(z);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Hyperborean Snowflake': {
    type: 'map',
    defaults: { a: 1.5, b: 1.2, c: 1.8, d: 0.5 },
    ranges: {
      a: [0.1, 3, 0.01],
      b: [0.1, 3, 0.01],
      c: [0.1, 3, 0.01],
      d: [0.1, 3, 0.01],
    },
    generate: (p, positions) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const r = Math.sqrt(x * x + y * y + z * z);
        const nx =
          Math.cos(p.a * r) * x - Math.sin(p.b * r) * y + p.c * Math.sin(z);
        const ny =
          Math.sin(p.a * r) * x + Math.cos(p.b * r) * y + p.c * Math.sin(x);
        const nz = p.d * Math.cos(r) + Math.sin(y);
        const f = 1.0 / (1.0 + r * 0.05);
        x = nx * f;
        y = ny * f;
        z = nz * f;
        positions.push(x, y, z);
      }
    },
  },
  'Aetheric Crown': {
    type: 'map',
    defaults: { a: 1.2, b: 2.1, c: 1.4, d: 1.5 },
    ranges: {
      a: [0.1, 3, 0.01],
      b: [0.1, 3, 0.01],
      c: [0.1, 3, 0.01],
      d: [0.1, 3, 0.01],
    },
    generate: (p, positions) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const nx = Math.cos(p.a * y) + Math.sin(p.b * z) - Math.cos(p.c * x);
        const ny = Math.cos(p.d * z) + Math.sin(p.a * x) - Math.cos(p.b * y);
        const nz = Math.cos(p.c * x) + Math.sin(p.d * y) - Math.cos(p.a * z);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Plasma Coil': {
    type: 'ode',
    defaults: { s: 20.0, v: 4.272, dt: 0.005 },
    ranges: {
      s: [1.0, 20.0, 0.1],
      v: [1.0, 10.0, 0.001],
      dt: [0.001, 0.02, 0.001],
    },
    generate: (p, positions) => {
      let x = 1.0;
      let y = 0.0;
      let z = 0.0;
      for (let i = 0; i < generationState.pointsCount; i += 1) {
        const dx = -p.s * (x + y) * p.dt;
        const dy = (-y - p.s * x * z) * p.dt;
        const dz = (p.s * x * y + p.v) * p.dt;
        x += dx;
        y += dy;
        z += dz;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 1.0;
          y = 0.0;
          z = 0.0;
        }
        positions.push(x, y, z);
      }
    },
  },
};

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
  const algoDependency = `${baseControls.algorithm}:${JSON.stringify(selectedAlgorithm.defaults)}`;

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
          value: selectedAlgorithm.defaults[key],
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
    [algoDependency]
  );

  useEffect(() => {
    setParamState({ ...selectedAlgorithm.defaults });
  }, [algoDependency, selectedAlgorithm.defaults]);

  const resolvedParams = { ...selectedAlgorithm.defaults };
  Object.keys(selectedAlgorithm.defaults).forEach((key) => {
    const value = paramState[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      resolvedParams[key] = value;
    }
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
    generationState.pointsCount = config.pointsCount;

    const alg = algorithms[config.algorithm];
    const rawPositions = [];
    const colors = new Float32Array(config.pointsCount * 3);

    alg.generate(config.params, rawPositions);

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
