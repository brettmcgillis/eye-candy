import React from 'react';

import { CameraControls } from '@react-three/drei';

import ScreenShotControls from './ScreenShotControls';

export default function CameraRig({ screenShot = false }) {
  return (
    <>
      <CameraControls
      // onChange={(e) => console.log('💀', e.target.camera.position)}
      />
      {screenShot && <ScreenShotControls />}
    </>
  );
}
