import { useEffect, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { localEnv } from '@utils/appUtils';

import OceanChunkManager from '../runtime/OceanChunkManager';
import CpuWaveSampler from '../runtime/waves/CpuWaveSampler';
import WaveGenerator from '../runtime/waves/WaveGenerator';

async function compareSamplerToGpu({ cascade, renderer, sampler }) {
  const heights = new Float32Array(
    await renderer.getArrayBufferAsync(cascade.dyDxzBuffer)
  );
  const { size } = cascade.params;
  const { lengthScale } = cascade.params;
  const stride = Math.max(1, Math.floor(size / 16));

  let maxAbsolute = 0;
  let maxError = 0;
  let sampleCount = 0;

  sampler.setTime(cascade.waveTime ?? 0);

  for (let py = 0; py < size; py += stride) {
    for (let px = 0; px < size; px += stride) {
      const gpuHeight = heights[(py * size + px) * 2];
      const cpuHeight = sampler.sampleHeight(
        (px * lengthScale) / size,
        (py * lengthScale) / size
      );

      maxAbsolute = Math.max(maxAbsolute, Math.abs(gpuHeight));
      maxError = Math.max(maxError, Math.abs(gpuHeight - cpuHeight));
      sampleCount += 1;
    }
  }

  return {
    maxAbsolute,
    maxError,
    modeCount: sampler.count,
    relativeError: maxAbsolute > 0 ? maxError / maxAbsolute : 0,
    sampleCount,
  };
}

function getWaveStepMs(config) {
  const waveUpdateHz = Math.max(1, config?.performance?.waveUpdateHz ?? 30);

  return 1000 / waveUpdateHz;
}

export default function useIfftOceanRuntime(config) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const runtimeRef = useRef(null);
  const accumulatorRef = useRef(0);
  const samplerRef = useRef(new CpuWaveSampler());
  const [sampler, setSampler] = useState(null);
  const quality = config?.performance?.quality;
  const pauseWater = config?.performance?.pauseWater ?? false;
  const buoyancyModes = config?.buoyancy?.modeCount ?? 192;

  useEffect(() => {
    if (!gl?.isWebGPURenderer) {
      return undefined;
    }

    let disposed = false;
    const waveGenerator = new WaveGenerator({ quality, renderer: gl });
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

    const cpuSampler = new CpuWaveSampler({ modeCount: buoyancyModes });

    samplerRef.current = cpuSampler;
    runtimeRef.current = { oceanManager, sampler: cpuSampler, waveGenerator };

    cpuSampler
      .load({ cascade: waveGenerator.cascades[0], renderer: gl })
      .then(() => {
        if (disposed) {
          return;
        }

        setSampler(cpuSampler);

        if (localEnv() && typeof window !== 'undefined') {
          window.rowItAloneWaveCheck = () =>
            compareSamplerToGpu({
              cascade: waveGenerator.cascades[0],
              renderer: gl,
              sampler: cpuSampler,
            });
        }
      })
      .catch(() => {
        if (!disposed) {
          setSampler(null);
        }
      });

    return () => {
      disposed = true;
      accumulatorRef.current = 0;
      runtimeRef.current = null;
      setSampler(null);
      cpuSampler.dispose();
      oceanManager.dispose();
      waveGenerator.dispose?.();
    };
  }, [buoyancyModes, camera, gl, quality, scene]);

  useFrame((state, delta) => {
    const runtime = runtimeRef.current;

    if (!runtime) {
      return;
    }

    runtime.waveGenerator.applyWaveSettings(config.waveSettings);
    runtime.oceanManager.applyConfig(config);

    if (pauseWater) {
      accumulatorRef.current = 0;
      runtime.oceanManager.update(state.camera);
      runtime.sampler.setTime(runtime.waveGenerator.cascades[0].waveTime ?? 0);

      return;
    }

    const fixedStepMs = getWaveStepMs(config);

    accumulatorRef.current = Math.min(
      accumulatorRef.current + delta * 1000,
      fixedStepMs * 3
    );

    while (accumulatorRef.current >= fixedStepMs) {
      runtime.waveGenerator.update(fixedStepMs);
      accumulatorRef.current -= fixedStepMs;
    }

    runtime.oceanManager.update(state.camera);
    runtime.sampler.setTime(runtime.waveGenerator.cascades[0].waveTime ?? 0);
  });

  return { runtimeRef, sampler, samplerRef };
}
