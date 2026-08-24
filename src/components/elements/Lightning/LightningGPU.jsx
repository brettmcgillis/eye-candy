import React from 'react';

import LightningRenderer from './LightningRenderer';

export default function LightningGPU(props) {
  return <LightningRenderer renderer="webgpu" {...props} />;
}
