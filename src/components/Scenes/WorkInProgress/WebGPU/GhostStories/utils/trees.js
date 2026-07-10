import { Tree } from '@dgreenheck/ez-tree';

// A small stable of ez-tree templates, generated once per session and
// cloned into chunks (clones share geometry + materials, so each placed
// tree costs two draw calls and no regeneration). Note: ez-tree's leaf
// wind is a WebGL onBeforeCompile injection, so on WebGPU the leaves hold
// still — acceptable for moonlit dead-of-night trees.
const TEMPLATE_SPECS = [
  { preset: 'Ash Medium', seed: 1013 },
  { preset: 'Aspen Medium', seed: 2027 },
  { preset: 'Oak Medium', seed: 3041 },
  { preset: 'Ash Small', seed: 4057 },
  { preset: 'Bush 1', seed: 5077 },
];

let templates = null;

export default function getTreeTemplates() {
  if (templates) return templates;

  templates = TEMPLATE_SPECS.map(({ preset, seed }) => {
    const tree = new Tree();
    tree.loadPreset(preset);
    tree.options.seed = seed;
    tree.generate();
    tree.branchesMesh.castShadow = false;
    tree.branchesMesh.receiveShadow = false;
    tree.leavesMesh.castShadow = false;
    tree.leavesMesh.receiveShadow = false;
    return tree;
  });

  return templates;
}
