/* eslint-disable react/no-array-index-key */
import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// Electron shell configuration: max electrons per shell

const SHELLS = [2, 8, 8, 18, 18, 32, 32];
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
    const nucleusRadius = shellSpacing * 0.5;
    for (let i = 0; i < total; i += 1) {
      // Random point inside a sphere (Marsaglia method)
      let x;
      let y;
      let z;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
      } while (x * x + y * y + z * z > 1);
      x *= nucleusRadius;
      y *= nucleusRadius;
      z *= nucleusRadius;
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
  }, [protonsFinal, neutronsFinal, protonRadius, neutronRadius, shellSpacing]);

  // Shells and electrons
  const shellConfig = useMemo(
    () => getShellConfig(electronsFinal),
    [electronsFinal]
  );
  const shells = useMemo(() => {
    return shellConfig.map((count, shellIdx) => {
      const radius = 1 + shellIdx * shellSpacing;
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
