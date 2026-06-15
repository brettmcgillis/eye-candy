export const DEFAULT_PRESET = 'Surveillance State';

const PRESETS = {
  'Surveillance State': {
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
    busStopPos: { x: -0.7, y: 0.18, z: -1.8 }, // on top of the curb slab
    busStopRotY: 0,
    busStopScale: 1.9, // multiplier on top of the auto-fit (~5m wide)
    trashPos: { x: -5.5, y: 1.75, z: -2.8 }, // beside the bus stop
    trashRotY: 0,
    trashScale: 2, // multiplier on top of the auto-fit (~1.1m tall)
    manholePos: { x: -1.8, y: -0.02, z: 7 }, // on the asphalt in front of the curb
    manholeRotY: 0,
    manholeScale: 2.3, // multiplier on top of the auto-fit (~0.8m)
    // Hand-placed birds (flat keys match the Leva "Birds" schema 1:1; keys are
    // defined in utils/placements.js). rotY is the heading the bird + its camera
    // head face. Ballpark perch positions — fine-tune live, then copy.
    // On the rim of the trash can, looking out toward the scene.
    birdTrashRimPos: { x: -5.3, y: 2.65, z: -2.5 },
    birdTrashRimRotY: 0.5,
    // On the asphalt beside the manhole cover.
    birdManholePos: { x: -1.0, y: 0, z: 6.6 },
    birdManholeRotY: -2.3,
    // Inside the bus stop, perched on the bench.
    birdBenchPos: { x: 1.2, y: 1.1, z: -2.7 },
    birdBenchRotY: 0.2,
    // Inside the bus stop, on the floor in front of the bench.
    birdGroundPos: { x: -0.1, y: 0.18, z: -1.35 },
    birdGroundRotY: -0.6,
    // Two on the front-left corner of the roof.
    birdRoofFrontAPos: { x: -2.4, y: 5.5, z: -0.7 },
    birdRoofFrontARotY: 1.4,
    birdRoofFrontBPos: { x: -3.2, y: 5.5, z: -0.9 },
    birdRoofFrontBRotY: 0.4,
    // One on the back-right corner of the roof.
    birdRoofBackPos: { x: 8.4, y: 5.5, z: -1.8 },
    birdRoofBackRotY: 0.7,
    // Perched on the bus stop's inside crossbar.
    birdCrossbarPos: { x: 6.9, y: 5.3, z: 0 },
    birdCrossbarRotY: 0.9,
    // Bloom (gentle — just lifts the REC LEDs and sky glint)
    bloomEnabled: true,
    bloomThreshold: 0.9,
    bloomStrength: 0.35,
    bloomRadius: 0.5,
  },
};

export default PRESETS;
