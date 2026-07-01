import React from 'react';

import OverlayPortal from './OverlayPortal';

// Generic slot for a scene's easter-egg UX buttons (as opposed to Leva
// controls). Compose it with one or more OverlayIconButton children; it
// handles portaling into the overlay and staying clear of the signature/date
// panels regardless of how many buttons are passed in.
export default function SceneButtonBar({ datasetKey, children }) {
  return (
    <OverlayPortal datasetKey={datasetKey ?? 'sceneButtonBarPortal'}>
      <div className="scene-controls overlay-panel">{children}</div>
    </OverlayPortal>
  );
}
