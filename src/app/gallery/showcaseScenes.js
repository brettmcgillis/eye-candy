import { CHANNELS, getScenePath } from '../sceneRegistry';

const configModules = import.meta.glob(
  '../../components/scenes/**/scene.config.jsx',
  { eager: true }
);

const thumbnails = import.meta.glob(
  '../../components/scenes/**/thumbnail.webp',
  { eager: true, import: 'default' }
);

function toShowcaseScenes() {
  const seenDirs = new Set();
  const scenes = [];

  Object.entries(configModules).forEach(([file, mod]) => {
    const dir = file.slice(0, file.lastIndexOf('/'));
    const entries = Array.isArray(mod.default) ? mod.default : [mod.default];

    entries
      .filter((entry) => entry.area === 'showcase')
      .forEach((entry) => {
        // One card per scene folder, even when it registers under both channels.
        if (seenDirs.has(dir)) return;
        seenDirs.add(dir);
        scenes.push({
          id: entry.id,
          label: entry.title || entry.label || entry.id,
          channel: CHANNELS[entry.channel],
          byline: entry.byline ?? null,
          path: getScenePath('showcase', entry.route ?? entry.id),
          thumbnail: thumbnails[`${dir}/thumbnail.webp`] ?? null,
        });
      });
  });

  return scenes.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );
}

const SHOWCASE_SCENES = toShowcaseScenes();

export default SHOWCASE_SCENES;
