export const DEFAULT_PRESET = 'Default';

export const PRESETS = {
  Default: {
    cameraMode: 'orbit',
    orbitAutoRotate: false,
    orbitDesktopPosition: { x: 15, y: 4, z: -9 },
    orbitDesktopTarget: { x: 0, y: 2.2, z: 0 },
    orbitMobilePosition: { x: 19, y: 4.5, z: -11 },
    orbitMobileTarget: { x: 0, y: 2.2, z: 0 },
    orbitMinPolarAngle: 60,
    orbitMaxPolarAngle: 92,
    nightMode: false,
  },
  Night: {
    cameraMode: 'orbit',
    orbitAutoRotate: false,
    orbitDesktopPosition: { x: 15, y: 4, z: -9 },
    orbitDesktopTarget: { x: 0, y: 2.2, z: 0 },
    orbitMobilePosition: { x: 19, y: 4.5, z: -11 },
    orbitMobileTarget: { x: 0, y: 2.2, z: 0 },
    orbitMinPolarAngle: 60,
    orbitMaxPolarAngle: 92,
    nightMode: true,
    nightLightIntensity: 0.35,
    terrainColor: '#3d5a48',
    lightKeyIntensity: 0.8,
    lightAmbientIntensity: 0.25,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
