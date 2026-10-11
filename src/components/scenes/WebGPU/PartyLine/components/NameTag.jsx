import React, { memo, useEffect, useMemo } from 'react';

import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';

import { drawAvatar } from '../utils/avatar';

const PIXEL_RATIO = 2;
const FONT_SIZE = 15;
const PAD_X = 9;
const HEIGHT = 24;
const BORDER = 2;
const AVATAR = 40;

function readableText(hex) {
  const channel = (at) => parseInt(hex.slice(at, at + 2), 16) / 255;
  const luminance =
    0.299 * channel(1) + 0.587 * channel(3) + 0.114 * channel(5);
  return luminance > 0.6 ? '#1d1d28' : '#ffffff';
}

function drawTag(name, color, avatar) {
  const font = `800 ${FONT_SIZE * PIXEL_RATIO}px ui-rounded, system-ui, sans-serif`;
  const canvas = document.createElement('canvas');
  const measure = canvas.getContext('2d');
  measure.font = font;
  const textWidth = Math.ceil(measure.measureText(name).width / PIXEL_RATIO);
  const pillX = AVATAR * 0.6;
  const width = Math.ceil(AVATAR + textWidth + PAD_X * 1.5);
  canvas.width = width * PIXEL_RATIO;
  canvas.height = AVATAR * PIXEL_RATIO;

  const ctx = canvas.getContext('2d');
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
  const pillY = (AVATAR - HEIGHT) / 2;
  ctx.beginPath();
  ctx.roundRect(
    pillX,
    pillY + BORDER / 2,
    width - pillX - BORDER / 2,
    HEIGHT - BORDER,
    HEIGHT / 2
  );
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = BORDER;
  ctx.strokeStyle = '#1d1d28';
  ctx.stroke();
  ctx.font = `800 ${FONT_SIZE}px ui-rounded, system-ui, sans-serif`;
  ctx.fillStyle = readableText(color);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, AVATAR + PAD_X / 2 + textWidth / 2, AVATAR / 2 + 1);
  drawAvatar(ctx, { color, seed: avatar, size: AVATAR });

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  return { height: AVATAR, texture, width };
}

function NameTag({ avatar, color, name }) {
  const tag = useMemo(
    () => drawTag(name, color, avatar),
    [avatar, color, name]
  );

  useEffect(() => () => tag.texture.dispose(), [tag]);

  return (
    <mesh renderOrder={2}>
      <planeGeometry args={[tag.width, tag.height]} />
      <meshBasicMaterial
        depthWrite={false}
        map={tag.texture}
        toneMapped={false}
        transparent
      />
    </mesh>
  );
}

export default memo(NameTag);
