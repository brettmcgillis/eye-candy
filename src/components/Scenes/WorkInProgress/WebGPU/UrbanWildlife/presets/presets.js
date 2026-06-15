export const DEFAULT_PRESET = 'Night Danger';

const PRESETS = {
  'Night Danger': {
    // Streetlight
    streetlightX: -1.7,
    streetlightZ: -1.3,
    streetlightScale: 3.5,
    showBase: true,
    glassColor: '#ffb347',
    glassEmissive: 6,
    // Lamp (light inside the streetlight head)
    lampColor: '#ffae42',
    lampIntensity: 14,
    lampHeight: 4.7,
    lampDistance: 16,
    lampDecay: 1.6,
    lampFlicker: 0.12,
    // Lighting (global night fill)
    ambientIntensity: 0.18,
    ambientColor: '#2a3b5c',
    moonIntensity: 0.35,
    moonColor: '#6f86c9',
    // Environment
    bgColor: '#070a14',
    fogColor: '#0a0e1a',
    fogNear: 7,
    fogFar: 26,
    // Wet ground
    asphaltColor: '#3a3a42',
    puddleColor: '#05060a',
    puddleScale: 0.55,
    puddleAmount: 0.52,
    texScale: 0.22,
    reflectStrength: 0.7,
    reflectTint: '#ffd9a0',
    rippleScale: 6,
    rippleStrength: 0.03,
    rippleSpeed: 1,
    roughDry: 0.92,
    roughWet: 0.04,
    // Trash
    showTrash: true,
    // Raccoons — global
    animatePoses: false,
    // Raccoon 1 (gun holder)
    r1Pose: 'racoon|idle eat',
    r1X: 0.25,
    r1Z: 0.55,
    r1RotY: -0.6,
    r1Scale: 1.0,
    r1HoldsGun: true,
    r1GunHand: 'right',
    // Raccoon 2 (rummaging)
    r2Pose: 'racoon|idle eat 2',
    r2X: -0.95,
    r2Z: -0.2,
    r2RotY: 1.1,
    r2Scale: 1.0,
    r2HoldsGun: false,
    r2GunHand: 'right',
    // Raccoon 3 (lookout)
    r3Pose: 'racoon|idle smell',
    r3X: 1.25,
    r3Z: -0.25,
    r3RotY: -1.6,
    r3Scale: 1.0,
    r3HoldsGun: false,
    r3GunHand: 'right',
    // Gun attachment tuning (local to the holding hand bone). Magnum self-scales
    // to 0.193, so ~1 here yields a sensible revolver in the paw.
    gunScale: 1.0,
    gunPosX: 0.02,
    gunPosY: 0.0,
    gunPosZ: 0.03,
    gunRotX: 0,
    gunRotY: 0,
    gunRotZ: 0,
    // Bloom
    bloomEnabled: true,
    bloomThreshold: 0.7,
    bloomStrength: 0.7,
    bloomRadius: 0.6,
  },
};

export default PRESETS;
