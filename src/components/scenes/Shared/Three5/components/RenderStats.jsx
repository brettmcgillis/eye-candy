import { memo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

function RenderStats({ outputRef }) {
  const output = outputRef;
  const timer = useRef(0);
  const frames = useRef(0);
  useFrame(({ gl }, delta) => {
    timer.current += delta;
    frames.current += 1;
    if (timer.current < 0.75 || !output.current) return;
    const detail = gl.isWebGPURenderer
      ? 'WebGPU'
      : `${gl.info.render.calls} scene draw calls`;
    output.current.textContent = `${Math.round(frames.current / timer.current)} fps · ${detail}`;
    frames.current = 0;
    timer.current = 0;
  });
  return null;
}

export default memo(RenderStats);
