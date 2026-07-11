import React, { memo, useEffect, useRef } from 'react';

import { PerspectiveCamera } from '@react-three/drei';

const Camera = memo(function Camera() {
  const cameraRef = useRef(null);

  useEffect(() => {
    cameraRef.current?.lookAt(0, 2.5, 0);
  }, []);

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={42}
      position={[11, 6.5, 12]}
    />
  );
});

export default Camera;
