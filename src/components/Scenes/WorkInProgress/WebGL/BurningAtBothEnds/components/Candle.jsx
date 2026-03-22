import * as THREE from 'three';
import { MarchingCubes as ThreeMarchingCubes } from 'three-stdlib';

import React, { useMemo, useRef } from 'react';

import { Base, Geometry, Subtraction } from '@react-three/csg';
import { useFrame } from '@react-three/fiber';

import Candlewick from './Candlewick';
import Flame from './Flame';

function WaxMetaballCap({ radius, y, inverted = false, config }) {
  const waxSizing = useMemo(() => {
    const spreadBase = Math.max(0.7, config.waxMetaSpread);
    const minOuter = config.waxMetaMinOuter ?? 1;
    const maxOuter = config.waxMetaMaxOuter ?? 1.28;
    const subtract = Math.max(0.001, config.waxMetaSubtract ?? 10);
    const strengthScale = config.waxMetaStrength ?? 1;

    // Approximate max metaball influence radius in the scalar field. Keep a
    // margin so generated surfaces never touch the hard [0,1] cube boundary.
    const maxBaseStrength = 0.6;
    const influenceRadius =
      Math.sqrt((maxBaseStrength * strengthScale) / subtract) * 1.08;
    const safeRadialCeiling = THREE.MathUtils.clamp(
      1 - influenceRadius * 2,
      0.62,
      0.88
    );

    // If spread is too small to satisfy minimum outer diameter without hitting
    // the MC boundary, increase only the internal spread used by this cap.
    const spreadMinForCoverage =
      minOuter / Math.max(0.01, safeRadialCeiling - 0.02);
    const effectiveSpread = Math.max(spreadBase, spreadMinForCoverage);

    const minRingRadius = THREE.MathUtils.clamp(
      minOuter / effectiveSpread,
      0.52,
      safeRadialCeiling - 0.05
    );
    const maxRingRadius = THREE.MathUtils.clamp(
      maxOuter / effectiveSpread,
      minRingRadius + 0.03,
      safeRadialCeiling
    );

    return {
      effectiveSpread,
      minRingRadius,
      maxRingRadius,
    };
  }, [
    config.waxMetaSpread,
    config.waxMetaMinOuter,
    config.waxMetaMaxOuter,
    config.waxMetaStrength,
    config.waxMetaSubtract,
  ]);

  // Build blob ring positions in [0,1] local-grid space (0.5 = center).
  // Using [0,1] coords passed directly to addBall avoids the drei wrapper's
  // world-position mapping (0.5 + worldY * 0.5) which breaks for candle ends
  // at world Y > 1.
  const blobs = useMemo(() => {
    let seed = 1337;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const nodes = [];
    const ringCount = Math.max(12, Math.floor(config.waxMetaBlobCount));
    const { minRingRadius, maxRingRadius } = waxSizing;

    // Dense guard ring guarantees a minimum silhouette around the full circumference.
    const guardCount = Math.max(32, Math.floor(ringCount * 1.75));
    for (let i = 0; i < guardCount; i += 1) {
      const t = i / guardCount;
      const angle = t * Math.PI * 2;
      nodes.push({
        id: `g-${i}`,
        x: 0.5 + Math.cos(angle) * minRingRadius * 0.5,
        z: 0.5 + Math.sin(angle) * minRingRadius * 0.5,
        y: 0.5 + (rand() - 0.5) * 0.04,
        strength: 0.18 + rand() * 0.12,
      });
    }

    for (let i = 0; i < ringCount; i += 1) {
      const t = i / ringCount;
      const angle = t * Math.PI * 2 + (rand() - 0.5) * 0.22;
      // Primary ring runs between min/max outer targets, with slight jitter.
      const radial = minRingRadius + rand() * (maxRingRadius - minRingRadius);
      nodes.push({
        id: `r-${i}`,
        x: 0.5 + Math.cos(angle) * radial * 0.5,
        z: 0.5 + Math.sin(angle) * radial * 0.5,
        y: 0.5 + (rand() - 0.5) * 0.12,
        strength: 0.3 + rand() * 0.3,
      });
    }

    // Inner fill ring to cover the crater area.
    for (let i = 0; i < Math.floor(ringCount * 0.5); i += 1) {
      const angle = rand() * Math.PI * 2;
      const radial = 0.25 + rand() * 0.3;
      nodes.push({
        id: `f-${i}`,
        x: 0.5 + Math.cos(angle) * radial * 0.5,
        z: 0.5 + Math.sin(angle) * radial * 0.5,
        y: 0.5 + (rand() - 0.5) * 0.08,
        strength: 0.18 + rand() * 0.2,
      });
    }

    // Secondary small blobs to break uniformity and fill visible gaps.
    for (let i = 0; i < Math.floor(ringCount * 0.7); i += 1) {
      const angle = rand() * Math.PI * 2;
      const radial = 0.4 + rand() * 0.28;
      nodes.push({
        id: `s-${i}`,
        x: 0.5 + Math.cos(angle) * radial * 0.5,
        z: 0.5 + Math.sin(angle) * radial * 0.5,
        y: 0.5 + (rand() - 0.5) * 0.14,
        strength: 0.14 + rand() * 0.22,
      });
    }

    return nodes;
  }, [config.waxMetaBlobCount, waxSizing]);

  const waxMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#fff6e8',
        roughness: 0.34,
        metalness: 0,
        transmission: 0.05,
        thickness: 0.45,
        ior: 1.45,
        attenuationDistance: 0.65,
        attenuationColor: new THREE.Color('#fff0d6'),
      }),
    []
  );

  const mc = useMemo(
    () =>
      new ThreeMarchingCubes(
        Math.floor(config.waxMetaResolution),
        waxMaterial,
        false,
        false,
        Math.floor(config.waxMetaMaxPolyCount)
      ),
    [config.waxMetaResolution, config.waxMetaMaxPolyCount, waxMaterial]
  );

  useFrame(() => {
    mc.reset();
    blobs.forEach((blob) => {
      mc.addBall(
        blob.x,
        blob.y,
        blob.z,
        blob.strength * config.waxMetaStrength,
        config.waxMetaSubtract
      );
    });
    mc.update();
  });

  return (
    <primitive
      object={mc}
      position={[0, y, 0]}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
      scale={[
        radius * waxSizing.effectiveSpread,
        radius * config.waxMetaHeight,
        radius * waxSizing.effectiveSpread,
      ]}
    />
  );
}

