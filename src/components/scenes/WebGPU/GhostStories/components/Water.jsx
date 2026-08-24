import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';

import * as THREE from 'three/webgpu';

import buildWaterChunk from '../utils/waterChunk';
import createWaterMaterial from '../utils/waterMaterial';
import createWaterSim, { CELL } from '../utils/waterSim';
import { CHUNK_SIZE, chunkCoord, ringChunks } from '../utils/worldgen';

// Water lives ONLY in the basins: each chunk builds a flat grid clipped to
// cells where the terrain dips below the table (utils/waterChunk.js), so
// paths and meadow never get a film of waving water. Every water vertex
// samples the shared ghost-ripple compute field by world position
// (utils/waterSim.js + waterMaterial.js) — high detail near the ghost,
// coarse grids further out.
const FINE_SEGMENTS = 96; // 0.5m cells, close to the ripple field density
const COARSE_SEGMENTS = 24;

function WaterChunkMesh({ cx, cz, segments, sim, world }) {
  const geometry = useMemo(
    () => buildWaterChunk(world, cx, cz, segments),
    [cx, cz, segments, world]
  );
  useEffect(() => () => geometry?.dispose(), [geometry]);

  const material = useMemo(
    () =>
      geometry
        ? createWaterMaterial({
            chunkOffsetX: cx * CHUNK_SIZE,
            chunkOffsetZ: cz * CHUNK_SIZE,
            sim,
          })
        : null,
    [cx, cz, geometry, sim]
  );
  useEffect(() => () => material?.dispose(), [material]);

  if (!geometry) return null;

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[cx * CHUNK_SIZE, world.waterLevel, cz * CHUNK_SIZE]}
    />
  );
}

const MemoWaterChunkMesh = memo(WaterChunkMesh);

function Water({ config, tracker, world }) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;
  const pingPongRef = useRef(0);
  const frameRef = useRef(0);
  const anchorRef = useRef({ x: 0, z: 0 });
  const prevGhostRef = useRef(new THREE.Vector2());
  const [center, setCenter] = useState({ cx: 0, cz: 0 });

  const sim = useMemo(
    () => (isWebGPU ? createWaterSim(config) : null),
    [isWebGPU]
  );

  useEffect(() => {
    if (!sim) return;
    sim.uniforms.ambientAmp.value = config.waterWaveAmp;
    sim.uniforms.deepColor.value.set(config.waterColor);
    sim.uniforms.disturbDeep.value = config.waterDisturbDepth;
    sim.uniforms.disturbSize.value = config.waterDisturbSize;
    sim.uniforms.opacity.value = config.waterOpacity;
    sim.uniforms.skyColor.value.set(config.waterSkyColor);
    sim.uniforms.viscosity.value = config.waterViscosity;
  }, [
    config.waterColor,
    config.waterDisturbDepth,
    config.waterDisturbSize,
    config.waterOpacity,
    config.waterSkyColor,
    config.waterViscosity,
    config.waterWaveAmp,
    sim,
  ]);

  useFrame(() => {
    if (!sim) return;

    // Follow the ghost, snapped to whole ripple-field cells; shift the
    // field by the covered cells so ripples stay pinned to the world.
    const targetX = Math.round(tracker.position.x / CELL) * CELL;
    const targetZ = Math.round(tracker.position.z / CELL) * CELL;
    const anchor = anchorRef.current;
    const cellsX = Math.round((targetX - anchor.x) / CELL);
    const cellsZ = Math.round((targetZ - anchor.z) / CELL);

    if (cellsX !== 0 || cellsZ !== 0) {
      anchor.x = targetX;
      anchor.z = targetZ;
      sim.uniforms.shift.value.set(cellsX, cellsZ);
      if (pingPongRef.current === 0) {
        gl.compute(sim.shiftAtoB, [8, 8, 1]);
        sim.uniforms.readFromA.value = 0;
      } else {
        gl.compute(sim.shiftBtoA, [8, 8, 1]);
        sim.uniforms.readFromA.value = 1;
      }
      pingPongRef.current = 1 - pingPongRef.current;
    }
    sim.uniforms.anchor.value.set(anchor.x, anchor.z);

    const cx = chunkCoord(tracker.position.x);
    const cz = chunkCoord(tracker.position.z);
    if (cx !== center.cx || cz !== center.cz) {
      setCenter({ cx, cz });
    }

    // The ghost stirs the water when it is down at the surface.
    const ghostX = tracker.position.x - anchor.x;
    const ghostZ = tracker.position.z - anchor.z;
    const nearSurface =
      Math.abs(tracker.position.y - world.waterLevel) < config.waterTouchHeight;

    if (nearSurface) {
      const prev = prevGhostRef.current;
      sim.uniforms.disturbSpeed.value.set(ghostX - prev.x, ghostZ - prev.y);
      sim.uniforms.disturbPos.value.set(ghostX, ghostZ);
      prev.set(ghostX, ghostZ);
    } else {
      sim.uniforms.disturbSpeed.value.set(0, 0);
      prevGhostRef.current.set(ghostX, ghostZ);
    }

    // Step the sim on alternating buffers, a few frames apart like the
    // source example's speed control.
    frameRef.current += 1;
    if (frameRef.current >= 7 - config.waterSimSpeed) {
      if (pingPongRef.current === 0) {
        gl.compute(sim.stepAtoB, [8, 8, 1]);
        sim.uniforms.readFromA.value = 0;
      } else {
        gl.compute(sim.stepBtoA, [8, 8, 1]);
        sim.uniforms.readFromA.value = 1;
      }
      pingPongRef.current = 1 - pingPongRef.current;
      frameRef.current = 0;
    }
  });

  const chunks = useMemo(
    () => ringChunks(center.cx, center.cz, config.chunkRadius),
    [center.cx, center.cz, config.chunkRadius]
  );

  if (!sim || !config.waterEnabled) return null;

  const colliderExtent = (config.chunkRadius + 0.5) * CHUNK_SIZE;

  return (
    <>
      {chunks.map(({ cx, cz, dist }) => (
        <MemoWaterChunkMesh
          key={`${cx}:${cz}`}
          cx={cx}
          cz={cz}
          segments={dist <= 1 ? FINE_SEGMENTS : COARSE_SEGMENTS}
          sim={sim}
          world={world}
        />
      ))}

      {/* Thin surface collider: Ecctrl's float ray rides the water instead
          of sinking to the pond floor. Under dry land it hides below the
          terrain, so it only matters over ponds. Re-keyed per chunk so it
          stays under the ghost. */}
      <RigidBody
        key={`${center.cx}:${center.cz}`}
        colliders={false}
        position={[
          center.cx * CHUNK_SIZE,
          world.waterLevel - 0.08,
          center.cz * CHUNK_SIZE,
        ]}
        type="fixed"
      >
        <CuboidCollider args={[colliderExtent, 0.05, colliderExtent]} />
      </RigidBody>
    </>
  );
}

export default memo(Water);
