// Fire and smoke as one raymarched volume along authored trails: a baked
// guide field, cloud lighting (Henyey-Greenstein, self-shadow), flame
// emission over each trail's start, optional cone lights scattering in the
// smoke and a haze, marched at reduced resolution and depth-composited over
// a scene pass.
export {
  createPlumeUniforms,
  createSpotTexture,
  default as createPlumeVolume,
  SPOT_TEXELS,
  updatePlumeCamera,
  writeSpot,
} from './createPlumeVolume';
export {
  default as bakePlumeGuide,
  plumeBounds,
  plumePointsTexture,
} from './plumeGuide';
