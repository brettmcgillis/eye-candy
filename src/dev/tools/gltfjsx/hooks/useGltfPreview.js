import { useEffect, useState } from 'react';

import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/v1/decoders/';

function getFileRelativePath(file) {
  return String(file.webkitRelativePath || file.relativePath || file.name || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
}

function normalizePosixPath(value) {
  const segments = [];

  value
    .replace(/\\/g, '/')
    .split('/')
    .forEach((segment) => {
      if (!segment || segment === '.') return;
      if (segment === '..') {
        segments.pop();
        return;
      }
      segments.push(segment);
    });

  return segments.join('/');
}

function getDirectoryName(filePath) {
  const index = filePath.lastIndexOf('/');
  return index === -1 ? '' : filePath.slice(0, index + 1);
}

function resolveRelativeAssetPath(baseFilePath, assetPath) {
  if (/^(blob:|data:|https?:)/i.test(assetPath)) {
    return assetPath;
  }

  const normalizedAssetPath = assetPath.replace(/^\.\//, '').replace(/^\//, '');
  return normalizePosixPath(
    `${getDirectoryName(baseFilePath)}${normalizedAssetPath}`
  );
}

function createLoader(loadingManager) {
  const dracoLoader = new DRACOLoader(loadingManager);
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);

  const gltfLoader = new GLTFLoader(loadingManager);
  gltfLoader.setDRACOLoader(dracoLoader);
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);

  return { dracoLoader, gltfLoader };
}

async function loadUploadedGltf(files, primaryFilePath) {
  const buffers = new Map(
    await Promise.all(
      files.map(async (file) => [
        getFileRelativePath(file),
        await file.arrayBuffer(),
      ])
    )
  );
  const primaryBuffer = buffers.get(primaryFilePath);

  if (!primaryBuffer) {
    throw new Error('The selected primary file is not available for preview.');
  }

  const loadingManager = new THREE.LoadingManager();
  const objectUrls = [];

  loadingManager.setURLModifier((assetPath) => {
    const resolvedAssetPath = resolveRelativeAssetPath(
      primaryFilePath,
      assetPath
    );
    const buffer = buffers.get(resolvedAssetPath);

    if (!buffer) {
      return assetPath;
    }

    const objectUrl = URL.createObjectURL(new Blob([buffer]));
    objectUrls.push(objectUrl);
    return objectUrl;
  });

  const { dracoLoader, gltfLoader } = createLoader(loadingManager);

  try {
    return await new Promise((resolve, reject) => {
      gltfLoader.parse(
        primaryBuffer,
        getDirectoryName(primaryFilePath),
        resolve,
        reject
      );
    });
  } finally {
    objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    dracoLoader.dispose?.();
  }
}

async function loadSavedGltf(url) {
  const loadingManager = new THREE.LoadingManager();
  const { dracoLoader, gltfLoader } = createLoader(loadingManager);

  try {
    return await gltfLoader.loadAsync(url);
  } finally {
    dracoLoader.dispose?.();
  }
}

// Shared loader so the Combine tab can pull in saved/uploaded models on demand
// without re-implementing the Draco + Meshopt loader wiring.
export async function loadGltfFromSource(source) {
  if (!source) {
    throw new Error('No model source provided.');
  }

  return source.type === 'saved'
    ? loadSavedGltf(source.url)
    : loadUploadedGltf(source.files, source.primaryFilePath);
}

function stripPreviewCacheKey(url) {
  return String(url || '').replace(/\?.*$/, '');
}

function formatSavedPreviewError(error, url) {
  const message =
    error instanceof Error ? error.message : 'Preview could not be loaded.';
  const cleanUrl = stripPreviewCacheKey(url);

  if (/Unexpected token '<'|<!doctype/i.test(message)) {
    return `Saved preview fetched HTML instead of model data from ${cleanUrl}. That usually means the resolved asset path does not point at a written .glb or .gltf file. Compare Write Summary, Saved Files, and CLI Output for the last attempt.`;
  }

  return `Saved preview failed at ${cleanUrl}: ${message}`;
}

export default function useGltfPreview(previewAsset) {
  const [state, setState] = useState({
    error: null,
    gltf: null,
    status: previewAsset ? 'loading' : 'idle',
  });

  useEffect(() => {
    if (!previewAsset) {
      setState({ error: null, gltf: null, status: 'idle' });
      return undefined;
    }

    let cancelled = false;

    async function loadPreview() {
      setState({ error: null, gltf: null, status: 'loading' });

      try {
        const gltf = await loadGltfFromSource(previewAsset);

        if (!cancelled) {
          setState({ error: null, gltf, status: 'ready' });
        }
      } catch (error) {
        if (!cancelled) {
          let previewError = 'Preview could not be loaded.';

          if (previewAsset.type === 'saved') {
            previewError = formatSavedPreviewError(error, previewAsset.url);
          } else if (error instanceof Error) {
            previewError = error.message;
          }

          setState({
            error: previewError,
            gltf: null,
            status: 'error',
          });
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [previewAsset]);

  return state;
}
