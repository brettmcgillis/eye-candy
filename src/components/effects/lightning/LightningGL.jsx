import React from 'react';

import LightningRenderer from './LightningRenderer';

export default function LightningGL(props) {
  return <LightningRenderer renderer="webgl" {...props} />;
}
