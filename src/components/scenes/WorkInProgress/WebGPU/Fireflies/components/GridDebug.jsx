import * as THREE from 'three';

import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const dummy = new THREE.Object3D();
const HIDDEN = new THREE.Vector3(1e6, 1e6, 1e6);

// Static reference lattice (every cell boundary, occupied or not) so the
// partition reads as "a grid of the area" the way boids-js's own debug view
// does — the previous version only ever drew occupied cells, which (once
// the flock condenses toward its cohesion-driven cluster, as boid flocks
// without a strong repulsion term always do) looked like a handful of boxes
// floating near the center with no sense of the grid actually covering the
// full worldSize box.
function buildGridLines(worldSize, rowCount) {
  const half = worldSize / 2;
  const cellSize = worldSize / rowCount;
  const points = [];

  for (let i = 0; i <= rowCount; i += 1) {
    const a = -half + i * cellSize;
    for (let j = 0; j <= rowCount; j += 1) {
      const b = -half + j * cellSize;
      // Lines running along X, Y, Z respectively, at every (y,z) / (x,z) /
      // (x,y) grid intersection.
      points.push(-half, a, b, half, a, b);
      points.push(a, -half, b, a, half, b);
      points.push(a, b, -half, a, b, half);
    }
  }

  return new Float32Array(points);
}

// Two independently-toggled debug layers, both driven by the boids-js
// spatial partition: the full uniform lattice as a dim static reference
// (Flocking folder's "Show Grid" toggle) and a brighter wireframe box per
// flockGrid cell that currently has at least one agent in it ("Illuminate
// Cells On Occupancy" — unbundled from "Show Grid" so cell illumination can
// run as its own visual feature, not just a debug aid). A sphere habitat
// naturally clusters the illuminated cells into a voxelized-sphere shape —
// no separate rendering path needed, see getFlockingControls.js. An
// instance count of flockCount is a safe upper bound on occupied cells —
// each agent occupies exactly one, so there can never be more occupied
// cells than agents.
function GridDebug({ config, simRef }) {
  const meshRef = useRef(null);
  const linesRef = useRef(null);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        opacity: 0.5,
        transparent: true,
        wireframe: true,
      }),
    []
  );
  material.color.set(config.cellIlluminationColor);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(
        buildGridLines(config.worldSize, config.subDivisionCount),
        3
      )
    );
    return geo;
  }, [config.worldSize, config.subDivisionCount]);
  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        opacity: 0.4,
        transparent: true,
      }),
    []
  );
  lineMaterial.color.set(config.gridColor);

  useFrame(() => {
    const mesh = meshRef.current;
    const lines = linesRef.current;
    const sim = simRef.current;
    if (!mesh) return;

    if (lines) lines.visible = config.showGrid;

    if (!config.cellIlluminationEnabled || !sim) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    const { flockGrid, flockCount } = sim;
    const boxSize = flockGrid.cellSize * 0.94;
    let drawn = 0;

    flockGrid.forEachOccupiedCell((index) => {
      if (drawn >= flockCount) return;
      const [x, y, z] = flockGrid.cellCenter(index);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(boxSize);
      dummy.updateMatrix();
      mesh.setMatrixAt(drawn, dummy.matrix);
      drawn += 1;
    });

    for (let i = drawn; i < flockCount; i += 1) {
      dummy.position.copy(HIDDEN);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <lineSegments
        ref={linesRef}
        geometry={lineGeometry}
        material={lineMaterial}
        frustumCulled={false}
      />
      <instancedMesh
        key={config.fireflyCount}
        ref={meshRef}
        args={[geometry, material, config.fireflyCount]}
        frustumCulled={false}
      />
    </>
  );
}

export default memo(GridDebug);