export default function Candle({ config, position = [0, 0, 0] }) {
  const { height, radius, tilt } = config;
  const flameMotion = {
    baseSpeed: config.flameBaseSpeed,
    minSpeed: config.flameMinSpeed,
    slowFreq: config.flameSlowFreq,
    slowAmp: config.flameSlowAmp,
    fastFreq: config.flameFastFreq,
    fastAmp: config.flameFastAmp,
    microFreq: config.flameMicroFreq,
    microAmp: config.flameMicroAmp,
    swayX: config.flameSwayX,
    swayZ: config.flameSwayZ,
    pulseFreq: config.flamePulseFreq,
    pulseAmp: config.flamePulseAmp,
  };
  const waxMeta = {
    enabled: config.waxUseMetaballs ?? true,
    waxMetaResolution: config.waxMetaResolution ?? 30,
    waxMetaMaxPolyCount: config.waxMetaMaxPolyCount ?? 24000,
    waxMetaBlobCount: config.waxMetaBlobCount ?? 22,
    waxMetaStrength: config.waxMetaStrength ?? 1,
    waxMetaSubtract: config.waxMetaSubtract ?? 10,
    waxMetaSpread: config.waxMetaSpread ?? 1.3,
    waxMetaHeight: config.waxMetaHeight ?? 0.72,
    waxMetaMinOuter: config.waxMetaMinOuter ?? 1,
    waxMetaMaxOuter: config.waxMetaMaxOuter ?? 1.28,
  };
  const topLightRef = useRef();
  const bottomLightRef = useRef();

  const candleGeo = useMemo(
    () => new THREE.CylinderGeometry(radius, radius, height, 64),
    [radius, height]
  );
  const craterGeo = useMemo(() => new THREE.SphereGeometry(1, 84, 56), []);
  const craterCuts = useMemo(
    () => [
      {
        id: 'core',
        offset: [0, 0, 0],
        scale: [0.56, 0.32, 0.56],
      },
      {
        id: 'east',
        offset: [0.11, 0.015, 0.02],
        scale: [0.2, 0.14, 0.17],
      },
      {
        id: 'southwest',
        offset: [-0.08, -0.005, -0.09],
        scale: [0.16, 0.1, 0.2],
      },
      {
        id: 'south',
        offset: [0.035, 0.01, -0.11],
        scale: [0.13, 0.09, 0.16],
      },
      {
        id: 'northwest',
        offset: [-0.12, 0, 0.055],
        scale: [0.12, 0.08, 0.13],
      },
    ],
    []
  );
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (topLightRef.current) {
      topLightRef.current.position.x = 0.06 + Math.sin(t * Math.PI) * 0.05;
      topLightRef.current.position.z =
        0.06 + Math.cos(t * Math.PI * 0.75) * 0.05;
      topLightRef.current.intensity =
        2 + Math.sin(t * Math.PI * 2) * Math.cos(t * Math.PI * 1.5) * 0.25;
    }
    if (bottomLightRef.current) {
      bottomLightRef.current.position.x =
        0.06 + Math.sin(t * Math.PI * 1.1) * 0.05;
      bottomLightRef.current.position.z =
        0.06 + Math.cos(t * Math.PI * 0.85) * 0.05;
      bottomLightRef.current.intensity =
        2 + Math.cos(t * Math.PI * 2.2) * Math.sin(t * Math.PI * 1.3) * 0.25;
    }
  });

  const halfH = height / 2;

  return (
    <group
      position={position}
      rotation={[0, 0, THREE.MathUtils.degToRad(tilt)]}
    >
      {/* Candle body */}
      <mesh>
        <Geometry computeVertexNormals>
          <Base geometry={candleGeo} />

          {craterCuts.map((cut) => (
            <Subtraction
              key={`top-crater-${cut.id}`}
              geometry={craterGeo}
              position={[
                cut.offset[0] * radius,
                halfH - radius * 0.24 + cut.offset[1] * radius,
                cut.offset[2] * radius,
              ]}
              scale={[
                radius * cut.scale[0],
                radius * cut.scale[1],
                radius * cut.scale[2],
              ]}
            />
          ))}
          {craterCuts.map((cut) => (
            <Subtraction
              key={`bottom-crater-${cut.id}`}
              geometry={craterGeo}
              position={[
                cut.offset[0] * radius,
                -halfH + radius * 0.24 - cut.offset[1] * radius,
                cut.offset[2] * radius,
              ]}
              scale={[
                radius * cut.scale[0],
                radius * cut.scale[1],
                radius * cut.scale[2],
              ]}
            />
          ))}
        </Geometry>
        <meshPhysicalMaterial
          color="#f8f6f1"
          roughness={0.46}
          metalness={0}
          transmission={0.08}
          thickness={0.7}
          ior={1.45}
          attenuationDistance={0.8}
          attenuationColor="#fff1d8"
          clearcoat={0.08}
          clearcoatRoughness={0.55}
        />
      </mesh>

      {waxMeta.enabled && (
        <>
          <WaxMetaballCap
            radius={radius}
            y={halfH + radius * 0.02}
            config={waxMeta}
          />
          <WaxMetaballCap
            radius={radius}
            y={-halfH - radius * 0.02}
            config={waxMeta}
            inverted
          />
        </>
      )}

      {/* Top flame assembly */}
      <Candlewick position={[0, halfH, 0]} />
      <Flame position={[0.06, halfH + 0.21, 0.06]} motion={flameMotion} />
      <pointLight
        ref={topLightRef}
        color={0xffaa33}
        intensity={2}
        distance={8}
        decay={2}
        position={[0.06, halfH + 0.23, 0.06]}
      />

      {/* Bottom flame assembly (inverted) */}
      <Candlewick position={[0, -halfH, 0]} inverted />
      <Flame
        position={[0.06, -halfH - 0.21, 0.06]}
        inverted
        motion={flameMotion}
      />
      <pointLight
        ref={bottomLightRef}
        color={0xffaa33}
        intensity={2}
        distance={8}
        decay={2}
        position={[0.06, -halfH - 0.23, 0.06]}
      />
    </group>
  );
}
