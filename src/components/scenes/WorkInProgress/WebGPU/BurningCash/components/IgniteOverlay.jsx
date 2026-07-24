import React from 'react';
import { BsFire } from 'react-icons/bs';

import OverlayIconButton from '../../../../../../app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '../../../../../../app/scaffold/overlay/components/SceneButtonBar';

export default function IgniteOverlay({ onIgnite }) {
  return (
    <SceneButtonBar datasetKey="igniteOverlayPortal">
      <OverlayIconButton
        onClick={onIgnite}
        icon={BsFire}
        label="burn some money"
      />
    </SceneButtonBar>
  );
}
