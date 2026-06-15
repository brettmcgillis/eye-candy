// Registry of "fake bird" species. Each fake bird is an ordinary rigged bird GLB
// with its head replaced by the security-camera head (see CameraHead.jsx). New
// models drop in here without touching the scene code.
//
// Per-species metadata the scene/components need:
//   file        - GLB under public/models
//   label       - Leva dropdown label
//   headBone    - bone the camera head is parented to (so it bobs with the rig)
//   clips        { idle, walk } - animation clip names baked into the GLB. `walk`
//                 is null until a model ships with a locomotion cycle.
//   locomotion  - true when the model has a real walk cycle and can roam. Drives
//                 whether the scene lets an instance WANDER vs. stand and idle.
//   modelScale  - base scale to read at roughly bird size in the scene
//   speed       - roam speed (units/sec) when wandering; ignored if !locomotion
//   cam          { scale } - default camera-head size (scene units) for this model.
//                 The scene's Camera Head controls (Size/Aim/Lift) override live.
//
// pigeon.glb is a "chicken" rig with a single ~7.5s look-around idle (no roaming),
// so it stands and glances while the camera head sweeps. Future walking models set
// locomotion:true and provide a `walk` clip to roam the scene.

export const BIRDS = {
  pigeon: {
    file: 'pigeon.glb',
    label: 'Pigeon',
    headBone: 'Chicken_Head_JawSHJnt_47',
    clips: { idle: 'Animation', walk: null },
    locomotion: false,
    modelScale: 1,
    speed: 0.35,
    cam: {
      // Camera head rides the headBone (for scale + position follow). Its AIM is
      // derived from a triangle of neck/head joints so it points where the head
      // looks: base = two endpoints, apex = the off-line third point. forward runs
      // base[0] -> base[1] (neck -> head); up is the in-plane perpendicular. If a
      // future species omits orientJoints, it falls back to the static yaw/pitch.
      scale: 0.48,
      anchor: 'baseMid', // sit at the midpoint of the two base joints
      orientJoints: {
        base: ['Chicken_Neck_01_02SHJnt_49', 'Chicken_Head_JawSHJnt_47'],
        apex: 'Chicken_Neck_01_03SHJnt_48',
      },
    },
  },
};

export const DEFAULT_BIRD = 'pigeon';

// Leva dropdown options: { Label: key }
export const BIRD_OPTIONS = Object.fromEntries(
  Object.entries(BIRDS).map(([key, b]) => [b.label, key])
);
