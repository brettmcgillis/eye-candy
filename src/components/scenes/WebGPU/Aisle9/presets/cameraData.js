import CENTER_STORE_REF_POSITION from '@elements/SevenEleven/sevenElevenAnchors';
import {
  AISLE9_CAMERA_SPLINES,
  DEFAULT_AISLE9_CAMERA_SPLINE,
} from '@presets/spline/aisle9CameraSplines';

import { toTuple } from '../utils/vectors';

const V1_GUIDED_TOUR_SPLINE =
  AISLE9_CAMERA_SPLINES[DEFAULT_AISLE9_CAMERA_SPLINE];

export const STORE_CENTER = [
  CENTER_STORE_REF_POSITION.x,
  CENTER_STORE_REF_POSITION.y,
  CENTER_STORE_REF_POSITION.z,
];

export const V1_SPLINE_PROPS = {
  closed: V1_GUIDED_TOUR_SPLINE.closed,
  tension: V1_GUIDED_TOUR_SPLINE.tension,
};

export const STORE_GUIDED_PATH = V1_GUIDED_TOUR_SPLINE.points.map((point) => ({
  position: toTuple(point.position),
}));

export const STORE_ORBIT_CAMERA = {
  desktop: {
    fov: 52,
    pivot: [0, 0, 0],
    position: [0, 240, 480],
    target: [0, 0, 0],
  },
  mobile: {
    fov: 120,
    pivot: [0, 0, 0],
    position: [0, 240, 480],
    target: [0, 0, 0],
  },
};

// Operator cam: pivots around the black hole so the user can orbit freely
// from a standing-in-the-aisle starting position. Adjust after first use.
export const INTERIOR_OPERATOR_CAMERA = {
  desktop: {
    fov: 60,
    pivot: [STORE_CENTER[0], STORE_CENTER[1], STORE_CENTER[2]],
    position: [STORE_CENTER[0], STORE_CENTER[1], STORE_CENTER[2] + 150],
    target: [STORE_CENTER[0], STORE_CENTER[1], STORE_CENTER[2]],
  },
  mobile: {
    fov: 75,
    pivot: [STORE_CENTER[0], STORE_CENTER[1], STORE_CENTER[2]],
    position: [STORE_CENTER[0], STORE_CENTER[1], STORE_CENTER[2] + 150],
    target: [STORE_CENTER[0], STORE_CENTER[1], STORE_CENTER[2]],
  },
};

export const PARKING_LOT_ORBIT_CAMERA = {
  desktop: {
    fov: 50,
    pivot: [1428.3735, 28.5588, 3714.1915],
    position: [1895.8851, -94.9794, 5028.0299],
    target: [1428.3735, 28.5588, 3714.1915],
  },
  mobile: {
    fov: 71,
    pivot: [1428.3735, 28.5588, 3714.1915],
    position: [1895.8851, -94.9794, 5028.0299],
    target: [1428.3735, 28.5588, 3714.1915],
  },
};

export const STORE_FIXED_SHOTS = {
  surveillance1: {
    desktop: {
      fov: 80,
      position: [1391.178, 488.9425, -1378.6474],
      target: [14.6585, -368.5795, -176.0343],
    },
    mobile: {
      fov: 113,
      position: [1391.178, 488.9425, -1378.6474],
      target: [14.6585, -368.5795, -176.0343],
    },
  },
  surveillance2: {
    desktop: {
      fov: 80,
      position: [1942.5989, 541.7598, 508.8782],
      target: [421.1822, -259.0559, -662.6165],
    },
    mobile: {
      fov: 110,
      position: [1942.5989, 541.7598, 508.8782],
      target: [85, -259.0559, -662.6165],
    },
  },
  surveillance3: {
    desktop: {
      fov: 80,
      position: [-1560.9531, 530.6089, 616.6168],
      target: [-280.2008, -356.8199, -199.3305],
    },
    mobile: {
      fov: 106,
      position: [-1560.9531, 530.6089, 616.6168],
      target: [-280.2008, -356.8199, -199.3305],
    },
  },
  parkingLot: {
    desktop: {
      fov: 80,
      position: [2731.4239, 369.7285, 57.6482],
      target: [654.058, -598.7095, 1706.3125],
    },
    mobile: {
      fov: 120,
      position: [2731.4239, 369.7285, 57.6482],
      target: [-571, -598.7095, 1706.3125],
    },
  },
  backAlley: {
    desktop: {
      fov: 80,
      position: [-683.703, 1038.5103, -5838.9676],
      target: [7031.5736, -2702.3475, -7679.2539],
    },
    mobile: {
      fov: 80,
      position: [-683.703, 1038.5103, -5838.9676],
      target: [7031.5736, -2702.3475, -7679.2539],
    },
  },
  stockRoom: {
    desktop: {
      fov: 80,
      position: [-3332.5039, 468.7574, -5452.2801],
      target: [2997.8608, -3831.5421, 0.0777],
    },
    mobile: {
      fov: 120,
      position: [-3332.5039, 468.7574, -5452.2801],
      target: [2997.8608, -3831.5421, 0.0777],
    },
  },
};
