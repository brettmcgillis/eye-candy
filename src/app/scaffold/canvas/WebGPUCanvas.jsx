import React, { useCallback, useRef } from 'react';

import { Canvas } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

export default function WebGPUCanvas({ children }) {
  // R3F's configure effect has no dependency array, so it re-runs on every
  // render and only writes state.gl *after* awaiting this factory. A re-render
  // during renderer.init() would otherwise build a second WebGPURenderer on the
  // same canvas, and the two fight over the GPUCanvasContext swapchain — the
  // scene stays black until a resize forces a reconfigure.
  const pending = useRef(null);

  const createRenderer = useCallback(async (props) => {
    if (pending.current?.canvas === props.canvas) {
      return pending.current.promise;
    }

    const promise = (async () => {
      const renderer = new THREE.WebGPURenderer({
        ...props,
        antialias: true,
        alpha: false,
      });

      await renderer.init();
      return renderer;
    })();

    pending.current = { canvas: props.canvas, promise };
    return promise;
  }, []);

  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows="soft"
      style={{ touchAction: 'none' }}
      gl={createRenderer}
    >
      {children}
    </Canvas>
  );
}
