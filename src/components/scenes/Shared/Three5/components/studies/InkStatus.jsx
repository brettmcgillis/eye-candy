import React, { memo, useRef } from 'react';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

function InkStatus({ job }) {
  const output = useRef();
  const next = useRef(0);
  useFrame(({ clock }) => {
    if (!output.current || clock.elapsedTime < next.current) return;
    next.current = clock.elapsedTime + 0.3;
    const value = job.current;
    let text = 'Preparing camera drawing…';
    if (value.painted)
      text = `${Math.round(value.millis)} ms / repaint · ${value.busy ? 'painting next view' : 'current view ready'}`;
    if (value.error) text = `Camera drawing: ${value.error}`;
    output.current.textContent = text;
    output.current.dataset.ready = String(value.painted);
    output.current.dataset.error = value.error;
  });
  return (
    <Html position={[0, 3.2, 0]} center style={{ pointerEvents: 'none' }}>
      <span
        ref={output}
        className="three5-comparison-label"
        aria-label="Camera repaint performance"
      />
    </Html>
  );
}
export default memo(InkStatus);
