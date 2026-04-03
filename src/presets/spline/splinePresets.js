import CAMERA_SPLINE_PRESETS from './cameraSplinePresets';
import DEFAULT_CAMERA_SPLINE from './defaultCameraSpline';
import STAYING_AFLOAT_SPLINES from './stayingAfloatSplines';

const CAMERA_PRESETS = {
  ...DEFAULT_CAMERA_SPLINE,
  ...STAYING_AFLOAT_SPLINES,
  ...CAMERA_SPLINE_PRESETS,
};

export default CAMERA_PRESETS;
