import * as THREE from 'three';

import React, { useMemo } from 'react';

const FONT = "bold 28px 'SF Mono', Menlo, Monaco, monospace";
const CH = 56;
const PAD = 32;

export default function Label3D({ text, color = '#111111', ...props }) {
  const { texture, aspect } = useMemo(() => {
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = FONT;
    const CW = Math.max(Math.ceil(measure.measureText(text).width) + PAD, 64);

    const canvas = document.createElement('canvas');
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext('2d');
    ctx.font = FONT;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, CW / 2, CH / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;

    return { texture: tex, aspect: CW / CH };
  }, [text, color]);

  return (
    <mesh {...props}>
      <planeGeometry args={[aspect * 0.5, 0.5]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}
