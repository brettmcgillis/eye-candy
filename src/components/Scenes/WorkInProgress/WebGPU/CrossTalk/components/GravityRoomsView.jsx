import React, { memo, useMemo } from 'react';

import useGravityBall from '../hooks/useGravityBall';
import { assignArrowVariants } from '../utils/arrowShapes';
import { assignSignVariants } from '../utils/signVariants';
import GravityArrow from './GravityArrow';
import GravityBall from './GravityBall';
import GravityCar from './GravityCar';

// Everything the Gravity Rooms preset needs, self-contained: the host-
// authoritative ball physics (useGravityBall) + one direction arrow per
// alive window. This component only exists in the tree while
// `preset === 'Gravity Rooms'` (see presets/views.js) — mounting/unmounting
// is the on/off switch, same as FluidSimView.
//
// `c.signArrows`/`c.carModel` (see getGravityControls.js) are local, per-tab
// Leva toggles, not broadcast through windowSync meta — the underlying
// physics is one shared entity either way, this only changes how *this*
// browser tab chooses to render it, which is deliberately independent per
// tab (lets you park a "ball" tab next to a "car" tab to compare directly).
function GravityRoomsView({ c, isHost, selfId, windows }) {
  const { positionRef } = useGravityBall({
    ballRadius: c.ballRadius,
    gravityStrength: c.gravityStrength,
    isHost,
    resetToken: c.reseedTick,
    restitution: c.restitution,
    windows,
  });

  // Assigned as a group (see variantAssignment.js) rather than each window
  // picking independently — independent picks collide constantly with only
  // 6 variants to choose from. Both computed regardless of which style is
  // active so flipping the toggle doesn't reshuffle everyone's variant.
  const signVariants = useMemo(() => assignSignVariants(windows), [windows]);
  const arrowVariants = useMemo(() => assignArrowVariants(windows), [windows]);

  return (
    <>
      {c.carModel && (
        // RcCar's materials are a lit PBR (GLTF-embedded), unlike the flat
        // sprite ball — same fill/sun combo as CloudsView's
        // cartoon_clouds.glb for the same reason (ambient+hemisphere alone
        // washes out its form; a directional "sun" gives it shading).
        <>
          <ambientLight intensity={0.35} />
          <hemisphereLight args={['#ffffff', '#b0c4de', 0.3]} />
          <directionalLight
            color="#fff8e7"
            intensity={1.6}
            position={[-300, 400, 250]}
          />
        </>
      )}

      {windows.map((win) => {
        const isSelf = win.id === selfId;
        return (
          <GravityArrow
            key={win.id}
            angleDeg={isSelf ? c.gravityAngle : (win.meta?.gravityAngle ?? 90)}
            center={{ x: win.x + win.w / 2, y: win.y + win.h / 2 }}
            draggable={isSelf}
            onDrag={isSelf ? c.setGravityAngle : undefined}
            signStyle={c.signArrows}
            variant={
              c.signArrows
                ? signVariants.get(win.id)
                : arrowVariants.get(win.id)
            }
          />
        );
      })}
      {c.carModel ? (
        <GravityCar positionRef={positionRef} scale={c.carScale} />
      ) : (
        <GravityBall
          color={c.ballColor}
          positionRef={positionRef}
          radius={c.ballRadius}
        />
      )}
    </>
  );
}

export default memo(GravityRoomsView);
