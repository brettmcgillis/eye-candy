export default function buildCaptureMetadata(sceneName) {
  return {
    Artist: 'Brett McGillis',
    Copyright: `© ${new Date().getFullYear()} Brett McGillis`,
    Scene: sceneName,
    Software: 'eye-candy',
    Instagram: '@ruinedpaintings',
    'Creation Time': new Date().toISOString(),
  };
}
