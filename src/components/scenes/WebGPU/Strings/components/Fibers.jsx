import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import useRenderScale from '@hooks/useRenderScale';

import createFiberRuntime from '../utils/fiberCompute';
import createRibbonGeometry from '../utils/fiberGeometry';
import createFiberMaterial from '../utils/fiberMaterial';
import {
  LAYOUT_KEYS,
  createFiberUniforms,
  syncFiberUniforms,
} from '../utils/fiberUniforms';
import fillThreadStrands from '../utils/strandData';

const SIM_DT = 1 / 60;

function Fibers({ config }) {
  const configRef = useRef(config);
  configRef.current = config;

  const renderer = useThree((state) => state.gl);
  useRenderScale(config.renderScale);

  const u = useMemo(createFiberUniforms, []);

  const runtime = useMemo(
    () =>
      createFiberRuntime({
        count: config.threadCount,
        mode: config.waveMode,
        segments: config.segments,
        u,
      }),
    [config.threadCount, config.waveMode, config.segments, u]
  );

  const geometry = useMemo(
    () => createRibbonGeometry(config.samples),
    [config.samples]
  );
  const material = useMemo(
    () => createFiberMaterial(runtime, u, config.fiberBlend),
    [config.fiberBlend, runtime, u]
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useEffect(() => {
    syncFiberUniforms(u, config);
  }, [config, u]);

  const needsInitRef = useRef(true);
  const { colorDrift, seed } = config;

  useEffect(() => {
    fillThreadStrands({
      colorDrift,
      count: runtime.strandCount,
      seed,
      strandA: runtime.buffers.strandA.value.array,
      strandB: runtime.buffers.strandB.value.array,
    });
    runtime.buffers.strandA.value.needsUpdate = true;
    runtime.buffers.strandB.value.needsUpdate = true;
    needsInitRef.current = true;
  }, [colorDrift, runtime, seed]);

  const layoutKey = LAYOUT_KEYS.map((key) => config[key]).join('|');

  useEffect(() => {
    needsInitRef.current = true;
  }, [layoutKey, config.fiberMotion]);

  const phaseRef = useRef(0);
  const loopRef = useRef(0);

  useFrame((_, delta) => {
    const c = configRef.current;
    const step = Math.min(delta, 1 / 20) * c.timeScale;

    phaseRef.current += step;
    loopRef.current = (loopRef.current + step * c.loopSpeed) % 1;
    u.phase.value = phaseRef.current;
    u.loopPhase.value = loopRef.current;

    if (needsInitRef.current) {
      renderer.compute(runtime.kernels.init);
      needsInitRef.current = false;
    }

    if (c.timeScale <= 0) return;

    if (c.fiberMotion === 'noise') {
      renderer.compute(runtime.kernels.wave);
      return;
    }

    u.dt.value = SIM_DT * c.timeScale;
    for (let s = 0; s < c.substeps; s += 1) {
      renderer.compute(runtime.kernels.integrate);
      for (let n = 0; n < c.constraintIterations; n += 1) {
        u.parity.value = 1;
        renderer.compute(runtime.kernels.constrain);
        u.parity.value = 0;
        renderer.compute(runtime.kernels.constrain);
      }
    }
  });

  return (
    <mesh
      count={runtime.strandCount}
      frustumCulled={false}
      geometry={geometry}
      material={material}
    />
  );
}

export default memo(Fibers);
