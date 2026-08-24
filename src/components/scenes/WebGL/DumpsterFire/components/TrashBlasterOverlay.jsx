import React from 'react';

import { AudioToggleButton } from '@app/scaffold/overlay/components/AudioToggle';
import SceneButtonBar from '@app/scaffold/overlay/components/SceneButtonBar';

import ClearTrashButton from './ClearTrashButton';
import ShootTrashButton from './ShootTrashButton';

export default function TrashBlasterOverlay() {
  return (
    <SceneButtonBar datasetKey="trashBlasterOverlayPortal">
      <AudioToggleButton />
      <ShootTrashButton />
      <ClearTrashButton />
    </SceneButtonBar>
  );
}
