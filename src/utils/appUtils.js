function isLocalHost() {
  const host = window.location.hostname;
  const isGhPages = host.endsWith('github.io');
  const onLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(host);
  const onLocalNetwork = host.startsWith('192.168.');
  return (onLocalHost || onLocalNetwork) && !isGhPages;
}

function testMode() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('testmode') === 'true';
}

export function localEnv() {
  return isLocalHost() && !testMode();
}

function assetPath(pathToAsset) {
  const normalizedPath = pathToAsset.startsWith('/')
    ? pathToAsset.substring(1)
    : pathToAsset;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

export function audioFile(fileName) {
  return assetPath(`/audio/${fileName}`);
}

export function modelFile(fileName) {
  return assetPath(`/models/${fileName}`);
}

export function videoFile(fileName) {
  return assetPath(`/videos/${fileName}`);
}

export function imageFile(fileName) {
  return assetPath(`/images/${fileName}`);
}

export function textureFile(fileName) {
  return assetPath(`/textures/${fileName}`);
}

export function fontFile(fileName) {
  return assetPath(`/fonts/${fileName}`);
}

export function iconFile(fileName) {
  return assetPath(`/icons/${fileName}`);
}
