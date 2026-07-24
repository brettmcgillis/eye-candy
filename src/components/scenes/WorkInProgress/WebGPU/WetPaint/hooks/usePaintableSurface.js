import * as THREE from 'three';

import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { drawBrushSegment, drawMetallicFlecks } from '../utils/brushes';
import { colorToRgba } from '../utils/sceneUtils';

const MAX_DRIPS = 40;
// Every stamp also draws into a second, black-initialized canvas used as the
// surface's metalnessMap: white where metallic paint landed, black where
// regular paint landed (so matte strokes knock metallic back down). The
// brush shapes match exactly because the same segment renderer draws both.
const METAL_WHITE = new THREE.Color('#ffffff');
const METAL_BLACK = new THREE.Color('#000000');

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
  const metalCtxRef = useRef(null);
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

  const metalTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    metalCtxRef.current = ctx;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.NoColorSpace;
    return tex;
  }, [canvasSize.w, canvasSize.h]);

  useEffect(
    () => () => {
      texture.dispose();
      metalTexture.dispose();
    },
    [texture, metalTexture]
  );

  // `fromU/fromV` (nullable) are the previous frame's hit on THIS surface —
  // PaintRig threads them through so brushes draw a connected segment
  // instead of one disc per frame, which is what keeps fast strokes fluid
  // (chameleon port, todo item 71).
  const stamp = useMemo(
    () =>
      ({
        u,
        v,
        fromU = null,
        fromV = null,
        color,
        size,
        hardness,
        opacity = 1,
        brushTexture,
        finish = 'matte',
        dripChance = 0.1,
        dripLengthScale = 3,
      }) => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;

        const x = u * canvas.width;
        const y = (1 - v) * canvas.height;
        const radiusPx = size * canvas.width;
        const fromX = fromU == null ? x : fromU * canvas.width;
        const fromY = fromV == null ? y : (1 - fromV) * canvas.height;
        const segment = { fromX, fromY, toX: x, toY: y, radiusPx };
        const metallic = finish === 'metallic';

        drawBrushSegment(ctx, {
          ...segment,
          color,
          hardness,
          opacity,
          brushTexture,
        });
        if (metallic) drawMetallicFlecks(ctx, { ...segment, color, opacity });

        const metalCtx = metalCtxRef.current;
        if (metalCtx) {
          drawBrushSegment(metalCtx, {
            ...segment,
            color: metallic ? METAL_WHITE : METAL_BLACK,
            hardness,
            opacity,
            brushTexture,
          });
          metalTexture.needsUpdate = true;
        }

        if (dripEnabled && Math.random() < dripChance) {
          if (dripsRef.current.length >= MAX_DRIPS) dripsRef.current.shift();
          dripsRef.current.push({
            x,
            y,
            len: 0,
            maxLen: radiusPx * dripLengthScale * (0.7 + Math.random() * 0.9),
            lineWidth: radiusPx * (0.12 + Math.random() * 0.18),
            color,
            opacity,
            metallic,
            speed: (40 + Math.random() * 60) * (canvas.width / resolution),
          });
        }

        texture.needsUpdate = true;
      },
    [dripEnabled, resolution, texture, metalTexture]
  );

  const clear = useMemo(
    () => () => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const metalCtx = metalCtxRef.current;
      if (metalCtx) {
        metalCtx.fillStyle = '#000000';
        metalCtx.fillRect(0, 0, canvas.width, canvas.height);
        metalTexture.needsUpdate = true;
      }
      dripsRef.current = [];
      texture.needsUpdate = true;
    },
    [texture, metalTexture]
  );

  useFrame((_state, delta) => {
    const drips = dripsRef.current;
    if (!drips.length) return;

    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const metalCtx = metalCtxRef.current;

    for (let i = drips.length - 1; i >= 0; i -= 1) {
      const drip = drips[i];
      const prevLen = drip.len;
      drip.len = Math.min(drip.maxLen, drip.len + drip.speed * delta);

      ctx.strokeStyle = colorToRgba(drip.color, 0.85 * drip.opacity);
      ctx.lineWidth = drip.lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(drip.x, drip.y + prevLen);
      ctx.lineTo(drip.x, drip.y + drip.len);
      ctx.stroke();

      if (metalCtx) {
        metalCtx.strokeStyle = drip.metallic
          ? `rgba(255,255,255,${0.85 * drip.opacity})`
          : `rgba(0,0,0,${0.85 * drip.opacity})`;
        metalCtx.lineWidth = drip.lineWidth;
        metalCtx.lineCap = 'round';
        metalCtx.beginPath();
        metalCtx.moveTo(drip.x, drip.y + prevLen);
        metalCtx.lineTo(drip.x, drip.y + drip.len);
        metalCtx.stroke();
      }

      if (drip.len >= drip.maxLen || drip.y + drip.len > canvas.height) {
        drips.splice(i, 1);
      }
    }

    texture.needsUpdate = true;
    if (metalCtx) metalTexture.needsUpdate = true;
  });

  return { texture, metalTexture, stamp, clear };
}
