import { AREAS, CHANNELS, getScenesFor } from '@app/sceneRegistry';

const sceneConfigModules = import.meta.glob(
  '../../../components/scenes/**/scene.config.jsx',
  { eager: true }
);

const AREA_ORDER = ['showcase', 'wip', 'toolbox', 'testlab'];
const SCENE_PATH_PATTERN =
  /components\/scenes\/(WebGL|WebGPU|Shared)\/([^/]+)/u;

function getSceneSource(modulePath) {
  const match = modulePath.match(SCENE_PATH_PATTERN);

  if (!match) return null;

  return {
    folderKey: `${match[1]}/${match[2]}`,
    sourcePath: `src/components/scenes/${match[1]}/${match[2]}`,
  };
}

function findRegisteredScene(entry) {
  return getScenesFor(entry.channel, entry.area).find(
    (scene) =>
      scene.id === entry.id && scene.route === (entry.route ?? entry.id)
  );
}

export function buildCatalogScenes(presetsByFolder = {}) {
  return Object.entries(sceneConfigModules)
    .flatMap(([modulePath, module]) => {
      const source = getSceneSource(modulePath);
      const entries = Array.isArray(module.default)
        ? module.default
        : [module.default];

      if (!source) return [];

      return entries.map((entry) => {
        const registeredScene = findRegisteredScene(entry);
        const presetNames = presetsByFolder[source.folderKey] ?? [];

        return {
          key: `${entry.channel}:${entry.id}`,
          id: entry.id,
          label: entry.label,
          channel: entry.channel,
          channelLabel: CHANNELS[entry.channel],
          area: entry.area,
          areaLabel: AREAS[entry.area],
          path: registeredScene?.path ?? null,
          presetNames,
          slug: registeredScene?.route ?? entry.route ?? entry.id,
          sourcePath: source.sourcePath,
        };
      });
    })
    .sort(
      (left, right) =>
        AREA_ORDER.indexOf(left.area) - AREA_ORDER.indexOf(right.area) ||
        left.label.localeCompare(right.label) ||
        left.channel.localeCompare(right.channel)
    );
}

export function getStatusKey(sceneKey, presetName = null) {
  return `${sceneKey}::${presetName ?? '$scene'}`;
}

export function getSceneTargets(scene) {
  return [null, ...scene.presetNames];
}

export { AREA_ORDER };
