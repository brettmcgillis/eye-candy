import React, { memo } from 'react';

import { OrthographicCamera } from '@react-three/drei';

function Stage() {
  return (
    <OrthographicCamera
      far={1000}
      makeDefault
      near={0.1}
      position={[0, 0, 100]}
    />
  );
}

export default memo(Stage);
