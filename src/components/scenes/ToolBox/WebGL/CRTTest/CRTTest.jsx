import React from 'react';

import CrtToolboxScene from '../../../shared/crt/CrtToolboxScene';
import {
  useCrtControls,
  useCrtPanels,
  useWebGLCrtChannels,
} from '../../../shared/crt/channels';

export default function CRTTest() {
  const controls = useCrtControls();
  const channels = useWebGLCrtChannels(controls);
  const panels = useCrtPanels(channels);

  return <CrtToolboxScene panels={panels} />;
}
