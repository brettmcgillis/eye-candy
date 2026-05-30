import AISLE9_CAMERA_SPLINES from './aisle9CameraSplines';
import CAMERA_SPLINE_PRESETS from './cameraSplinePresets';
import DEFAULT_CAMERA_SPLINE from './defaultCameraSpline';
import STAYING_AFLOAT_SPLINES from './stayingAfloatSplines';

const CAMERA_PRESETS = {
  ...AISLE9_CAMERA_SPLINES,
  ...DEFAULT_CAMERA_SPLINE,
  ...STAYING_AFLOAT_SPLINES,
  ...CAMERA_SPLINE_PRESETS,
};

export default CAMERA_PRESETS;
