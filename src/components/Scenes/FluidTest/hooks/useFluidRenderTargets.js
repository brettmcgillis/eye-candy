import * as THREE from 'three';

import { useCallback, useEffect, useMemo } from 'react';

import {
  clearRenderTargets,
  createBloomChain,
  createPair,
} from '../utils/fluidSimUtils';

export default function useFluidRenderTargets({
  gl,
  simWidth,
  simHeight,
  bloomWidth,
  bloomHeight,
  sunraysWidth,
  sunraysHeight,
  rtOptions,
  maxBloomChain,
}) {
  const velocity = useMemo(
    () => createPair(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );
  const dye = useMemo(
    () => createPair(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );
  const pressureTex = useMemo(
    () => createPair(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );
  const curl = useMemo(
    () => new THREE.WebGLRenderTarget(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );
  const divergence = useMemo(
    () => new THREE.WebGLRenderTarget(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );

  const bloomComposite = useMemo(
    () => createPair(bloomWidth, bloomHeight, rtOptions),
    [bloomHeight, bloomWidth, rtOptions]
  );
  const bloomChain = useMemo(
    () => createBloomChain(bloomWidth, bloomHeight, maxBloomChain, rtOptions),
    [bloomHeight, bloomWidth, maxBloomChain, rtOptions]
  );

  const sunraysMask = useMemo(
    () => new THREE.WebGLRenderTarget(sunraysWidth, sunraysHeight, rtOptions),
    [rtOptions, sunraysHeight, sunraysWidth]
  );
  const sunraysTex = useMemo(
    () => new THREE.WebGLRenderTarget(sunraysWidth, sunraysHeight, rtOptions),
    [rtOptions, sunraysHeight, sunraysWidth]
  );
  const sunraysTemp = useMemo(
    () => new THREE.WebGLRenderTarget(sunraysWidth, sunraysHeight, rtOptions),
    [rtOptions, sunraysHeight, sunraysWidth]
  );

  const clearSimTargets = useCallback(() => {
    clearRenderTargets(gl, [
      velocity.read,
      velocity.write,
      dye.read,
      dye.write,
      pressureTex.read,
      pressureTex.write,
      curl,
      divergence,
    ]);
  }, [
    curl,
    divergence,
    dye.read,
    dye.write,
    gl,
    pressureTex.read,
    pressureTex.write,
    velocity.read,
    velocity.write,
  ]);

  const clearPostTargets = useCallback(() => {
    clearRenderTargets(gl, [
      bloomComposite.read,
      bloomComposite.write,
      ...bloomChain,
      sunraysMask,
      sunraysTex,
      sunraysTemp,
    ]);
  }, [
    bloomChain,
    bloomComposite.read,
    bloomComposite.write,
    gl,
    sunraysMask,
    sunraysTemp,
    sunraysTex,
  ]);

  const clearAllTargets = useCallback(() => {
    clearSimTargets();
    clearPostTargets();
  }, [clearPostTargets, clearSimTargets]);

  useEffect(() => {
    clearRenderTargets(gl, [
      velocity.read,
      velocity.write,
      dye.read,
      dye.write,
      pressureTex.read,
      pressureTex.write,
      curl,
      divergence,
    ]);

    return () => {
      velocity.read.dispose();
      velocity.write.dispose();
      dye.read.dispose();
      dye.write.dispose();
      pressureTex.read.dispose();
      pressureTex.write.dispose();
      curl.dispose();
      divergence.dispose();
    };
  }, [curl, divergence, dye, gl, pressureTex, simHeight, simWidth, velocity]);

  useEffect(() => {
    clearRenderTargets(gl, [
      bloomComposite.read,
      bloomComposite.write,
      ...bloomChain,
      sunraysMask,
      sunraysTex,
      sunraysTemp,
    ]);

    return () => {
      bloomComposite.read.dispose();
      bloomComposite.write.dispose();
      bloomChain.forEach((target) => target.dispose());
      sunraysMask.dispose();
      sunraysTex.dispose();
      sunraysTemp.dispose();
    };
  }, [
    bloomChain,
    bloomComposite,
    bloomHeight,
    bloomWidth,
    gl,
    sunraysHeight,
    sunraysMask,
    sunraysTemp,
    sunraysWidth,
    sunraysTex,
  ]);

  return {
    velocity,
    dye,
    pressureTex,
    curl,
    divergence,
    bloomComposite,
    bloomChain,
    sunraysMask,
    sunraysTex,
    sunraysTemp,
    clearAllTargets,
  };
}
