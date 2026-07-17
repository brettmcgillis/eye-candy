import * as THREE from 'three/webgpu';

import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';

import { SIGN_URLS } from '../utils/signVariants';

const SIGN_WIDTH = 48;

useTexture.preload(SIGN_URLS);

// A single-mesh road-sign sprite at each alive window's center, pointing
// along that window's own broadcast gravity direction. Only the window
// that owns it (`draggable`) actually responds to pointer events —
// dragging another window's sign can't do anything useful since that
// window's Leva control lives in a different browser tab, so it renders
// read-only there.
//
// One mesh is load-bearing, not just tidy: an earlier version split this
// into a separate plane (shaft) + coneGeometry (head) + invisible circle
// (drag handle), and three coplanar meshes at the same local position left
// the raycaster picking between them near-arbitrarily on ties (same hit
// distance, so the outcome depended on rounding, not geometry) — that was
// the original "unpredictable" drag. One mesh removes that ambiguity, and
// the whole sign — not a tiny handle — is the hit target.
function GravityArrow({ angleDeg, center, draggable, onDrag, variant }) {
  const draggingRef = useRef(false);
  const originRef = useRef(new THREE.Vector3());

  // `variant` is assigned as a group by GravityRoomsView (see
  // signVariants.js's assignSignVariants) so every alive window gets a
  // distinct sign rather than each picking independently and colliding.
  // `aspect` sizes the plane to the source image's real proportions so it
  // doesn't stretch.
  const texture = useTexture(variant.url);
  const [signWidth, signHeight] = useMemo(
    () => [SIGN_WIDTH, SIGN_WIDTH / variant.aspect],
    [variant]
  );

  // Every sign's baked-in arrow points +X (sign4's source pointed up; it
  // was rotated during asset prep) — so, same as the plain-polygon arrow
  // this replaced, rendering angleDeg is a *plain* rotation by that angle,
  // matching atan2's own convention, not its negation.
  const rotationZ = useMemo(() => (angleDeg * Math.PI) / 180, [angleDeg]);

  // event.point (the raycast hit) is only fresh while the ray is actually
  // still intersecting this mesh. Once the pointer is captured (see
  // handlePointerDown below), r3f keeps delivering move events for pointer
  // positions that no longer hit the sign's shape, but for those events it
  // pads `event.point` in from the *original* intersection it cached when
  // capture started (see @react-three/fiber's events.ts: captured
  // pointers get `captureData.intersection` re-injected verbatim, and a
  // native PointerEvent has no `.point` to override it with). So
  // event.point silently freezes the instant the cursor drifts off the
  // shape, the angle stops updating, and the next real hit snaps it back
  // to reality — that's the "goes slow, works a bit; snaps back
  // otherwise". event.unprojectedPoint has no such gap: r3f recomputes it
  // fresh from the current pointer position on every single event
  // regardless of what (if anything) the ray currently hits, so it's what
  // we want here.
  const angleFromEvent = useCallback((event) => {
    event.object.getWorldPosition(originRef.current);
    const dx = event.unprojectedPoint.x - originRef.current.x;
    const dy = event.unprojectedPoint.y - originRef.current.y;
    return ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      if (!draggable) return;
      event.stopPropagation();
      event.target.setPointerCapture(event.pointerId);
      draggingRef.current = true;
      document.body.style.cursor = 'grabbing';
      onDrag?.(angleFromEvent(event));
    },
    [angleFromEvent, draggable, onDrag]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!draggingRef.current) return;
      event.stopPropagation();
      onDrag?.(angleFromEvent(event));
    },
    [angleFromEvent, onDrag]
  );

  const handlePointerUp = useCallback((event) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.body.style.cursor = 'grab';
    event.target.releasePointerCapture(event.pointerId);
  }, []);

  const handlePointerOver = useCallback(() => {
    if (draggable) document.body.style.cursor = 'grab';
  }, [draggable]);

  const handlePointerOut = useCallback(() => {
    if (draggable && !draggingRef.current) document.body.style.cursor = 'auto';
  }, [draggable]);

  // Defensive reset — e.g. the preset gets switched away mid-drag, which
  // unmounts this component without ever firing pointerup/pointerout.
  useEffect(() => {
    if (!draggable) return undefined;
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [draggable]);

  return (
    <group position={[center.x, center.y, 1]} rotation={[0, 0, rotationZ]}>
      <mesh
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onPointerOver={handlePointerOver}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[signWidth, signHeight]} />
        {/* DoubleSide is load-bearing: DesktopStage's pixel-space ortho
            camera is Y-flipped (top=0, bottom=height), which reverses
            triangle winding — with default FrontSide the plane would be
            backface-culled and invisible (see FluidField.jsx / GravityBall
            for the same reasoning). */}
        <meshBasicMaterial
          depthWrite={false}
          map={texture}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
    </group>
  );
}

export default memo(GravityArrow);
