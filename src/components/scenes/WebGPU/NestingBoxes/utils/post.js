import CAMERA from './camera';

const [px, py, pz] = CAMERA.orbit.desktop.position;
const [tx, ty, tz] = CAMERA.orbit.desktop.target;

// Godrays raymarch the `key` light's shadow map from utils/lighting.js.
const POST = {
  godrays: {
    type: 'godrays',
    enabled: false,
    light: 'key',
    blendColor: '#fff1dd',
    density: 0.7,
    distanceAttenuation: 1.2,
    maxDensity: 0.4,
    raymarchSteps: 48,
  },
  dof: {
    type: 'dof',
    enabled: false,
    bokehScale: 4,
    focalLength: 2.5,
    focusDistance: Math.hypot(px - tx, py - ty, pz - tz),
    focusMode: 'target',
    focusSmoothing: 6,
  },
};

export default POST;
