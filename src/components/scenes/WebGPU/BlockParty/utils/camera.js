import { ELEVATION_DEGREES as ELEVATION } from './elevation';

const TARGET = [0, 0, 0];
const AZIMUTH = 45;
const DISTANCE = 40;

function isometricPosition(distance) {
  const elevation = (ELEVATION * Math.PI) / 180;
  const azimuth = (AZIMUTH * Math.PI) / 180;
  const ground = Math.cos(elevation) * distance;

  return [
    ground * Math.cos(azimuth),
    Math.sin(elevation) * distance,
    ground * Math.sin(azimuth),
  ];
}

const CAMERA = {
  defaultMode: 'orbit',
  far: 200,
  frustumHeight: 13,
  mobileFrustumHeight: 17,
  near: 0.01,
  orbit: {
    desktop: {
      pivot: TARGET,
      position: isometricPosition(DISTANCE),
      target: TARGET,
    },
    mobile: {
      pivot: TARGET,
      position: isometricPosition(DISTANCE),
      target: TARGET,
    },
  },
  projection: 'orthographic',
};

export default CAMERA;
