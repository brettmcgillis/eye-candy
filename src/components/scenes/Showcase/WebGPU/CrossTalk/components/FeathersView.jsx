import React, { memo } from 'react';

import useFeatherSwarm from '../hooks/useFeatherSwarm';
import AttractorMarker from './AttractorMarker';
import FeatherField from './FeatherField';

const WINDOW_MARKER_COLOR = '#ffd166';
const MOUSE_MARKER_COLOR = '#8ecae6';

// Everything the Particles & Attractors preset needs, self-contained: the
// host-authoritative feather physics (useFeatherSwarm) + one glowing marker
// per alive window's attractor, plus one more for the shared mouse
// attractor. Owl feathers are lit the same as CloudsView/GravityRoomsView's
// PBR models (flat ambient/hemisphere alone hides their sculpted form; a
// directional "sun" gives it shading).
function FeathersView({ c, isHost, selfId, selfRect, windows }) {
  const { bufferRef, countRef, mouseAttractorRef } = useFeatherSwarm({
    damping: c.damping,
    isHost,
    maxParticles: c.particleCount,
    maxSpeed: c.maxSpeed,
    mouseStrength: c.mouseStrength,
    resetToken: c.reseedTick,
    selfId,
    selfRect,
    spinStrength: c.spinStrength,
    windows,
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#ffffff', '#b0c4de', 0.35]} />
      <directionalLight
        color="#fff8e7"
        intensity={1.4}
        position={[-300, 400, 250]}
      />

      <FeatherField
        bufferRef={bufferRef}
        countRef={countRef}
        maxParticles={c.particleCount}
        scale={c.featherScale}
      />

      {windows.map((win) => (
        <AttractorMarker
          key={win.id}
          color={WINDOW_MARKER_COLOR}
          strength={
            win.id === selfId
              ? c.attractorStrength
              : (win.meta?.attractorStrength ?? c.attractorStrength)
          }
          target={{ x: win.x + win.w / 2, y: win.y + win.h / 2 }}
        />
      ))}
      <AttractorMarker
        color={MOUSE_MARKER_COLOR}
        strength={c.mouseStrength}
        targetRef={mouseAttractorRef}
      />
    </>
  );
}

export default memo(FeathersView);
