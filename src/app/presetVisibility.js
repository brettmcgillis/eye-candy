const visibilityFiles = import.meta.glob(
  '../components/scenes/*/*/presets/visibility.json',
  { eager: true, import: 'default' }
);

const PUBLIC_PRESETS = Object.fromEntries(
  Object.entries(visibilityFiles).map(([file, visibility]) => [
    file
      .replace(/^\.\.\/components\/scenes\//u, '')
      .replace(/\/presets\/visibility\.json$/u, ''),
    Array.isArray(visibility?.public) ? visibility.public : [],
  ])
);

export default function getPublicPresets(sourceDir) {
  return PUBLIC_PRESETS[sourceDir] ?? [];
}
