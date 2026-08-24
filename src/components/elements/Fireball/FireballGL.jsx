import React from 'react';

import PerlinNoiseBallGL from '../perlinNoiseBall/PerlinNoiseBallGL';

export default function FireballGL(props) {
  return <PerlinNoiseBallGL {...props} greyscale={false} />;
}
