import * as THREE from 'three';

import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { colorToRgba } from '../utils/sceneUtils';

const MAX_DRIPS = 40;

function drawSoftCircle(ctx, x, y, radius, color, hardness) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  // Full 0..~0.92 range (was floored at 0.15): hardness 0 is now a genuinely
  // soft airbrush edge for clean-outline underpainting (todo item 57).
  const hardStop = Math.min(0.98, 0.02 + hardness * 0.9);
  gradient.addColorStop(0, colorToRgba(color, 1));
  gradient.addColorStop(hardStop, colorToRgba(color, 1));
  gradient.addColorStop(1, colorToRgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawStamp(ctx, x, y, radiusPx, color, hardness, brushTexture) {
  if (brushTexture !== 'splatter') {
    drawSoftCircle(ctx, x, y, radiusPx, color, hardness);
    return;
  }

  const dropletCount = 6 + Math.floor(Math.random() * 6);
  for (let i = 0; i < dropletCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radiusPx * 1.4;
    const dropletRadius = radiusPx * (0.08 + Math.random() * 0.22);
    drawSoftCircle(
      ctx,
      x + Math.cos(angle) * dist,
      y + Math.sin(angle) * dist,
      dropletRadius,
      color,
      hardness
    );
  }
}

// Renders a paintable UV texture on a plain <canvas>, driven by raycast UV
// hits fed in by PaintRig. Chosen over porting monkeypaint's WebGL
// render-target/dilation pipeline because plain 2D canvas stamping at the
// hit's real uv works on any mesh with UVs — see the WetPaint project memory
// for the caveats (no stamping across UV seams) and the fallback.
// Drip behavior is tunable per stamp (dripChance/dripLengthScale from the
// brush) so outlines can be kept clean (todo item 50); `dripEnabled` off
// kills drips entirely for horizontal surfaces (asphalt/curb, todo item 29).
export default function usePaintableSurface({
  dripEnabled = true,
  width,
  height,
  resolution = 1024,
}) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const dripsRef = useRef([]);

  const canvasSize = useMemo(() => {
    const aspect = height / width;
    return {
      w: resolution,
      h: Math.max(1, Math.round(resolution * aspect)),
    };
  }, [resolution, width, height]);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    canvasRef.current = canvas;
    ctxRef.current = canvas.getContext('2d');

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [canvasSize.w, canvasSize.h]);

  useEffect(() => () => texture.dispose(), [texture]);

  const stamp = useMemo(
    () =>
      ({
        u,
        v,
        color,
        size,
        hardness,
        brushTexture,
        dripChance = 0.1,
        dripLengthScale = 3,
      }) => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;

        const x = u * canvas.width;
        const y = (1 - v) * canvas.height;
        const radiusPx = size * canvas.width;

        drawStamp(ctx, x, y, radiusPx, color, hardness, brushTexture);

        if (dripEnabled && Math.random() < dripChance) {
          if (dripsRef.current.length >= MAX_DRIPS) dripsRef.current.shift();
          dripsRef.current.push({
            x,
            y,
            len: 0,
            maxLen: radiusPx * dripLengthScale * (0.7 + Math.random() * 0.9),
            lineWidth: radiusPx * (0.12 + Math.random() * 0.18),
            color,
            speed: (40 + Math.random() * 60) * (canvas.width / resolution),
          });
        }

        texture.needsUpdate = true;
      },
    [dripEnabled, resolution, texture]
  );

  const clear = useMemo(
    () => () => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dripsRef.current = [];
      texture.needsUpdate = true;
    },
    [texture]
  );

  useFrame((_state, delta) => {
    const drips = dripsRef.current;
    if (!drips.length) return;

    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    for (let i = drips.length - 1; i >= 0; i -= 1) {
      const drip = drips[i];
      const prevLen = drip.len;
      drip.len = Math.min(drip.maxLen, drip.len + drip.speed * delta);

      ctx.strokeStyle = colorToRgba(drip.color, 0.85);
      ctx.lineWidth = drip.lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(drip.x, drip.y + prevLen);
      ctx.lineTo(drip.x, drip.y + drip.len);
      ctx.stroke();

      if (drip.len >= drip.maxLen || drip.y + drip.len > canvas.height) {
        drips.splice(i, 1);
      }
    }

    texture.needsUpdate = true;
  });

  return { texture, stamp, clear };
}
