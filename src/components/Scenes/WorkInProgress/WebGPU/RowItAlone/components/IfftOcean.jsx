import { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import OceanChunkManager from '../runtime/OceanChunkManager';
import WaveGenerator from '../runtime/waves/WaveGenerator';

function getWaveStepMs(config) {
  const waveUpdateHz = Math.max(1, config?.performance?.waveUpdateHz ?? 30);

  return 1000 / waveUpdateHz;
}

export default function IfftOcean({ config }) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const runtimeRef = useRef(null);
  const accumulatorRef = useRef(0);
  const quality = config?.performance?.quality;

  useEffect(() => {
    if (!gl?.isWebGPURenderer) {
      return undefined;
    }

    const waveGenerator = new WaveGenerator({
      quality,
      renderer: gl,
    });
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
  }, [camera, gl, quality, scene]);

  useFrame((state, delta) => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }

    const fixedStepMs = getWaveStepMs(config);

    runtime.waveGenerator.applyWaveSettings(config.waveSettings);
    runtime.oceanManager.applyConfig(config);

    accumulatorRef.current = Math.min(
      accumulatorRef.current + delta * 1000,
      fixedStepMs * 3
    );

    while (accumulatorRef.current >= fixedStepMs) {
      runtime.waveGenerator.update(fixedStepMs);
      accumulatorRef.current -= fixedStepMs;
    }

    runtime.oceanManager.update(state.camera);
  });

  return null;
}
