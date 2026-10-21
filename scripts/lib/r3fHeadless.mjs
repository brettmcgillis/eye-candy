/* eslint-disable import/no-extraneous-dependencies */
import { NodeIO } from '@gltf-transform/core';
import {
  EXTTextureWebP,
  KHRDracoMeshCompression,
  KHRMaterialsClearcoat,
  KHRMaterialsSpecular,
} from '@gltf-transform/extensions';

import draco3d from 'draco3dgltf';
import { resolveObjectURL } from 'node:buffer';
import path from 'node:path';
import sharp from 'sharp';

import { REPO_ROOT } from './loadModules.mjs';

// What a render workbench's real R3F stage needs to load assets in Node,
// where there is no <img>, no fetch of public/ and no Draco worker. See
// docs/render-workbench.md §5.

const publicFile = (url) =>
  path.join(
    REPO_ROOT,
    'public',
    decodeURIComponent(new URL(url, 'http://local/').pathname)
  );

async function decodeImage(url) {
  if (url.startsWith('blob:')) {
    const blob = resolveObjectURL(url);
    return { flip: false, input: Buffer.from(await blob.arrayBuffer()) };
  }
  return { flip: true, input: publicFile(url) };
}

// three's TextureLoader decodes through an <img>; headless, a texture the
// stage asks for is read from public/ and handed over as data, flipped the
// way an image texture's upload would flip it. A GLB's embedded image
// arrives as a blob: URL and is left unflipped, as glTF textures are.
export function installTextureLoader(THREE) {
  /* eslint-disable func-names, no-param-reassign */
  THREE.TextureLoader.prototype.load = function (url, onLoad, _, onError) {
    const texture = new THREE.DataTexture(new Uint8Array(4), 1, 1);
    decodeImage(url)
      .then(({ flip, input }) => {
        const image = sharp(input).ensureAlpha();
        return (flip ? image.flip() : image)
          .raw()
          .toBuffer({ resolveWithObject: true });
      })
      .then(({ data, info }) => {
        texture.image = {
          data: new Uint8Array(data),
          height: info.height,
          width: info.width,
        };
        texture.flipY = false;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        onLoad?.(texture);
      })
      .catch((error) => (onError ? onError(error) : Promise.reject(error)));
    return texture;
  };
  /* eslint-enable func-names, no-param-reassign */
}

let io = null;

async function gltfIO() {
  io ??= new NodeIO()
    .registerExtensions([
      EXTTextureWebP,
      KHRDracoMeshCompression,
      KHRMaterialsClearcoat,
      KHRMaterialsSpecular,
    ])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
    });
  return io;
}

const DROPPED = new Set(['EXT_texture_webp', 'KHR_draco_mesh_compression']);

// A GLB from public/ with its Draco meshes decoded and its WebP textures
// re-encoded as PNG, so GLTFLoader parses it with no decoder worker and no
// WebP support check (which needs an <img>).
async function plainGlb(url) {
  const reader = await gltfIO();
  const doc = await reader.read(publicFile(url));
  await Promise.all(
    doc
      .getRoot()
      .listTextures()
      .filter((texture) => texture.getMimeType() === 'image/webp')
      .map(async (texture) => {
        texture
          .setImage(await sharp(texture.getImage()).png().toBuffer())
          .setMimeType('image/png');
      })
  );
  doc
    .getRoot()
    .listExtensionsUsed()
    .filter((extension) => DROPPED.has(extension.extensionName))
    .forEach((extension) => extension.dispose());
  const glb = await reader.writeBinary(doc);
  return glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength);
}

// GLTFLoader.load reads the file itself (see plainGlb) and parses it, so a
// stage's useLoader(GLTFLoader, url) works headlessly unchanged.
export function installGltfLoader(GLTFLoader) {
  const cache = new Map();
  /* eslint-disable func-names, no-param-reassign */
  GLTFLoader.prototype.load = function (url, onLoad, _, onError) {
    if (!cache.has(url)) cache.set(url, plainGlb(url));
    cache
      .get(url)
      .then((buffer) => this.parse(buffer.slice(0), '', onLoad, onError))
      .catch((error) => (onError ? onError(error) : Promise.reject(error)));
  };
  /* eslint-enable func-names, no-param-reassign */
}

export const until = async (test, label, tries = 600) => {
  for (let i = 0; i < tries; i += 1) {
    if (test()) return;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  }
  throw new Error(`timed out waiting for ${label}`);
};
