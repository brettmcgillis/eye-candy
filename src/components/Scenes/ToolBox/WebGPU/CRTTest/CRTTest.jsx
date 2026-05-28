import React from 'react';

import CrtToolboxScene from '../../../shared/crt/CrtToolboxScene';
import {
  useCrtControls,
  useCrtPanels,
  useWebGPUCrtChannels,
} from '../../../shared/crt/channels';

export default function CRTTest() {
  const controls = useCrtControls();
  const channels = useWebGPUCrtChannels(controls);
  const panels = useCrtPanels(channels);

  return <CrtToolboxScene panels={panels} />;
}
