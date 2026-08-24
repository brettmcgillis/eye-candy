import React from 'react';

import { useWindowSync } from '@modules/windowSync';

import DesktopStage from './components/DesktopStage';
import useSceneControls, {
  WINDOW_SYNC_CHANNEL,
} from './hooks/useSceneControls';
import { getPresetView } from './presets/views';

// Every open browser window/tab pointed at this scene shares one desktop-
// spanning world via localStorage (see src/modules/windowSync). Which
// content actually renders is fully delegated to the active preset's view
// component (presets/views.js) — this file only owns what's genuinely
// shared across every preset: the scene controls, the one windowSync
// subscription (kept at this level, not per-view, so this window's registry
// identity survives a preset switch instead of churning), and DesktopStage's
// shared pixel-space camera/world group.
export default function CrossTalk() {
  const c = useSceneControls();
  const view = getPresetView(c.preset);
  const meta = view.getMeta(c);

  const { hostId, isHost, selfId, selfRect, windows } = useWindowSync(
    WINDOW_SYNC_CHANNEL,
    meta
  );

  const View = view.Component;

  return (
    <>
      <color attach="background" args={[c.backgroundColor]} />

      <DesktopStage easing={c.syncEasing} selfRect={selfRect}>
        <View
          c={c}
          hostId={hostId}
          isHost={isHost}
          meta={meta}
          selfId={selfId}
          selfRect={selfRect}
          windows={windows}
        />
      </DesktopStage>
    </>
  );
}
