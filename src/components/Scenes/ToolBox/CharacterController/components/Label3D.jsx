import * as THREE from 'three';

import React, { useMemo } from 'react';

const FONT = "bold 28px 'SF Mono', Menlo, Monaco, monospace";
const LINE_HEIGHT = 44;
const PAD = 32;
const MAX_LINE_PIXELS = 640;

function wrapText(ctx, input, maxWidthPx) {
  const words = String(input).split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidthPx) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }

  lines.push(current);
  return lines;
}

export default function Label3D({
  text,
  color = '#111111',
  maxWidth = 10,
  ...props
}) {
  const { texture, aspect } = useMemo(() => {
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = FONT;
    const lines = wrapText(measure, text, MAX_LINE_PIXELS);
    const widestLinePx = lines.reduce(
      (max, line) => Math.max(max, measure.measureText(line).width),
      0
    );
    const CW = Math.max(
      64,
      Math.ceil(Math.min(MAX_LINE_PIXELS, widestLinePx) + PAD)
    );
    const CH = Math.max(56, lines.length * LINE_HEIGHT + PAD);

    const canvas = document.createElement('canvas');
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext('2d');
    ctx.font = FONT;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const totalTextHeight = lines.length * LINE_HEIGHT;
    const startY = (CH - totalTextHeight) / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line, CW / 2, startY + index * LINE_HEIGHT);
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;

    return { texture: tex, aspect: CW / CH };
  }, [text, color]);

  const worldWidth = maxWidth * 0.25;
  const worldHeight = worldWidth / aspect;

  return (
    <mesh {...props} userData={{ camExcludeCollision: true }}>
      <planeGeometry args={[worldWidth, worldHeight]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}
