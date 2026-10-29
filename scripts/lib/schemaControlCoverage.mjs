import loadModules from './loadModules.mjs';

const REGISTRY = '/src/modules/schemaControls/index.js';

// Leva's setControls throws on a key with no control in the store, so an
// option-schema key whose section has no folder breaks every preset change
// that sets it (the dropdown snaps back and the rest of the preset is
// dropped) while PRESETS itself still looks perfect. `entries` are the
// repo-rooted paths of the scene's controls modules; each
// createSchemaFolders they build records the keys it left without a folder,
// and this returns one failure message per such key.
export default async function schemaControlCoverage(entries) {
  const loaded = await loadModules([REGISTRY, ...entries]);
  return loaded[REGISTRY].schemaFoldersRegistry.flatMap(
    ({ label, uncovered }) =>
      uncovered.map(
        (key) =>
          `controls: ${label} has no Leva control for "${key}" — add its section to the folders in the scene's controls module.`
      )
  );
}
