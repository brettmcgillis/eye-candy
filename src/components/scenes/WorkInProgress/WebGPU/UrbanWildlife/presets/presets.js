export const DEFAULT_PRESET = 'Night Danger';

// Settings shared by both modes: the streetlight, lamp, lighting, ground, trash,
// weapon attachment tuning and bloom. The two presets differ only in how the
// three raccoons are posed/armed and whether their clips play (animated vs. hero).
const SHARED = {
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
  // Trash can placements (tunable). t1/t2 upright cans, t3 tipped can body, t4 lid.

  t1PosX: -2.1,
  t1PosY: 0,
  t1PosZ: -1.05,
  t1RotX: 0,
  t1RotY: 0,
  t1RotZ: 0,
  t2PosX: -1.45,
  t2PosY: 0,
  t2PosZ: -2,
  t2RotX: 0,
  t2RotY: 0.6,
  t2RotZ: 0,
  t3PosX: -0.1,
  t3PosY: 0.21000000000000002,
  t3PosZ: 0.1,
  t3RotX: 1.55,
  t3RotY: 3.0500000000000003,
  t3RotZ: -1.5292036732051035,
  t4PosX: 0.55,
  t4PosY: -0.39,
  t4PosZ: 0.45,
  t4RotX: 0.7792036732051035,
  t4RotY: -2.25,
  t4RotZ: 1.5,
  // Gun attachment tuning (local to the holding hand bone). Magnum self-scales
  // to 0.193, so ~1 here yields a sensible revolver in the paw.
  gunScale: 1,
  gunPosX: 0,
  gunPosY: 0.11,
  gunPosZ: 0.020000000000000004,
  gunRotX: -2,
  gunRotY: 0,
  gunRotZ: -2,
  // Knife attachment tuning (local to the holding hand bone). BowieKnife uses its
  // raw model scale, so start small and dial in via the Knife folder.
  knifeScale: 0.91,
  knifePosX: 0.105,
  knifePosY: 0.02,
  knifePosZ: -0.08,
  knifeRotX: -0.05,
  knifeRotY: -0.7,
  knifeRotZ: 3.14,
  // Bloom
  bloomEnabled: true,
  bloomThreshold: 0.7,
  bloomStrength: 0.7,
  bloomRadius: 0.6,
};

const PRESETS = {
  // Animated mode: the three raccoons play their looping idle clips, one toying
  // with the revolver it found in the spilled trash.
  'Night Danger': {
    ...SHARED,
    // Raccoons — global
    animatePoses: true,
    // Raccoon 1 (gun holder)
    r1Pose: 'racoon|idle eat',
    r1X: 0.25,
    r1Z: 0.55,
    r1RotY: -0.6,
    r1Scale: 1.0,
    r1Weapon: 'gun',
    r1WeaponHand: 'right',
    // Raccoon 2 (rummaging)
    r2Pose: 'racoon|idle eat 2',
    r2X: -0.95,
    r2Z: -0.2,
    r2RotY: 1.1,
    r2Scale: 1.0,
    r2Weapon: 'none',
    r2WeaponHand: 'right',
    // Raccoon 3 (lookout)
    r3Pose: 'racoon|idle smell',
    r3X: 1.25,
    r3Z: -0.25,
    r3RotY: -1.6,
    r3Scale: 1.0,
    r3Weapon: 'none',
    r3WeaponHand: 'right',
  },
  // Stationary hero mode: frozen single-frame poses — an angry raccoon flanked by
  // one wielding a knife and one wielding a gun. Built for the band-merch shot.
  'Hero Standoff': {
    ...SHARED,
    // Raccoons — global
    animatePoses: false,
    // Raccoon 1 (angry, unarmed, centre)
    r1Pose: 'angry-singleFrame',
    r1X: 0.0,
    r1Z: 0.4,
    r1RotY: 1.8,
    r1Scale: 1.0,
    r1Weapon: 'none',
    r1WeaponHand: 'right',
    // Raccoon 2 (gun)
    r2Pose: 'holding-singleFrame',
    r2X: -1.0,
    r2Z: -0.1,
    r2RotY: -0.2,
    r2Scale: 1.0,
    r2Weapon: 'gun',
    r2WeaponHand: 'right',
    // Raccoon 3 (knife)
    r3Pose: 'holding2-singleFrame',
    r3X: 1.1,
    r3Z: -0.1,
    r3RotY: -0.5,
    r3Scale: 1.0,
    r3Weapon: 'knife',
    r3WeaponHand: 'right',
  },
};

export default PRESETS;
