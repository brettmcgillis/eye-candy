import React, { memo, useRef } from 'react';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import screenCenter from '../../utils/screenCenter';

function AnimationStatus({ timeline, config, status }) {
  const output = useRef();
  const next = useRef(0);
  useFrame(({ clock }) => {
    if (!output.current || clock.elapsedTime < next.current) return;
    next.current = clock.elapsedTime + 0.2;
    const job = status;
    let detail = 'UV motion · baked texture · no repaint';
    if (job)
      detail = `${job.frames} texture updates · ${Math.round(job.millis)} ms / update`;
    if (job?.busy) detail += ' · repainting, previous frame visible';
    if (job?.error) detail = job.error;
    let playback = config.animationPlaying ? 'PLAYING' : 'PAUSED';
    if (config.animationPlayback === 'once' && timeline.phase === 1)
      playback = 'FINISHED';
    if (config.studyView === 'original')
      detail = 'finished reference · animation updates suspended';
    output.current.textContent = `${playback} · ${Math.round(timeline.phase * 100)}% · ${detail}`;
    output.current.dataset.phase = timeline.phase.toFixed(4);
    output.current.dataset.frame = String(job?.frames || 0);
    output.current.dataset.error = job?.error || '';
  });
  return (
    <Html
      fullscreen
      calculatePosition={screenCenter}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[75, 70]}
    >
      <div
        className="three5-animation-status"
        ref={output}
        aria-label="Animated paint status"
      />
    </Html>
  );
}
export default memo(AnimationStatus);
