import * as THREE from 'three';

import { useMemo } from 'react';

const CW = 256;
const CH = 56;

export default function Label3D({ text, color = '#111111', ...props }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext('2d');
    ctx.font = "bold 28px 'SF Mono', Menlo, Monaco, monospace";
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, CW / 2, CH / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }, [text, color]);

  // Plane sized to match canvas aspect ratio at ~0.5 world-unit height
  return (
    <mesh {...props}>
      <planeGeometry args={[(CW / CH) * 0.5, 0.5]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}
