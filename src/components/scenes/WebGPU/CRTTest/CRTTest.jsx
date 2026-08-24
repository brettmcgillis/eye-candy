import React from 'react';

import CrtToolboxScene from '@elements/Crt/CrtToolboxScene';
import {
  useCrtControls,
  useCrtPanels,
  useWebGPUCrtChannels,
} from '@elements/Crt/channels';

export default function CRTTest() {
  const controls = useCrtControls();
  const channels = useWebGPUCrtChannels(controls);
  const panels = useCrtPanels(channels);

  return <CrtToolboxScene panels={panels} />;
}
