import * as THREE from 'three';

import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  MAX_ANIMATION_DELTA,
  ORBIT_RING_WIDTH,
  TAU,
} from './solarSystem.constants';
import useSolarSystemTextures from './useSolarSystemTextures';

function setOrbitPosition(target, radius, angle) {
  target.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}

const OrbitPath = memo(function OrbitPath({ radius, color, opacity }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <ringGeometry
        args={[radius - ORBIT_RING_WIDTH, radius + ORBIT_RING_WIDTH, 128]}
      />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
});

const SolarPlanet = memo(function SolarPlanet({
  config,
  showOrbit = true,
  orbitColor = '#8ea2ff',
  orbitOpacity = 0.14,
  orbitSpeedMultiplier = 1,
  rotationSpeedMultiplier = 1,
  shadowsEnabled = false,
  textures: providedTextures,
}) {
  const loadedTextures = useSolarSystemTextures();
  const textures = providedTextures ?? loadedTextures;
  const orbitRef = useRef(null);
  const planetRef = useRef(null);
  const atmosphereRef = useRef(null);
  const moonNodesRef = useRef({});
  const planetStateRef = useRef({
    orbitAngle: config.initialOrbitAngle ?? 0,
    rotationAngle: config.initialRotationAngle ?? 0,
  });
  const moons = useMemo(() => config.moons ?? [], [config.moons]);
  const moonStatesRef = useRef(
    Object.fromEntries(
      moons.map((moon) => [
        moon.name,
        {
          orbitAngle: moon.initialOrbitAngle ?? 0,
          rotationAngle: moon.initialRotationAngle ?? 0,
        },
      ])
    )
  );

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, MAX_ANIMATION_DELTA);
    const planetState = planetStateRef.current;

    planetState.orbitAngle = THREE.MathUtils.euclideanModulo(
      planetState.orbitAngle +
        safeDelta * config.orbitSpeed * orbitSpeedMultiplier,
      TAU
    );
    planetState.rotationAngle = THREE.MathUtils.euclideanModulo(
      planetState.rotationAngle +
        safeDelta * config.rotationSpeed * rotationSpeedMultiplier,
      TAU
    );

    if (orbitRef.current) {
      setOrbitPosition(
        orbitRef.current,
        config.orbitRadius,
        planetState.orbitAngle
      );
    }

    if (planetRef.current) {
      planetRef.current.rotation.y = planetState.rotationAngle;
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = planetState.rotationAngle * 0.6;
    }

    moons.forEach((moon) => {
      const moonState = moonStatesRef.current[moon.name];
      const moonNodes = moonNodesRef.current[moon.name];

      moonState.orbitAngle = THREE.MathUtils.euclideanModulo(
        moonState.orbitAngle +
          safeDelta * moon.orbitSpeed * orbitSpeedMultiplier,
        TAU
      );
      moonState.rotationAngle = THREE.MathUtils.euclideanModulo(
        moonState.rotationAngle + safeDelta * moon.rotationSpeed,
        TAU
      );

      if (moonNodes?.orbit) {
        setOrbitPosition(
          moonNodes.orbit,
          moon.orbitRadius,
          moonState.orbitAngle
        );
      }

      if (moonNodes?.mesh) {
        moonNodes.mesh.rotation.y = moonState.rotationAngle;
      }
    });
  });

  return (
    <>
      {showOrbit ? (
        <OrbitPath
          radius={config.orbitRadius}
          color={orbitColor}
          opacity={orbitOpacity}
        />
      ) : null}

      <group ref={orbitRef} position={[config.orbitRadius, 0, 0]}>
        <group rotation={[0, 0, THREE.MathUtils.degToRad(config.axialTilt)]}>
          <mesh
            ref={planetRef}
            castShadow={shadowsEnabled}
            receiveShadow={shadowsEnabled}
          >
            <sphereGeometry args={[config.radius, 32, 32]} />
            <meshStandardMaterial
              map={textures[config.colorMap]}
              bumpMap={config.bumpMap ? textures[config.bumpMap] : null}
              bumpScale={config.bumpScale ?? 0}
              emissiveMap={
                config.emissiveMap ? textures[config.emissiveMap] : null
              }
              emissive={config.emissiveColor ?? '#000000'}
              emissiveIntensity={config.emissiveIntensity ?? 0}
              roughness={config.roughness ?? 0.9}
              metalness={0}
            />
          </mesh>

          {config.atmosphereMap ? (
            <mesh
              ref={atmosphereRef}
              scale={1.08}
              receiveShadow={shadowsEnabled}
            >
              <sphereGeometry args={[config.radius, 32, 32]} />
              <meshStandardMaterial
                map={textures[config.atmosphereMap]}
                transparent
                opacity={config.atmosphereOpacity ?? 0.24}
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ) : null}

          {config.ring ? (
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow={shadowsEnabled}
            >
              <ringGeometry
                args={[config.ring.innerRadius, config.ring.outerRadius, 128]}
              />
              <meshStandardMaterial
                map={textures[config.ring.texture]}
                alphaMap={textures[config.ring.texture]}
                transparent
                opacity={config.ring.opacity ?? 0.7}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ) : null}

          {moons.map((moon) => (
            <group
              key={`${config.name}-${moon.name}`}
              ref={(node) => {
                const existing = moonNodesRef.current[moon.name] ?? {};
                moonNodesRef.current[moon.name] = {
                  ...existing,
                  orbit: node,
                };
              }}
              position={[moon.orbitRadius, 0, 0]}
            >
              <mesh
                ref={(node) => {
                  const existing = moonNodesRef.current[moon.name] ?? {};
                  moonNodesRef.current[moon.name] = {
                    ...existing,
                    mesh: node,
                  };
                }}
                castShadow={shadowsEnabled}
                receiveShadow={shadowsEnabled}
              >
                <sphereGeometry args={[moon.radius, 24, 24]} />
                <meshStandardMaterial
                  map={textures[moon.colorMap]}
                  bumpMap={moon.bumpMap ? textures[moon.bumpMap] : null}
                  bumpScale={moon.bumpScale ?? 0}
                  roughness={moon.roughness ?? 0.95}
                  metalness={0}
                />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </>
  );
});

export default SolarPlanet;
