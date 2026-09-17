import { MAX_CAMERA_DISTANCE } from './constants';

const CENTRE = [0, 0, 0];
const FOV = 30;
// Where the field's mid plane is exactly one field tall on screen, which is
// the flat scene's framing. A narrow lens from further back keeps the near
// and far bodies close to that size.
const FIELD_DISTANCE = 0.5 / Math.tan(((FOV / 2) * Math.PI) / 180);
const FRAME = {
  position: [0, 0, FIELD_DISTANCE],
  target: CENTRE,
  pivot: CENTRE,
  fov: FOV,
};

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    enablePan: false,
    minDistance: 0.4,
    maxDistance: MAX_CAMERA_DISTANCE,
    maxDistanceUnlimited: false,
    minPolarAngle: 20,
    maxPolarAngle: 160,
    desktop: FRAME,
    mobile: FRAME,
  },
};

export default CAMERA;
