import { CameraControls } from "@react-three/drei";

import ScreenShotControls from "./ScreenShotControls";

function CameraRig({ screenShot = false }) {
  return (
    <>
      <CameraControls />
      {screenShot && <ScreenShotControls />}
    </>
  );
}
export default CameraRig;
