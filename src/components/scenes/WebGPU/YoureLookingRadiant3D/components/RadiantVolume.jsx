import { memo } from 'react';

import useRadiantVolume from '../hooks/useRadiantVolume';

function RadiantVolume({ config }) {
  useRadiantVolume(config);
  return null;
}

export default memo(RadiantVolume);
