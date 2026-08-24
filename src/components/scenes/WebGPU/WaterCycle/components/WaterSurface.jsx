import { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import OceanChunkManager from '../runtime/OceanChunkManager';
import WaveGenerator from '../runtime/waves/WaveGenerator';
import createWaveProbe from '../utils/waveProbe';

function getWaveStepMs(config) {
  const waveUpdateHz = Math.max(1, config?.performance?.waveUpdateHz ?? 30);
  return 1000 / waveUpdateHz;
}

export default function WaterSurface({ config, onReady }) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const runtimeRef = useRef(null);
  const accumulatorRef = useRef(0);
  const quality = config?.performance?.quality;
  const pauseWater = config?.performance?.pauseWater ?? false;

  useEffect(() => {
    if (!gl?.isWebGPURenderer) {
      return undefined;
    }

    const waveGenerator = new WaveGenerator({ quality, renderer: gl });
    waveGenerator.init();

    const impactFoamRT = new THREE.RenderTarget(1024, 1024);
    impactFoamRT.texture.type = THREE.HalfFloatType;
    impactFoamRT.texture.magFilter = THREE.LinearFilter;
    impactFoamRT.texture.minFilter = THREE.LinearFilter;
    impactFoamRT.texture.generateMipmaps = false;
    impactFoamRT.texture.wrapS = THREE.ClampToEdgeWrapping;
    impactFoamRT.texture.wrapT = THREE.ClampToEdgeWrapping;

    const oceanManager = new OceanChunkManager({
      camera,
      impactFoamTexture: impactFoamRT.texture,
      layer: 0,
      renderer: gl,
      scene,
      waveGenerator,
      withSky: false,
    });
    oceanManager.init();
    oceanManager.applyConfig(config);

    const probe = createWaveProbe({
      cascades: waveGenerator.cascades,
      waveLengths: waveGenerator.waveLengths,
    });

    runtimeRef.current = {
      oceanManager,
      probe,
      waveGenerator,
    };
    onReady?.({ impactFoamRT, probe });

    return () => {
      accumulatorRef.current = 0;
      runtimeRef.current = null;
      onReady?.(null);
      oceanManager.dispose();
      impactFoamRT.dispose();
      waveGenerator.dispose?.();
    };
  }, [camera, gl, onReady, quality, scene]);

  useFrame((state, delta) => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }

    runtime.waveGenerator.applyWaveSettings(config.waveSettings);
    runtime.oceanManager.applyConfig(config);
    runtime.probe.setWaveLengths(runtime.waveGenerator.waveLengths);

    if (pauseWater) {
      accumulatorRef.current = 0;
      runtime.oceanManager.update(state.camera);
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
  });

  return null;
}
