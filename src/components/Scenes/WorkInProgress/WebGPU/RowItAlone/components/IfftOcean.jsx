import { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import OceanChunkManager from '../runtime/OceanChunkManager';
import WaveGenerator from '../runtime/waves/WaveGenerator';

const FIXED_STEP_MS = 1000 / 60;

export default function IfftOcean({ config }) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const runtimeRef = useRef(null);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    if (!gl?.isWebGPURenderer) {
      return undefined;
    }

    const waveGenerator = new WaveGenerator({ renderer: gl });
    waveGenerator.init();

    const oceanManager = new OceanChunkManager({
      camera,
      layer: 0,
      renderer: gl,
      scene,
      waveGenerator,
    });
    oceanManager.init();
    oceanManager.applyConfig(config);

    runtimeRef.current = {
      oceanManager,
      waveGenerator,
    };

    return () => {
      accumulatorRef.current = 0;
      runtimeRef.current = null;
      oceanManager.dispose();
      waveGenerator.dispose?.();
    };
  }, [camera, gl, scene]);

  useFrame((state, delta) => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }

    runtime.waveGenerator.applyWaveSettings(config.waveSettings);
    runtime.oceanManager.applyConfig(config);

    accumulatorRef.current = Math.min(
      accumulatorRef.current + delta * 1000,
      FIXED_STEP_MS * 3
    );

    while (accumulatorRef.current >= FIXED_STEP_MS) {
      runtime.waveGenerator.update(FIXED_STEP_MS);
      accumulatorRef.current -= FIXED_STEP_MS;
    }

    runtime.oceanManager.update(state.camera);
  });

  return null;
}
