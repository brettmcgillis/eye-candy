// Animation clip names baked into public/models/racoon.glb.
// Poses authored in the GLTF Workbench are stored as single-frame animations,
// so these double as the "pose" options for each raccoon in the scene. When new
// posed exports land, add their clip names here (or they'll show up automatically
// via the live list passed down from the loaded model).
const RACOON_CLIPS = [
  'racoon|idle 3',
  'racoon|dead pose lft',
  'racoon|dead run',
  'racoon|hit chest back',
  'racoon|hit chest front',
  'racoon|hit chest lft',
  'racoon|idle alerted pose',
  'racoon|idle alerted shared bark',
  'racoon|idle call shared bark',
  'racoon|idle call shared mate',
  'racoon|idle eat',
  'racoon|idle eat 2',
  'racoon|idle pose',
  'racoon|idle pose to drink pose',
  'racoon|idle rest pose isle alert pose transition',
  'racoon|idle rest stretching',
  'racoon|idle smell',
  'racoon|idle stretch',
  'racoon|idle to walk fwd',
  'racoon|interact trashcan',
  'racoon|interact trashcan 2',
  'racoon|interact trashcan hit react',
  'racoon|low pose',
  'racoon|low pose to jump 135 lft',
  'racoon|low pose to jump 45 lft',
  'racoon|low pose to jump fwd',
  'racoon|rest idle',
  'racoon|rest idle 2',
  'racoon|sprint fwd',
  'racoon|sprint fwd to idle sharp',
  'racoon|trot fwd',
  'racoon|trot fwd to idle pose',
  'racoon|turn lft 180',
  'racoon|turn lft 90',
  'racoon|blueprints',
];

export default RACOON_CLIPS;
