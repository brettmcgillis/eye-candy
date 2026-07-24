import React, { memo } from 'react';
import { GiThrownCharcoal } from 'react-icons/gi';
import { LuBrush } from 'react-icons/lu';

import { AudioToggleButton } from '../../../../../../app/scaffold/overlay/components/AudioToggle';
import OverlayIconButton from '../../../../../../app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '../../../../../../app/scaffold/overlay/components/SceneButtonBar';
import useRockStore from '../hooks/useRockStore';

function ButtonOverlay() {
  const fire = useRockStore((s) => s.fire);
  const clear = useRockStore((s) => s.clear);
  const hasRocks = useRockStore((s) => s.hasRocks);

  return (
    <SceneButtonBar datasetKey="windowBreakerOverlayPortal">
      <AudioToggleButton />
      <OverlayIconButton
        onClick={fire}
        icon={GiThrownCharcoal}
        label="Throw a rock"
      />
      <OverlayIconButton
        onClick={clear}
        icon={LuBrush}
        label={hasRocks ? 'Clean up the rocks' : 'Reset'}
      />
    </SceneButtonBar>
  );
}

export default memo(ButtonOverlay);
