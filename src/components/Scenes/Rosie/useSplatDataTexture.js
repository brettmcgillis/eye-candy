/* eslint-disable no-plusplus */
import * as THREE from 'three';

import { useMemo } from 'react';

import { useLoader } from '@react-three/fiber';

function imgToRgba(img) {
  const w = img.width;
  const h = img.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  return {
    rgba: imageData.data,
    width: w,
    height: h,
  };
}

export default function useSplatDataTexture(url) {
  const texture = useLoader(THREE.TextureLoader, url);

  return useMemo(() => {
    if (!texture?.image) return null;

    const { rgba, width, height } = imgToRgba(texture.image);

    const depth = 1;
    const data = new Uint8Array(4 * width * height * depth);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = (y * width + x) * 4;
        const rotatedX = height - 1 - y;
        const rotatedY = x;
        const dstIndex = (rotatedY * width + rotatedX) * 4;

        const alpha = rgba[srcIndex + 3];

        data[dstIndex] = 255;
        data[dstIndex + 1] = 255;
        data[dstIndex + 2] = 255;
        data[dstIndex + 3] = alpha;
      }
    }

    const tex = new THREE.Data3DTexture(data, width, height, depth);
    tex.format = THREE.RGBAFormat;
    tex.type = THREE.UnsignedByteType;
    tex.needsUpdate = true;

    return tex;
  }, [texture]);
}
