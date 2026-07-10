/* eslint-disable camelcase */
import {
  Fn,
  clamp,
  cos,
  float,
  instanceIndex,
  instancedArray,
  int,
  length,
  max,
  min,
  positionLocal,
  select,
  transformNormalToView,
  uint,
  uniform,
  vec2,
  vec3,
  vertexIndex,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { CHUNK_SIZE, chunkCoord } from '../utils/worldgen';

// Ghost-reactive water, ported from three.js `webgpu_compute_water`: a
// ping-pong pair of height storage buffers stepped by a TSL compute pass
// (neighbor-average wave equation + viscosity), with the disturbance point
// driven by the ghost instead of the mouse. The sim patch is anchored to
// the ghost's current chunk (snapping only at chunk crossings, so ripples
// stay world-stable around a pond) and spans 3 chunks so ponds at the seam
// still ripple. The plane sits at the global water table; terrain above it
// simply occludes it.
const WIDTH = 128;
const BOUNDS = CHUNK_SIZE * 3;

function Water({ config, tracker, world }) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;
  const meshRef = useRef(null);
  const pingPongRef = useRef(0);
  const frameRef = useRef(0);
  const anchorRef = useRef({ cx: 0, cz: 0 });
  const prevGhostRef = useRef(new THREE.Vector2());

  const sim = useMemo(() => {
    if (!isWebGPU) return null;

    const cellCount = WIDTH * WIDTH;
    const heightStorageA = instancedArray(new Float32Array(cellCount)).setName(
      'GhostWaterHeightA'
    );
    const heightStorageB = instancedArray(new Float32Array(cellCount)).setName(
      'GhostWaterHeightB'
    );
    const prevHeightStorage = instancedArray(
      new Float32Array(cellCount)
    ).setName('GhostWaterPrevHeight');

    const uniforms = {
      disturbDeep: uniform(0.35),
      disturbPos: uniform(new THREE.Vector2(1e5, 1e5)),
      disturbSize: uniform(0.6),
      disturbSpeed: uniform(new THREE.Vector2(0, 0)),
      readFromA: uniform(1),
      viscosity: uniform(0.96),
    };

    const getNeighborIndicesTSL = (index) => {
      const width = uint(WIDTH);
      const x = int(index.mod(WIDTH));
      const y = int(index.div(WIDTH));

      const leftX = max(0, x.sub(1));
      const rightX = min(x.add(1), width.sub(1));
      const bottomY = max(0, y.sub(1));
      const topY = min(y.add(1), width.sub(1));

      return {
        eastIndex: y.mul(width).add(rightX),
        northIndex: topY.mul(width).add(x),
        southIndex: bottomY.mul(width).add(x),
        westIndex: y.mul(width).add(leftX),
      };
    };

    const getNeighborValuesTSL = (index, store) => {
      const { eastIndex, northIndex, southIndex, westIndex } =
        getNeighborIndicesTSL(index);
      return {
        east: store.element(eastIndex),
        north: store.element(northIndex),
        south: store.element(southIndex),
        west: store.element(westIndex),
      };
    };

    const createComputeHeight = (readBuffer, writeBuffer) =>
      Fn(() => {
        const height = readBuffer.element(instanceIndex).toVar();
        const prevHeight = prevHeightStorage.element(instanceIndex).toVar();

        const { east, north, south, west } = getNeighborValuesTSL(
          instanceIndex,
          readBuffer
        );

        const neighborHeight = north.add(south).add(east).add(west).toVar();
        neighborHeight.mulAssign(0.5);
        neighborHeight.subAssign(prevHeight);

        const newHeight = neighborHeight.mul(uniforms.viscosity).toVar();

        // Cell position in patch space [-BOUNDS/2, BOUNDS/2].
        const x = float(int(instanceIndex.mod(WIDTH)))
          .mul(1 / WIDTH)
          .sub(0.5)
          .mul(BOUNDS);
        const y = float(int(instanceIndex.div(WIDTH)))
          .mul(1 / WIDTH)
          .sub(0.5)
          .mul(BOUNDS);

        // Ghost influence: press the surface down around the disturbance
        // point, scaled by how fast the ghost is moving.
        const phase = clamp(
          length(vec2(x, y).sub(uniforms.disturbPos))
            .mul(Math.PI)
            .div(uniforms.disturbSize),
          0.0,
          Math.PI
        );
        newHeight.addAssign(
          cos(phase)
            .add(1.0)
            .mul(uniforms.disturbDeep)
            .mul(uniforms.disturbSpeed.length().min(1))
        );

        prevHeightStorage.element(instanceIndex).assign(height);
        writeBuffer.element(instanceIndex).assign(newHeight);
      })().compute(cellCount, [16, 16]);

    const clearPass = Fn(() => {
      heightStorageA.element(instanceIndex).assign(0);
      heightStorageB.element(instanceIndex).assign(0);
      prevHeightStorage.element(instanceIndex).assign(0);
    })().compute(cellCount, [16, 16]);

    const getCurrentHeight = (index) =>
      select(
        uniforms.readFromA,
        heightStorageA.element(index),
        heightStorageB.element(index)
      );

    const material = new THREE.MeshStandardNodeMaterial({
      color: new THREE.Color(config.waterColor),
      metalness: 0.9,
      opacity: config.waterOpacity,
      roughness: 0.15,
      side: THREE.DoubleSide,
      transparent: true,
    });

    material.positionNode = Fn(() =>
      vec3(positionLocal.x, positionLocal.y, getCurrentHeight(vertexIndex))
    )();

    material.normalNode = Fn(() => {
      const { eastIndex, northIndex, southIndex, westIndex } =
        getNeighborIndicesTSL(vertexIndex);
      const north = getCurrentHeight(northIndex);
      const south = getCurrentHeight(southIndex);
      const east = getCurrentHeight(eastIndex);
      const west = getCurrentHeight(westIndex);

      const normalX = west.sub(east).mul(WIDTH / BOUNDS);
      const normalY = south.sub(north).mul(WIDTH / BOUNDS);

      return transformNormalToView(
        vec3(normalX, normalY.negate(), 1.0)
      ).toVertexStage();
    })();

    return {
      clearPass,
      computeAtoB: createComputeHeight(heightStorageA, heightStorageB),
      computeBtoA: createComputeHeight(heightStorageB, heightStorageA),
      material,
      uniforms,
    };
    // Material color/opacity sync below; sim itself never rebuilds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWebGPU]);

  useEffect(() => {
    if (!sim) return;
    sim.material.color.set(config.waterColor);
    sim.material.opacity = config.waterOpacity;
    sim.uniforms.viscosity.value = config.waterViscosity;
    sim.uniforms.disturbSize.value = config.waterDisturbSize;
    sim.uniforms.disturbDeep.value = config.waterDisturbDepth;
  }, [
    config.waterColor,
    config.waterDisturbDepth,
    config.waterDisturbSize,
    config.waterOpacity,
    config.waterViscosity,
    sim,
  ]);

  useEffect(() => () => sim?.material.dispose(), [sim]);

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(BOUNDS, BOUNDS, WIDTH - 1, WIDTH - 1),
    []
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    if (!sim || !meshRef.current) return;

    // Re-anchor the patch when the ghost crosses into a new chunk; ripples
    // reset (cleared) — under night fog the snap is invisible.
    const cx = chunkCoord(tracker.position.x);
    const cz = chunkCoord(tracker.position.z);
    const anchor = anchorRef.current;
    if (cx !== anchor.cx || cz !== anchor.cz) {
      anchor.cx = cx;
      anchor.cz = cz;
      gl.compute(sim.clearPass);
    }
    const anchorX = anchor.cx * CHUNK_SIZE;
    const anchorZ = anchor.cz * CHUNK_SIZE;
    meshRef.current.position.set(anchorX, world.waterLevel, anchorZ);

    // The ghost only stirs the water when it is actually down at the
    // surface (gliding over a pond), not cresting a hill above it.
    const ghostX = tracker.position.x - anchorX;
    const ghostZ = tracker.position.z - anchorZ;
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
        gl.compute(sim.computeAtoB, [8, 8, 1]);
        sim.uniforms.readFromA.value = 0;
      } else {
        gl.compute(sim.computeBtoA, [8, 8, 1]);
        sim.uniforms.readFromA.value = 1;
      }
      pingPongRef.current = 1 - pingPongRef.current;
      frameRef.current = 0;
    }
  });

  if (!sim || !config.waterEnabled) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={sim.material}
      position={[0, world.waterLevel, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}

export default memo(Water);
