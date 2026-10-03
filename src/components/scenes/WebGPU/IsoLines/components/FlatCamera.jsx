import React, { memo } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

// The piece is the frame: straight on, two world units tall, edge to edge
// (the field's aspect follows the viewport).
function FlatCamera() {
  const height = useThree((state) => state.size.height);
  return (
    <OrthographicCamera
      far={50}
      makeDefault
      near={0.1}
      position={[0, 0, 10]}
      zoom={height / 2}
    />
  );
}

export default memo(FlatCamera);
