import * as THREE from 'three';

import { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// Canvas resolution — 2:1 matches the world plane aspect ratio
const CW = 512;
const CH = 256;

// ── Drawing helpers ──────────────────────────────────────────────────────────

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Maps a normalised wind vector (windDirX, windDirZ) to an 8-direction
 * Unicode arrow. Convention: N (↑) = away from camera (−Z).
 */
function windArrowChar(dx, dz) {
  const angle = Math.atan2(dx, -dz) * (180 / Math.PI);
  const idx = Math.round(((angle + 360) % 360) / 45) % 8;
  return ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'][idx];
}

function drawCompass(ctx, cx, cy, r, windDirX, windDirZ, windStrength) {
  // Ring
  ctx.strokeStyle = 'rgba(100, 140, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Cardinal tick marks
  ctx.strokeStyle = 'rgba(100, 140, 255, 0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4));
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }

  if (windStrength > 0.01) {
    // Arrow length proportional to strength, capped at ring radius
    const len = r * 0.72 * Math.min(windStrength, 1);
    // +X → right, +Z → down (toward camera = south on a top-down compass)
    const ax = windDirX * len;
    const ay = windDirZ * len;
    const tipX = cx + ax;
    const tipY = cy + ay;
    const angle = Math.atan2(ay, ax);
    const headLen = 7;

    ctx.strokeStyle = '#7799ee';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Shaft
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - headLen * Math.cos(angle - Math.PI / 6),
      tipY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - headLen * Math.cos(angle + Math.PI / 6),
      tipY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
    ctx.lineCap = 'butt';
  } else {
    // Calm — small filled dot
    ctx.fillStyle = 'rgba(80, 105, 200, 0.45)';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlacard(
  ctx,
  { variantName, clothSegments, windDirX, windDirZ, windStrength, activeAnim }
) {
  ctx.clearRect(0, 0, CW, CH);

  // ── Background + border
  roundRectPath(ctx, 2, 2, CW - 4, CH - 4, 14);
  ctx.fillStyle = '#0d0d1c';
  ctx.fill();
  ctx.strokeStyle = 'rgba(130, 150, 255, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Subtle top highlight strip (gives a "screen" look)
  roundRectPath(ctx, 2, 2, CW - 4, 5, 14);
  ctx.fillStyle = 'rgba(140, 160, 255, 0.15)';
  ctx.fill();

  // ── "Gh0st" heading — SF Mono / Menlo render the zero with a slashed crossbar
  ctx.font = "bold 28px 'SF Mono', Menlo, Monaco, monospace";
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Gh0st', 22, 20);

  // ── SKIN row (preset name)
  ctx.font = "11px 'Courier New', Courier, monospace";
  ctx.fillStyle = '#b0b0b0';
  ctx.fillText('SKIN', 22, 54);
  ctx.font = "bold 18px 'Courier New', Courier, monospace";
  ctx.fillStyle = '#ffffff';
  ctx.fillText(variantName ?? 'Unknown', 22, 67);

  // ── Compass (right side, vertically centred in the header block)
  drawCompass(ctx, CW - 46, 48, 26, windDirX, windDirZ, windStrength);

  // ── Separator
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(22, 96);
  ctx.lineTo(CW - 22, 96);
  ctx.stroke();

  // ── Stats grid — 2 columns × 2 rows
  // Cloth is 1.0 × 1.0 world units; assuming 1 unit = 1 m → 3.28 ft
  const clothFt = (1.0 * 3.28084).toFixed(1);

  const windValue =
    windStrength > 0.01
      ? `${windArrowChar(windDirX, windDirZ)}  ${(windStrength * 100).toFixed(0)}%`
      : 'calm';

  // [left, right] pairs per row
  const grid = [
    [
      ['SEGMENTS', `${clothSegments} × ${clothSegments}`],
      ['ANIM', activeAnim ?? 'idle'],
    ],
    [
      ['SIZE', `${clothFt} × ${clothFt} ft`],
      ['WIND', windValue],
    ],
  ];

  const colX = [22, 274]; // left / right column x offsets
  const rowH = 58;
  const startY = 116;

  // Subtle vertical divider at canvas midpoint
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(254, 100);
  ctx.lineTo(254, startY + grid.length * rowH - 4);
  ctx.stroke();

  grid.forEach((row, rowIdx) => {
    row.forEach(([label, value], colIdx) => {
      const x = colX[colIdx];
      const baseY = startY + rowIdx * rowH;
      ctx.font = "12px 'Courier New', Courier, monospace";
      ctx.fillStyle = '#b0b0b0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(label, x, baseY);
      ctx.font = "bold 20px 'Courier New', Courier, monospace";
      ctx.fillStyle = '#ffffff';
      ctx.fillText(value, x, baseY + 16);
    });
  });
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * A lectern-style debug placard that sits on the floor between the camera
 * and the ghost. Rendered with meshBasicMaterial so it is always readable
 * regardless of scene lighting.
 *
 * Props:
 *   variantName       — current preset name string
 *   clothSegments     — current cloth segment count (number)
 *   animationInputRef — ref to the animation input object { windDirX, windDirZ, windStrength }
 *   ghostRef          — ref to the GhostCharacter imperative handle
 */
export default function GhostPlacard({
  variantName,
  clothSegments,
  animationInputRef,
  ghostRef,
}) {
  const anisotropySet = useRef(false);

  const { ctx, texture } = useMemo(() => {
    const cvs = document.createElement('canvas');
    cvs.width = CW;
    cvs.height = CH;
    const context = cvs.getContext('2d');
    const tex = new THREE.CanvasTexture(cvs);
    tex.colorSpace = THREE.SRGBColorSpace;
    // No mipmaps — LinearFilter avoids WebGL warnings and is fine for this use
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return { ctx: context, texture: tex };
  }, []);

  // Keep latest props accessible inside useFrame without stale closure issues
  const propsRef = useRef({ variantName, clothSegments });
  propsRef.current.variantName = variantName;
  propsRef.current.clothSegments = clothSegments;

  useFrame((state) => {
    // Set anisotropy once after renderer is available — helps text at oblique angles.
    // WebGPU renderers don't expose capabilities.getMaxAnisotropy, so guard it.
    if (!anisotropySet.current) {
      const maxAniso = state.gl.capabilities?.getMaxAnisotropy?.();
      if (maxAniso) texture.anisotropy = maxAniso;
      anisotropySet.current = true;
    }

    const input = animationInputRef?.current ?? {};
    const activeAnim = ghostRef?.current?.activeAnimation ?? null;

    drawPlacard(ctx, {
      variantName: propsRef.current.variantName,
      clothSegments: propsRef.current.clothSegments,
      windDirX: input.windDirX ?? 0,
      windDirZ: input.windDirZ ?? 0,
      windStrength: input.windStrength ?? 0,
      activeAnim,
    });

    texture.needsUpdate = true;
  });

  // Lectern geometry:
  //   rotation.x = -π/4  →  45° tilt from vertical, face angled up toward camera
  //   The bottom edge rests just above the floor (y ≈ -0.9);
  //   the top edge leans toward the ghost at roughly y ≈ -0.54.
  return (
    <mesh position={[0, -0.71, 0.9]} rotation={[-Math.PI / 4, 0, 0]}>
      <planeGeometry args={[1.0, 0.5]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}
