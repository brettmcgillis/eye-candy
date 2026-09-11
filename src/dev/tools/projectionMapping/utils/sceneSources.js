import { AREAS, CHANNELS, getScenesFor } from '@app/sceneRegistry';

const configModules = import.meta.glob(
  '../../../../components/scenes/**/scene.config.jsx',
  { eager: true }
);
const presetModules = import.meta.glob(
  '../../../../components/scenes/**/presets/presets.js',
  { eager: true }
);

export const SCENE_SOURCES = Object.entries(configModules)
  .flatMap(([modulePath, module]) => {
    const entries = Array.isArray(module.default)
      ? module.default
      : [module.default];
    const presets =
      presetModules[
        modulePath.replace('/scene.config.jsx', '/presets/presets.js')
      ];

    return entries.flatMap((entry) => {
      const scene = getScenesFor(entry.channel, entry.area).find(
        (candidate) => candidate.id === entry.id
      );
      if (!scene || scene.id === 'noScene') return [];
      return {
        area: scene.area,
        channel: scene.channel,
        defaultPreset: presets?.DEFAULT_PRESET ?? null,
        id: `${scene.channel}:${scene.area}:${scene.id}`,
        label: scene.label,
        path: scene.path,
        presets: Object.keys(presets?.PRESETS ?? {}),
      };
    });
  })
  .sort(
    (left, right) =>
      left.channel.localeCompare(right.channel) ||
      left.area.localeCompare(right.area) ||
      left.label.localeCompare(right.label)
  );

export function getSceneOptionLabel(scene) {
  return `${CHANNELS[scene.channel]} / ${AREAS[scene.area]} / ${scene.label}`;
}

export function getSceneSource(path) {
  return SCENE_SOURCES.find((scene) => scene.path === path) ?? null;
}
