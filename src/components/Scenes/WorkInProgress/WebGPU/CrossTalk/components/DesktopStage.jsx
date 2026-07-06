import React, { memo, useRef } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

const CAMERA_Z = 100;
const CAMERA_NEAR = -10000;
const CAMERA_FAR = 10000;

// The desktop-viewport trick (from bgstaal/multipleWindow3dScene): every
// window renders the same shared world-space scene, but each one is just a
// pixel-accurate orthographic "porthole" onto it. The camera never moves —
// instead the world group eases toward -selfRect so this window shows
// exactly the slice of world space its own screen rect currently covers.
// This intentionally does not use CameraRig (docs/scene-conventions.md §10):
// CameraRig assumes one perspective camera framing a subject, not a 1:1
// pixel-space viewport synced to OS window geometry.
//
// Must use drei's <OrthographicCamera>, not the raw `<orthographicCamera>`
// primitive: `makeDefault` is a drei convention (it calls the R3F store's
// `set({ camera })` in its own effect) — the raw primitive silently ignores
// an unrecognized `makeDefault` prop, so the camera never actually becomes
// active and the scene renders through R3F's untouched implicit default
// camera instead, nowhere near this scene's pixel-space content.
function DesktopStage({ children, easing, selfRect }) {
  const size = useThree((state) => state.size);
  const groupRef = useRef(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group || !selfRect) return;

    const targetX = -selfRect.x;
    const targetY = -selfRect.y;
    group.position.x += (targetX - group.position.x) * easing;
    group.position.y += (targetY - group.position.y) * easing;
  });

  return (
    <>
      <OrthographicCamera
        makeDefault
        manual
        left={0}
        right={size.width}
        top={0}
        bottom={size.height}
        near={CAMERA_NEAR}
        far={CAMERA_FAR}
        position={[0, 0, CAMERA_Z]}
      />
      <group ref={groupRef}>{children}</group>
    </>
  );
}

export default memo(DesktopStage);
