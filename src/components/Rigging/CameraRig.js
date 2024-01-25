import { CameraControls } from '@react-three/drei';

import ScreenShotControls from './ScreenShotControls';

function CameraRig({ screenShot = false }) {
  return (
    <>
      <CameraControls
      // onChange={(e) => console.log('💀', e.target.camera.position)}
      />
      {screenShot && <ScreenShotControls />}
    </>
  );
}
export default CameraRig;
