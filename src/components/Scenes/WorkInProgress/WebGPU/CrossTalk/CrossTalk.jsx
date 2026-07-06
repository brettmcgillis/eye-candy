import React, { useMemo } from 'react';

import { useWindowSync } from '../../../../../modules/windowSync';
import CloudField from './components/CloudField';
import DesktopStage from './components/DesktopStage';
import useSceneControls, {
  WINDOW_SYNC_CHANNEL,
} from './hooks/useSceneControls';

// Every open browser window/tab pointed at this scene shares one desktop-
// spanning world via localStorage (see src/modules/windowSync). Preset 1
// (Clouds) proves the sync works: each window gets its own cloud, and
// dragging/resizing a window glides its cloud (and this window's view of
// every other cloud) smoothly rather than snapping.
export default function CrossTalk() {
  const c = useSceneControls();

  // This window's cloud style is broadcast as `meta` (not just used locally)
  // — every sibling window renders THIS window's cloud from this object, not
  // from whatever its own Leva panel happens to be set to. Without that, a
  // cloud's size/bob would depend on which tab was doing the looking. Color
  // isn't part of this — see CloudField, it's derived per-window from the
  // window's own id so every window gets a distinct tint automatically.
  const cloudStyle = useMemo(
    () => ({
      spread: c.spread,
      bobAmount: c.bobAmount,
      bobSpeed: c.bobSpeed,
    }),
    [c.spread, c.bobAmount, c.bobSpeed]
  );

  const { selfRect, windows } = useWindowSync(WINDOW_SYNC_CHANNEL, cloudStyle);

  return (
    <>
      <color attach="background" args={[c.backgroundColor]} />

      {/* cartoon_clouds.glb is an untextured PBR material (white, roughness
          0.6) — flat ambient/hemisphere fill alone lit every surface equally
          and hid the model's sculpted volume. A directional "sun" (a true
          directional light illuminates uniformly regardless of how far a
          cloud has drifted from world origin, so no per-window handling
          needed) gives it the highlight/shadow gradient that reads as form;
          ambient/hemisphere are dialed down to fill only, not wash it out. */}
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#ffffff', '#b0c4de', 0.3]} />
      <directionalLight
        color="#fff8e7"
        intensity={1.6}
        position={[-300, 400, 250]}
      />

      <DesktopStage easing={c.syncEasing} selfRect={selfRect}>
        <CloudField
          windows={windows}
          fallbackCloud={cloudStyle}
          hueShift={c.hueShift}
        />
      </DesktopStage>
    </>
  );
}
