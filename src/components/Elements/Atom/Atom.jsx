/* eslint-disable react/no-array-index-key */
import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// Electron shell configuration: max electrons per shell

const SHELLS = [2, 8, 8, 18, 18, 32, 32];
const FIRST_SHELL_RADIUS = 1;

function getShellConfig(electronCount) {
  let remaining = electronCount;
  const config = [];
  for (let i = 0; i < SHELLS.length && remaining > 0; i += 1) {
    const count = Math.min(SHELLS[i], remaining);
    config.push(count);
    remaining -= count;
  }
  return config;
}

function getNucleusRadius(totalNucleons, nucleonRadius) {
  const estimatedClusterRadius =
    nucleonRadius * Math.cbrt(totalNucleons) * 0.95;
  return Math.min(estimatedClusterRadius, FIRST_SHELL_RADIUS * 0.5);
}

function getNucleusPositions(totalNucleons, nucleusRadius) {
  const cellsPerAxis = Math.max(3, Math.ceil(Math.cbrt(totalNucleons)) + 2);
  const step = (nucleusRadius * 2) / (cellsPerAxis - 1);
  const offset = nucleusRadius;
  const points = [];

  for (let xi = 0; xi < cellsPerAxis; xi += 1) {
    for (let yi = 0; yi < cellsPerAxis; yi += 1) {
      for (let zi = 0; zi < cellsPerAxis; zi += 1) {
        const x = xi * step - offset;
        const y = yi * step - offset;
        const z = zi * step - offset;
        const distSq = x * x + y * y + z * z;
        if (distSq <= nucleusRadius * nucleusRadius) {
          points.push({ x, y, z, distSq });
        }
      }
    }
  }

  points.sort((a, b) => a.distSq - b.distSq);

  // Keep deterministic grid packing first, then fill any shortfall.
  if (points.length < totalNucleons) {
    const shortfall = totalNucleons - points.length;
    for (let i = 0; i < shortfall; i += 1) {
      let x;
      let y;
      let z;
      do {
        x = (Math.random() * 2 - 1) * nucleusRadius;
        y = (Math.random() * 2 - 1) * nucleusRadius;
        z = (Math.random() * 2 - 1) * nucleusRadius;
      } while (x * x + y * y + z * z > nucleusRadius * nucleusRadius);
      points.push({ x, y, z, distSq: x * x + y * y + z * z });
    }
    points.sort((a, b) => a.distSq - b.distSq);
  }

  return points.slice(0, totalNucleons);
}

export default function Atom({
  atomicNumber = 8,
  protons,
  neutrons,
  electrons,
  protonRadius = 0.18,
  neutronRadius = 0.18,
  electronRadius = 0.09,
  shellRingWidth = 0.01,
  shellSpacing = 0.5,
  animateElectrons = false,
  ...props
}) {
  // Default to atomicNumber if explicit values not provided
  const protonsFinal = typeof protons === 'number' ? protons : atomicNumber;
  const electronsFinal =
    typeof electrons === 'number' ? electrons : atomicNumber;
  const neutronsFinal = typeof neutrons === 'number' ? neutrons : atomicNumber;

  const groupRef = useRef();
  const electronGroupRefs = useRef([]);

  // Nucleus: cluster of protons (red) and neutrons (black), packed within a sphere inside the first shell
  const nucleus = useMemo(() => {
    const spheres = [];
    const total = protonsFinal + neutronsFinal;
    const nucleonRadius = Math.max(protonRadius, neutronRadius);
    const nucleusRadius = getNucleusRadius(total, nucleonRadius);
    const positions = getNucleusPositions(total, nucleusRadius);

    for (let i = 0; i < total; i += 1) {
      const { x, y, z } = positions[i];
      const isProton = i < protonsFinal;
      spheres.push(
        <mesh key={`nucleus-${isProton ? 'p' : 'n'}-${i}`} position={[x, y, z]}>
          <sphereGeometry
            args={[isProton ? protonRadius : neutronRadius, 16, 16]}
          />
          <meshStandardMaterial color={isProton ? 'red' : 'black'} />
        </mesh>
      );
    }
    return spheres;
  }, [protonsFinal, neutronsFinal, protonRadius, neutronRadius]);

  // Shells and electrons
  const shellConfig = useMemo(
    () => getShellConfig(electronsFinal),
    [electronsFinal]
  );
  const shells = useMemo(() => {
    return shellConfig.map((count, shellIdx) => {
      const radius = FIRST_SHELL_RADIUS + shellIdx * shellSpacing;
      // Ring (shell)
      const ring = (
        <mesh key={`ring-shell-${shellIdx}`} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, shellRingWidth, 16, 64]} />
          <meshStandardMaterial color="black" metalness={0.2} roughness={0.7} />
        </mesh>
      );
      // Electrons
      const electronsArr = [];
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2;
        electronsArr.push(
          <mesh
            key={`electron-shell-${shellIdx}-e-${i}`}
            position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
          >
            <sphereGeometry args={[electronRadius, 16, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
        );
      }
      return (
        <group
          key={`shell-group-${shellIdx}`}
          ref={(el) => {
            electronGroupRefs.current[shellIdx] = el;
          }}
        >
          {ring}
          {electronsArr}
        </group>
      );
    });
  }, [shellConfig, shellRingWidth, shellSpacing, electronRadius]);

  // Animate electrons
  useFrame((state, delta) => {
    if (animateElectrons) {
      shellConfig.forEach((count, shellIdx) => {
        const group = electronGroupRefs.current[shellIdx];
        if (group) {
          group.rotation.y += 0.3 * (shellIdx + 1) * delta;
        }
      });
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {nucleus}
      {shells}
    </group>
  );
}
