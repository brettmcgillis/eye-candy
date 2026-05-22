import React from 'react';

import FireAndSmoke from './FireAndSmoke';
import FireAndSmokeGPU from './FireAndSmokeGPU';

export default function FireAndSmokeRenderer({ renderer = 'webgl', ...props }) {
  if (renderer === 'webgpu') {
    return <FireAndSmokeGPU {...props} />;
  }

  return <FireAndSmoke {...props} />;
}
