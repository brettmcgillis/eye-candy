import getPublicPresets from '../presetVisibility';
import { CHANNELS, getScenePath } from '../sceneRegistry';

const configModules = import.meta.glob(
  '../../components/scenes/**/scene.config.jsx',
  { eager: true }
);

const thumbnails = import.meta.glob(
  '../../components/scenes/**/thumbnail.webp',
  { eager: true, import: 'default' }
);

const bylines = import.meta.glob('../../components/scenes/**/byline.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const screenshotManifests = import.meta.glob(
  '../../components/scenes/**/screenshots/screenshots.json',
  { eager: true, import: 'default' }
);

const screenshotImages = import.meta.glob(
  '../../components/scenes/**/screenshots/*.{webp,webm}',
  { eager: true, import: 'default' }
);

function toPublicPreset(preset, publicPresets) {
  return preset && publicPresets.includes(preset) ? preset : null;
}

function getScreenshots(dir, thumbnail, publicPresets) {
  const manifest =
    screenshotManifests[`${dir}/screenshots/screenshots.json`] ?? {};
  const list = Array.isArray(manifest)
    ? manifest
    : (manifest.screenshots ?? []);
  const shots = list
    .map(({ file, caption, preset }) => ({
      src: screenshotImages[`${dir}/screenshots/${file}`],
      video: file.endsWith('.webm'),
      caption,
      preset: toPublicPreset(preset, publicPresets),
    }))
    .filter((shot) => shot.src);

  const main = thumbnail
    ? [
        {
          src: thumbnail,
          caption: manifest.mainCaption ?? '',
          preset: toPublicPreset(manifest.mainPreset, publicPresets),
        },
      ]
    : [];
  return [...main, ...shots];
}

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
        const thumbnail = thumbnails[`${dir}/thumbnail.webp`] ?? null;
        const publicPresets = getPublicPresets(
          dir.replace(/^(?:\.\.\/)+components\/scenes\//u, '')
        );
        scenes.push({
          id: entry.id,
          label: entry.title || entry.label || entry.id,
          channel: CHANNELS[entry.channel],
          byline: bylines[`${dir}/byline.md`]?.trim() || entry.byline || null,
          linkDisabled: entry.galleryLink === false,
          path: getScenePath('showcase', entry.route ?? entry.id),
          publicPresets,
          screenshots: getScreenshots(dir, thumbnail, publicPresets),
          thumbnail,
        });
      });
  });

  return scenes.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );
}

const SHOWCASE_SCENES = toShowcaseScenes();

export default SHOWCASE_SCENES;
