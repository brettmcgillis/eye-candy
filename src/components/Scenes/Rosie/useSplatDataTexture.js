/* eslint-disable no-plusplus */
import * as THREE from 'three';

import { useMemo } from 'react';

import { useLoader } from '@react-three/fiber';

function imgToRgba(img, rotation = 0) {
  const w = img.width;
  const h = img.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rotation);
  ctx.drawImage(img, -w / 2, -h / 2);
  ctx.restore();

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

    const { rgba, width, height } = imgToRgba(
      texture.image,
      Math.PI / 2 // rotate 90°
    );

    const depth = 1;
    const data = new Uint8Array(4 * width * height * depth);

    for (let i = 0; i < width * height; i++) {
      const src = i * 4;
      const dst = i * 4;

      const alpha = rgba[src + 3];

      // Alpha-only mask:
      data[dst] = 255; // R
      data[dst + 1] = 255; // G
      data[dst + 2] = 255; // B
      data[dst + 3] = alpha; // A
    }

    const tex = new THREE.Data3DTexture(data, width, height, depth);
    tex.format = THREE.RGBAFormat;
    tex.type = THREE.UnsignedByteType;
    tex.needsUpdate = true;

    return tex;
  }, [texture]);
}
