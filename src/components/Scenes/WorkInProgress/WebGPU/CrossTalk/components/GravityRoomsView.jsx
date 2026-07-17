import React, { memo, useMemo } from 'react';

import useGravityBall from '../hooks/useGravityBall';
import { assignSignVariants } from '../utils/signVariants';
import GravityArrow from './GravityArrow';
import GravityBall from './GravityBall';

// Everything the Gravity Rooms preset needs, self-contained: the host-
// authoritative ball physics (useGravityBall) + one direction arrow per
// alive window. This component only exists in the tree while
// `preset === 'Gravity Rooms'` (see presets/views.js) — mounting/unmounting
// is the on/off switch, same as FluidSimView.
function GravityRoomsView({ c, isHost, selfId, windows }) {
  const { positionRef } = useGravityBall({
    ballRadius: c.ballRadius,
    gravityStrength: c.gravityStrength,
    isHost,
    resetToken: c.reseedTick,
    restitution: c.restitution,
    windows,
  });

  // Assigned as a group (see signVariants.js) rather than each window
  // picking independently — independent picks collide constantly with
  // only 6 variants to choose from.
  const signVariants = useMemo(() => assignSignVariants(windows), [windows]);

  return (
    <>
      {windows.map((win) => {
        const isSelf = win.id === selfId;
        return (
          <GravityArrow
            key={win.id}
            angleDeg={isSelf ? c.gravityAngle : (win.meta?.gravityAngle ?? 90)}
            center={{ x: win.x + win.w / 2, y: win.y + win.h / 2 }}
            draggable={isSelf}
            onDrag={isSelf ? c.setGravityAngle : undefined}
            variant={signVariants.get(win.id)}
          />
        );
      })}
      <GravityBall
        color={c.ballColor}
        positionRef={positionRef}
        radius={c.ballRadius}
      />
    </>
  );
}

export default memo(GravityRoomsView);
