import { folder, useControls } from 'leva';
import * as THREE from 'three';

import React, { useMemo } from 'react';

import { CameraControls, PerspectiveCamera } from '@react-three/drei';

/* -------------------------------------------------------
   MiniNeuralNet — tiny static approximation of NeuralNetwork.
   25 deterministic particles on a ring, connected by short edges.
   No animation; renders points + lineSegments for the plotter.
------------------------------------------------------- */
function MiniNeuralNet({ position }) {
  const { ptPositions, ptCount, linePositions, lineColors, lineCount } =
    useMemo(() => {
      const N = 25;
      const pts = [];

      // Deterministic ring with vertical wobble — no Math.random()
      for (let i = 0; i < N; i += 1) {
        const theta = (i / N) * Math.PI * 2;
        const r = 1.2 + 0.4 * Math.abs(Math.sin(i * 1.3));
        const y = 0.6 * Math.sin(i * 0.8 + 1.0);
        pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
      }

      const ptPos = new Float32Array(N * 3);
      pts.forEach(([x, y, z], i) => {
        ptPos[i * 3] = x;
        ptPos[i * 3 + 1] = y;
        ptPos[i * 3 + 2] = z;
      });

      const maxDist = 1.8;
      const linePosArr = [];
      const lineColArr = [];

      for (let i = 0; i < N; i += 1) {
        for (let j = i + 1; j < N; j += 1) {
          const dx = pts[i][0] - pts[j][0];
          const dy = pts[i][1] - pts[j][1];
          const dz = pts[i][2] - pts[j][2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < maxDist) {
            const alpha = 1 - dist / maxDist;
            linePosArr.push(...pts[i], ...pts[j]);
            lineColArr.push(alpha, alpha, alpha, alpha, alpha, alpha);
          }
        }
      }

      return {
        ptPositions: ptPos,
        ptCount: N,
        linePositions: new Float32Array(linePosArr),
        lineColors: new Float32Array(lineColArr),
        lineCount: linePosArr.length / 3,
      };
    }, []);

  return (
    <group position={position}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[ptPositions, 3]}
            count={ptCount}
          />
        </bufferGeometry>
        <pointsMaterial color="#88ccff" size={3} sizeAttenuation={false} />
      </points>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
            count={lineCount}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[lineColors, 3]}
            count={lineCount}
          />
        </bufferGeometry>
        <lineBasicMaterial vertexColors />
      </lineSegments>
    </group>
  );
}

/* -------------------------------------------------------
   MiniParticleCloud — tiny static approximation of ParticleCloud.
   400 points sampled from a Lorenz attractor (like the ODE fractal
   algorithms in particleAlgorithms), colored core→edge.
   No animation; renders points only.
------------------------------------------------------- */
function MiniParticleCloud({ position }) {
  const { posArray, colorArray, count } = useMemo(() => {
    const N = 400;
    // Lorenz attractor parameters
    let x = 0.1;
    let y = 0.0;
    let z = 0.0;
    const dt = 0.005;
    const sigma = 10;
    const rho = 28;
    const beta = 8 / 3;

    // Skip transient
    for (let i = 0; i < 1000; i += 1) {
      const dx = sigma * (y - x) * dt;
      const dy = (x * (rho - z) - y) * dt;
      const dz = (x * y - beta * z) * dt;
      x += dx;
      y += dy;
      z += dz;
    }

    // Collect N samples (subsample every 3 steps for variety)
    const raw = [];
    for (let i = 0; i < N; i += 1) {
      for (let s = 0; s < 3; s += 1) {
        const dx = sigma * (y - x) * dt;
        const dy = (x * (rho - z) - y) * dt;
        const dz = (x * y - beta * z) * dt;
        x += dx;
        y += dy;
        z += dz;
      }
      // Map (x, y, z_attractor) → Three.js (x, height, depth)
      raw.push(x, z - 25, y);
    }

    // Normalize to fit within ~2 world-units radius
    let maxR = 0;
    for (let i = 0; i < raw.length; i += 3) {
      const r = Math.sqrt(raw[i] ** 2 + raw[i + 1] ** 2 + raw[i + 2] ** 2);
      if (r > maxR) maxR = r;
    }
    const scale = 2.0 / (maxR || 1);

    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const c1 = new THREE.Color('#ff0055');
    const c2 = new THREE.Color('#4422ff');
    const c3 = new THREE.Color('#00ffff');

    for (let i = 0; i < N; i += 1) {
      pos[i * 3] = raw[i * 3] * scale;
      pos[i * 3 + 1] = raw[i * 3 + 1] * scale;
      pos[i * 3 + 2] = raw[i * 3 + 2] * scale;

      const t = i / N;
      const c =
        t < 0.5
          ? c1.clone().lerp(c2, t * 2)
          : c2.clone().lerp(c3, (t - 0.5) * 2);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    return { posArray: pos, colorArray: col, count: N };
  }, []);

  return (
    <group position={position}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[posArray, 3]}
            count={count}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colorArray, 3]}
            count={count}
          />
        </bufferGeometry>
        <pointsMaterial size={2.5} sizeAttenuation={false} vertexColors />
      </points>
    </group>
  );
}

const SOURCE_THEME_COLORS = {
  light: {
    ambient: 2.0,
    gridCenter: '#cccccc',
    gridLines: '#dddddd',
  },
  dark: {
    ambient: 0.25,
    gridCenter: '#444444',
    gridLines: '#333333',
  },
};

