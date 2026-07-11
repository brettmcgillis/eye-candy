import { ClusteredLighting } from 'three/addons/lighting/ClusteredLighting.js';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { MAX_HUNTERS } from '../utils/createFloidsSimulation';
import flashIntensity from '../utils/flashIntensity';

const LIGHT_POWER = 45;
const FIREFLY_LIGHT_DISTANCE_UNIT = 2.2;
const FIREFLY_BASE_COLOR = new THREE.Color('#6f6f6f');
const FIREFLY_GLOW_COLOR = new THREE.Color('#f9bb50');
// Stable ids for keys — MAX_HUNTERS is a fixed constant (never
// reordered/resized at runtime), so this pairing never drifts.
const HUNTER_IDS = ['hunter-a', 'hunter-b', 'hunter-c'];

// Real point lights are a FIXED pool, deliberately decoupled from
// fireflyCount (which can go up to 1000 — Floids' own reference runs 700
// agents, but those are cheap unlit sprites, not lights). One real
// WebGPU point light per firefly was the actual cause of the hard
// multi-second freeze at high counts: `renderer.lighting =
// new ClusteredLighting(fireflyCount + 2, ...)` recreated the lighting
// system's shader graph (and forced every lit material's pipeline to
// recompile) every time the count changed, scaling up to 700+ lights —
// WebGPU pipeline compilation at that scale is exactly the kind of
// synchronous main-thread stall that locks a whole browser tab. Every
// firefly still gets the correct matte-grey-to-glow body color (that's
// the instanced material, not a light); only a small, constant-size pool
// of the currently-brightest fireflies gets a real light, first-come
// first-served up to BRIGHT_THRESHOLD each frame — plenty for the
// hunter-reflection effect without the pipeline ever needing to change
// shape as fireflyCount moves.
const MAX_REAL_LIGHTS = 64;
const BRIGHT_THRESHOLD = 0.1;

// Pure renderer: all flock/hunter physics lives in hooks/useSharedSwarm.js
// (host-authoritative across every open tab/window) — this component only
// reads the shared position/clock/hunter buffers each frame and draws
// them. No simulation, no multi-tab logic of its own.
const FloidsSwarm = memo(function FloidsSwarm({
  clocksRef,
  config,
  hunterCountRef,
  hunterPositionsRef,
  positionsRef,
}) {
  const { gl: renderer } = useThree();
  const bodiesRef = useRef(null);
  const hunterRefs = useRef([]);
  const lightsRef = useRef([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  // Shared warm firefly hue with a small spawn-time jitter, precomputed
  // once for the fixed-size light pool (not per firefly — the pool never
  // changes size, so this never needs to be recomputed).
  const lightPool = useMemo(
    () =>
      Array.from({ length: MAX_REAL_LIGHTS }, (_, index) => {
        const glow = FIREFLY_GLOW_COLOR.clone();
        glow.offsetHSL(
          (Math.random() - 0.5) * 0.05,
          0,
          (Math.random() - 0.5) * 0.08
        );
        return { color: glow, id: `light-${index}` };
      }),
    []
  );

  // Created once, sized for the fixed light pool — never recreated when
  // fireflyCount changes, so adjusting that slider never triggers a
  // shader/pipeline recompile.
  useEffect(() => {
    const previousLighting = renderer.lighting;
    renderer.lighting = new ClusteredLighting(MAX_REAL_LIGHTS + 2, 48, 16, 32);
    return () => {
      renderer.lighting = previousLighting;
    };
  }, [renderer]);

  useFrame(() => {
    const bodies = bodiesRef.current;
    const positions = positionsRef.current;
    const clocks = clocksRef.current;
    if (!bodies || !positions.length || !clocks.length) return;

    const count = Math.min(config.fireflyCount, clocks.length);
    let litCount = 0;
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const flash = flashIntensity(clocks[index], config.fireCycle);
      dummy.position.set(
        positions[offset],
        positions[offset + 1],
        positions[offset + 2]
      );
      dummy.scale.setScalar(config.fireflySize * 0.025 * (0.7 + flash * 0.5));
      dummy.updateMatrix();
      bodies.setMatrixAt(index, dummy.matrix);
      color.lerpColors(FIREFLY_BASE_COLOR, FIREFLY_GLOW_COLOR, flash);
      bodies.setColorAt(index, color);

      if (flash > BRIGHT_THRESHOLD && litCount < MAX_REAL_LIGHTS) {
        const light = lightsRef.current[litCount];
        if (light) {
          light.position.copy(dummy.position);
          light.power = LIGHT_POWER * config.lightIntensity * flash;
        }
        litCount += 1;
      }
    }
    // Any pool lights not claimed by a bright-enough firefly this frame
    // stay dark rather than lingering at last frame's position/power.
    for (let i = litCount; i < MAX_REAL_LIGHTS; i += 1) {
      const light = lightsRef.current[i];
      if (light) light.power = 0;
    }
    bodies.instanceMatrix.needsUpdate = true;
    if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;

    const hunterCount = hunterCountRef.current;
    const hunterPositions = hunterPositionsRef.current;
    for (let h = 0; h < MAX_HUNTERS; h += 1) {
      const hunter = hunterRefs.current[h];
      if (hunter) {
        const active = h < hunterCount;
        hunter.visible = active;
        if (active) {
          const hOffset = h * 3;
          hunter.position.set(
            hunterPositions[hOffset],
            hunterPositions[hOffset + 1],
            hunterPositions[hOffset + 2]
          );
        }
      }
    }
  });

  return (
    <>
      <instancedMesh
        ref={bodiesRef}
        args={[undefined, undefined, config.fireflyCount]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial metalness={0} roughness={0.85} vertexColors />
      </instancedMesh>
      {lightPool.map(({ color: lightColor, id }, index) => (
        <pointLight
          key={id}
          ref={(light) => {
            lightsRef.current[index] = light;
          }}
          color={lightColor}
          decay={2}
          distance={FIREFLY_LIGHT_DISTANCE_UNIT * config.fireflyGlow}
        />
      ))}
      {HUNTER_IDS.map((id, index) => (
        <mesh
          key={id}
          ref={(mesh) => {
            hunterRefs.current[index] = mesh;
          }}
        >
          <sphereGeometry args={[config.hunterRadius * 0.055, 64, 32]} />
          <meshPhysicalMaterial
            color="#050505"
            roughness={0.2}
            metalness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>
      ))}
    </>
  );
});

export default FloidsSwarm;
