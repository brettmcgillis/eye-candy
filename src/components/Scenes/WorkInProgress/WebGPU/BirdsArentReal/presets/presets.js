export const DEFAULT_PRESET = "Birds Aren't Real";

const presetData = {
  // View mode + Bird POV / CCTV feed tuning.
  viewMode: 'cursor', // 'orbit' | 'pov' (auto-cycling CCTV) | 'cursor'
  povShotDuration: 4, // seconds each bird's feed holds before cutting to the next
  povFov: 58,
  povDolly: 0.05, // push the POV camera out past the lens glass
  hudOpacity: 0.56,
  scanlineIntensity: 0.3,
  vignetteIntensity: 0.3,
  chromaticStrength: 0.0015,
  // Flock — birds are hand-placed (see `birds` below), not scattered.
  birdType: 'pigeon',
  behavior: 'idle', // 'idle' | 'wander' (wander needs a walk-cycle species)
  animate: true,
  sweepRange: 0.7,
  sweepSpeed: 0.5,
  ledBlink: true,
  // Camera-head fit on the head bone (size + head-frame offset/rotation vec3s)
  camScale: 0.48,
  camOffset: { x: 0, y: 0.01, z: 0 }, // right / up / forward
  camRot: { x: 0, y: 0, z: 0 }, // pitch / yaw / roll
  ledOffset: { x: 0, y: 0, z: -0.12 }, // REC LED, normalized head units

  // Lighting (bright city day)
  skyColor: '#aec6e0',
  sunColor: '#fff4e0',
  sunIntensity: 2.6,
  ambientColor: '#b9c6d6',
  ambientIntensity: 0.35,
  envIntensity: 1,
  envBackground: true,
  fogColor: '#bcccdd',
  fogNear: 18,
  fogFar: 52,
  // Wet ground
  asphaltColor: '#9a9a9e',
  puddleColor: '#000000',
  puddleScale: 0.5,
  puddleAmount: 0.5,
  texScale: 0.18,
  reflectStrength: 0.9,
  reflectTint: '#dbe7f5',
  roughDry: 0.92,
  roughWet: 0.03,
  // Street props
  showStreet: true,
  curbScale: 2.25, // curb sits at origin (0,0,0), ~0.15 tall after ground-align
  busStopPos: { x: -0.7, y: 0.35, z: -1.8 }, // on top of the curb slab
  busStopRotY: 0,
  busStopScale: 1.9, // multiplier on top of the auto-fit (~5m wide)
  trashPos: { x: -5.5, y: 1.9, z: -2.8 }, // beside the bus stop
  trashRotY: 0,
  trashScale: 2, // multiplier on top of the auto-fit (~1.1m tall)
  manholePos: { x: -2.8, y: 0.38, z: 3 }, // on the asphalt in front of the curb
  manholeRotY: 0,
  manholeScale: 2.3, // multiplier on top of the auto-fit (~0.8m)
  // Hand-placed birds (flat keys match the Leva "Birds" schema 1:1; keys are
  // defined in utils/placements.js). rotY is the heading the bird + its camera
  // head face. Ballpark perch positions — fine-tune live, then copy.
  // On the rim of the trash can, looking out toward the scene.
  birdTrashRimPos: { x: -5.3, y: 2.82, z: -2.5 },
  birdTrashRimRotY: 0.5,
  // On the asphalt beside the manhole cover.
  birdManholePos: { x: -2.0, y: 0.35, z: 4.6 },
  birdManholeRotY: -2.3,
  // Inside the bus stop, perched on the bench.
  birdBenchPos: { x: 1.2, y: 1.28, z: -2.7 },
  birdBenchRotY: 0.2,
  // Inside the bus stop, on the floor in front of the bench.
  birdGroundPos: { x: -0.1, y: 0.35, z: -1.35 },
  birdGroundRotY: -0.6,
  // Two on the front-left corner of the roof.
  birdRoofFrontAPos: { x: -2.4, y: 5.66, z: -0.7 },
  birdRoofFrontARotY: 1.4,
  birdRoofFrontBPos: { x: -3.2, y: 5.66, z: -0.9 },
  birdRoofFrontBRotY: 0.4,
  // One on the back-right corner of the roof.
  birdRoofBackPos: { x: 8.3, y: 5.56, z: -1.86 },
  birdRoofBackRotY: 1.3,
  // Perched on the bus stop's inside crossbar.
  birdCrossbarPos: { x: 6.9, y: 5.48, z: 0 },
  birdCrossbarRotY: 0.9,
  // Fake bird standing by the nest.
  birdNestPos: { x: 5.4, y: 0.35, z: -1.0 },
  birdNestRotY: 1.2,
  // Busted fake bird on its side (frozen, dead lens, LED still blinks).
  birdFallenPos: { x: 2.0, y: 0.49, z: 3.0 },
  birdFallenRotY: 0,
  // Pigeon nest (sticks + 2 eggs) inside the bus shelter.
  nestPos: { x: 6.5, y: 0.35, z: -0.2 },
  nestRotY: 0,
  nestScale: 1.5,
  nestEggScale: 0.21,
  // Each egg positioned + rotated individually (nest-local), so they don't clip.
  nestEgg1Pos: { x: -0.08, y: 0.06, z: 0.03 },
  nestEgg1Rot: { x: 0, y: 0.4, z: 2 },
  nestEgg2Pos: { x: 0.09, y: 0.06, z: -0.05 },
  nestEgg2Rot: { x: 1, y: -0.3, z: -5 },
  // Street litter scattered on the asphalt.
  newspaper2Pos: { x: 2.5, y: 0.36, z: 2.5 },
  newspaper2RotY: 0.6,
  newspaper2Scale: 1.5,
  cigButtsPos: { x: -0.8, y: 0.38, z: -3.2 },
  cigButtsRotY: -1.2,
  cigButtsScale: 1.15,
  litter1Pos: { x: 0, y: 0.38, z: -3.6 },
  litter1RotY: 0,
  litter1Scale: 1.4,
  litter2Pos: { x: -3.7, y: 0.38, z: -1.6 },
  litter2RotY: -2.1,
  litter2Scale: 1.4,
  // Bus-stop ad overrides (CRT art video + "They Live" glitch). Map face
  // (InsideBack) is left untouched; only the three ad faces are overridden.
  adArtScaleX: 1,
  adArtScaleY: 1,
  adArtOffsetX: 0,
  adArtOffsetY: 0,
  adArtBg: '#0a0a0a',
  adGlitchTile: 3,
  adGlitchWidth: 0.8,
  adGlitchHeight: 0.7,
  adGlitchMinGap: 4.5,
  adGlitchMaxGap: 10,
  adGlitchDuration: 0.55,
  adGlitchStutter: 0.82,
  // Bloom (gentle — just lifts the REC LEDs and sky glint)
  bloomEnabled: true,
  bloomThreshold: 0.9,
  bloomStrength: 0.35,
  bloomRadius: 0.5,
};

const PRESETS = {
  "Birds Aren't Real": {
    ...presetData,
    viewMode: 'orbit',
  },
  'FakeBirds Eye View': {
    ...presetData,
    viewMode: 'pov',
  },
  'Surveillance State': {
    ...presetData,
    viewMode: 'cursor',
  },
};

export default PRESETS;