export default function PrimitivesTest() {
  const config = useControls(
    'Primitives Test Scene',
    {
      Lighting: folder(
        {
          lightIntensity: {
            label: 'Point Light Intensity',
            value: 1,
            min: 0,
            max: 8,
            step: 0.1,
          },
          lightX: { label: 'Light X', value: 5, min: -20, max: 20, step: 0.1 },
          lightY: { label: 'Light Y', value: 5, min: -20, max: 20, step: 0.1 },
          lightZ: { label: 'Light Z', value: 5, min: -20, max: 20, step: 0.1 },
        },
        { collapsed: true }
      ),
      Visibility: folder(
        {
          showCube: { label: 'Cube', value: true },
          showCone: { label: 'Cone', value: true },
          showCylinder: { label: 'Cylinder', value: true },
          showSphere: { label: 'Sphere', value: true },
          showIcosahedron: { label: 'Icosahedron', value: true },
          showTorusKnot: { label: 'Torus Knot', value: true },
          showMiniNeuralNet: { label: 'Mini Neural Net', value: true },
          showMiniParticleCloud: { label: 'Mini Particle Cloud', value: true },
          showGroundPlane: { label: 'Ground Plane', value: true },
          showGrid: { label: 'Grid', value: true },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  const themeColors =
    SOURCE_THEME_COLORS[config.sourceTheme] || SOURCE_THEME_COLORS.dark;
  const lightPosition = [config.lightX, config.lightY, config.lightZ];

  // Evenly space 6 objects in a 2x3 grid
  const gridSpacing = 12;
  const baseY = 1.5;
  const objects = [
    {
      key: 'cube',
      visible: config.showCube,
      element: (
        <mesh castShadow>
          <boxGeometry args={[2.4, 2.4, 2.4]} />
          <meshPhongMaterial color="#44ccff" flatShading shininess={0} />
        </mesh>
      ),
    },
    {
      key: 'cone',
      visible: config.showCone,
      element: (
        <mesh castShadow>
          <coneGeometry args={[1.5, 2.5, 4]} />
          <meshPhongMaterial color="#ff6644" flatShading shininess={0} />
        </mesh>
      ),
    },
    {
      key: 'cylinder',
      visible: config.showCylinder,
      element: (
        <mesh castShadow>
          <cylinderGeometry args={[1, 1, 2.5, 12]} />
          <meshPhongMaterial color="#44ff66" flatShading shininess={0} />
        </mesh>
      ),
    },
    {
      key: 'sphere',
      visible: config.showSphere,
      element: (
        <mesh castShadow>
          <sphereGeometry args={[1.25, 18, 12]} />
          <meshPhongMaterial color="#ffcc44" flatShading shininess={0} />
        </mesh>
      ),
    },
    {
      key: 'icosahedron',
      visible: config.showIcosahedron,
      element: (
        <mesh castShadow>
          <icosahedronGeometry args={[1.5, 0]} />
          <meshPhongMaterial color="#4466ff" flatShading shininess={0} />
        </mesh>
      ),
    },
    {
      key: 'torusKnot',
      visible: config.showTorusKnot,
      element: (
        <mesh castShadow>
          <torusKnotGeometry args={[2, 0.4, 128, 16, 5, 6]} />
          <meshPhongMaterial color="#ff44cc" flatShading shininess={0} />
        </mesh>
      ),
    },
  ];

  // 2 rows, 3 columns (use first 6 objects)
  const positions = [
    [-gridSpacing, baseY, -gridSpacing],
    [0, baseY, -gridSpacing],
    [gridSpacing, baseY, -gridSpacing],
    [-gridSpacing, baseY, gridSpacing],
    [0, baseY, gridSpacing],
    [gridSpacing, baseY, gridSpacing],
  ];

  return (
    <>
      <PerspectiveCamera makeDefault fov={45} position={[8, 6, 10]} />
      <CameraControls />

      <ambientLight intensity={themeColors.ambient} />
      <pointLight
        castShadow
        intensity={config.lightIntensity}
        position={lightPosition}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      <mesh position={lightPosition} userData={{ excludeFromSVG: true }}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color={0xff8800} toneMapped={false} />
      </mesh>

      {/* Evenly spaced objects for plot rendering test */}
      {objects.slice(0, 6).map((obj, i) => (
        <group key={obj.key} position={positions[i]}>
          {obj.visible ? obj.element : null}
        </group>
      ))}

      {/* Mini neural network — points + line segments, no animation */}
      {config.showMiniNeuralNet ? (
        <MiniNeuralNet position={[-6, 1.5, 0]} />
      ) : null}

      {/* Mini particle cloud — Lorenz attractor, no animation */}
      {config.showMiniParticleCloud ? (
        <MiniParticleCloud position={[6, 1.5, 0]} />
      ) : null}

      {/* Plane and grid */}
      {config.showGroundPlane ? (
        <mesh
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.02, 0]}
        >
          <planeGeometry args={[40, 40, 1, 1]} />
          <meshPhongMaterial color="#b7b7b7" shininess={0} />
        </mesh>
      ) : null}
      {config.showGrid ? (
        <gridHelper
          args={[40, 40, themeColors.gridCenter, themeColors.gridLines]}
        />
      ) : null}
    </>
  );
}
