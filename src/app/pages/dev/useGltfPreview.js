import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { useEffect, useState } from 'react';

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
        const gltf =
          previewAsset.type === 'saved'
            ? await loadSavedGltf(previewAsset.url)
            : await loadUploadedGltf(
                previewAsset.files,
                previewAsset.primaryFilePath
              );

        if (!cancelled) {
          setState({ error: null, gltf, status: 'ready' });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            error:
              error instanceof Error
                ? error.message
                : 'Preview could not be loaded.',
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
