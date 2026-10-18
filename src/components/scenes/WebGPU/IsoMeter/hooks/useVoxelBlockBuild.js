import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { createBuild, createVoxelSet } from '@modules/isoMeter';
import { createChunkGroup } from '@modules/isoMeterRender';

const MAX_DELTA = 0.1;
const SETTLE_BUDGET = 2500;
const CHUNK_CUBES = 2000;

export default function useVoxelBlockBuild({
  config,
  materials,
  onBuilt,
  piece,
  replay,
}) {
  const build = useMemo(() => createBuild(piece, { record: true }), [piece]);
  const voxels = useMemo(() => createVoxelSet(), [build]);
  const chunks = useMemo(() => createChunkGroup(), []);
  const stateRef = useRef(null);
  const still = config.motion === 'still';
  const { fill } = config;

  useEffect(() => () => chunks.clear(), [chunks]);

  useEffect(() => {
    build.reset();
    voxels.clear();
    chunks.clear();
    stateRef.current = {
      carry: 0,
      chunk: 0,
      notified: false,
      read: 0,
      settling: false,
    };
    if (still) build.step(Infinity);
  }, [build, chunks, replay, still, voxels]);

  useEffect(() => {
    voxels.markAll();
  }, [fill, voxels]);

  useFrame((_, delta) => {
    const state = stateRef.current;
    if (!state) return;
    if (!build.done) {
      state.carry += Math.min(delta, MAX_DELTA) * config.levelsPerSecond;
      const count = Math.floor(state.carry);
      if (count > 0) {
        state.carry -= count;
        build.step(count);
      }
    }
    const log = build.lattice.cubeLog;
    if (state.read < log.length) {
      for (; state.read < log.length; state.read += 1) {
        voxels.add(log[state.read], state.chunk, { settled: false });
        if (state.read % CHUNK_CUBES === CHUNK_CUBES - 1) state.chunk += 1;
      }
      state.chunk += 1;
    }
    if (build.done && !state.settling) {
      state.settling = true;
      voxels.markAll();
    }
    if (!voxels.dirtyCount) {
      if (state.settling && !state.notified) {
        state.notified = true;
        onBuilt?.();
      }
      return;
    }
    const heights = build.heights();
    const flushed = voxels.flush(
      (tri) => piece.shade(tri, heights),
      state.settling ? SETTLE_BUDGET : Infinity
    );
    chunks.apply(flushed, materials, { fill });
  });

  return chunks.group;
}
