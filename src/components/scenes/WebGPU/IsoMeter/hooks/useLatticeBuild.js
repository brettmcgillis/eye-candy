import { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import { createBuild, meshData } from '@modules/isoMeter';

import createLatticeGeometry from '../utils/latticeGeometry';

const MAX_DELTA = 0.1;

export default function useLatticeBuild(piece, config, replay, onBuilt) {
  const build = useMemo(() => createBuild(piece), [piece]);
  const meshRef = useRef(null);
  if (!meshRef.current) {
    meshRef.current = createLatticeGeometry();
    meshRef.current.write(meshData(piece, build));
  }
  const [geometries, setGeometries] = useState(() =>
    meshRef.current.geometries()
  );
  const stateRef = useRef({ carry: 0, dirty: true, notified: false });
  const still = config.motion === 'still';

  useEffect(() => {
    build.reset();
    if (still) build.step(Infinity);
    stateRef.current = { carry: 0, dirty: true, notified: false };
  }, [build, replay, still]);

  const { fill, lineWidth, outlineMode, outlineWidth } = config;
  useEffect(() => {
    stateRef.current.dirty = true;
  }, [fill, lineWidth, outlineMode, outlineWidth]);

  useFrame((_, delta) => {
    const state = stateRef.current;
    if (!build.done) {
      state.carry += Math.min(delta, MAX_DELTA) * config.levelsPerSecond;
      const count = Math.floor(state.carry);
      if (count > 0) {
        state.carry -= count;
        build.step(count);
        state.dirty = true;
      }
    }
    if (!state.dirty) return;
    state.dirty = false;
    const data = meshData(piece, build, {
      fill,
      lineWidth,
      outlineMode,
      outlineWidth,
      style: build.done ? 'final' : 'build',
    });
    if (meshRef.current.write(data)) {
      setGeometries(meshRef.current.geometries());
    }
    if (build.done && !state.notified) {
      state.notified = true;
      onBuilt?.();
    }
  });

  return geometries;
}
