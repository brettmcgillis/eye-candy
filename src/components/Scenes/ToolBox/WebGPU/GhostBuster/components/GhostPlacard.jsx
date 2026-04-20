import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// Canvas resolution — 3:1 for three columns
const CW = 768;
const CH = 256;

// ── Drawing helpers ──────────────────────────────────────────────────────────

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
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

/**
 * Draw syntax-highlighted JSON representation with proper color coding
 * Returns the y position after drawing
 */
function drawJsonLine(ctx, line, x, y, charWidth = 6.8) {
  const colorMap = {
    key: '#ffb86c', // orange
    string: '#a1efa3', // green
    number: '#bd93f9', // purple
    boolean: '#ff79c6', // pink
    null: '#888888', // gray
    symbol: '#f8f8f2', // light gray (brackets, colons, commas)
  };
  const colorValuePattern = /^"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})"$/;

  let i = 0;
  let currentX = x;
  let currentKey = null;

  while (i < line.length) {
    if (line[i] === ' ') {
      currentX += charWidth;
      i += 1;
    } else if (line[i] === '"') {
      // Find closing quote (string key or value)
      let end = i + 1;
      while (end < line.length && line[end] !== '"') {
        if (line[end] === '\\') end += 1;
        end += 1;
      }
      const str = line.slice(i, end + 1);
      // Check if it's a key (followed by :)
      const isKey = line[end + 1] === ':';
      ctx.fillStyle = isKey ? colorMap.key : colorMap.string;
      ctx.fillText(str, currentX, y);

      if (isKey) {
        currentKey = str.slice(1, -1);
      } else if (
        currentKey &&
        /(color|emissive)/i.test(currentKey) &&
        colorValuePattern.test(str)
      ) {
        const chipSize = 8;
        const chipX = currentX + str.length * charWidth + 6;
        const chipY = y + 2;

        roundRectPath(ctx, chipX, chipY, chipSize, chipSize, 2);
        ctx.fillStyle = str.slice(1, -1);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      currentX += str.length * charWidth;
      i = end + 1;
    } else if (/[0-9.-]/.test(line[i])) {
      // Number
      let end = i;
      while (end < line.length && /[0-9.eE+-]/.test(line[end])) end += 1;
      const num = line.slice(i, end);
      ctx.fillStyle = colorMap.number;
      ctx.fillText(num, currentX, y);
      currentX += num.length * charWidth;
      i = end;
    } else if (
      line.slice(i, i + 4) === 'true' ||
      line.slice(i, i + 5) === 'false'
    ) {
      const bool = line.slice(i, i + (line[i + 4] === 'e' ? 5 : 4));
      ctx.fillStyle = colorMap.boolean;
      ctx.fillText(bool, currentX, y);
      currentX += bool.length * charWidth;
      i += bool.length;
    } else if (line.slice(i, i + 4) === 'null') {
      ctx.fillStyle = colorMap.null;
      ctx.fillText('null', currentX, y);
      currentX += 4 * charWidth;
      i += 4;
    } else {
      // Symbols: : , { } [ ]
      ctx.fillStyle = colorMap.symbol;
      ctx.fillText(line[i], currentX, y);
      currentX += charWidth;
      i += 1;
    }
  }

  return y + 13;
}

function drawCompass(ctx, cx, cy, r, windDirX, windDirZ, windStrength) {
  // Ring
  ctx.strokeStyle = 'rgb(255, 255, 255)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Cardinal tick marks
  ctx.strokeStyle = 'rgb(200, 200, 200)';
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

    ctx.strokeStyle = 'rgb(200, 200, 200)';
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
    ctx.strokeStyle = 'rgb(200, 200, 200)';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlacard(ctx, allProps) {
  ctx.clearRect(0, 0, CW, CH);

  // ── Background + border
  roundRectPath(ctx, 2, 2, CW - 4, CH - 4, 14);
  ctx.fillStyle = '#0d0d1c';
  ctx.fill();
  ctx.strokeStyle = 'rgba(130, 150, 255, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Subtle top highlight strip (gives a "screen" look)
  ctx.save();
  roundRectPath(ctx, 2, 2, CW - 4, CH - 4, 14);
  ctx.clip();
  ctx.fillStyle = 'rgba(140, 160, 255, 0.12)';
  ctx.fillRect(16, 3, CW - 32, 3);
  ctx.restore();

  // ── "Gh0st" heading
  ctx.font = "bold 28px 'SF Mono', Menlo, Monaco, monospace";
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Gh0st://${allProps.variantName ?? 'unknown'}`, 22, 12);

  // ── Compass (right side, vertically centred in header)
  drawCompass(
    ctx,
    CW - 46,
    34,
    20,
    allProps.windDirX ?? 0,
    allProps.windDirZ ?? 0,
    allProps.windStrength ?? 0
  );

  // ── Separator
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(22, 54);
  ctx.lineTo(CW - 22, 54);
  ctx.stroke();

  // ── Left column: variant, segments, animation, wind, cloth physics
  const leftData = {
    segments: allProps.clothSegments ?? 0,
    animation: allProps.activeAnim ?? 'idle',
    wind: {
      dir: `${windArrowChar(allProps.windDirX ?? 0, allProps.windDirZ ?? 0)}`,
      strength: parseFloat(((allProps.windStrength ?? 0) * 100).toFixed(1)),
    },
    cloth: {
      stiffness: parseFloat((allProps.stiffness ?? 1).toFixed(3)),
      dampening: parseFloat((allProps.dampening ?? 0).toFixed(3)),
      holes: parseFloat((allProps.holeAmount ?? 0).toFixed(3)),
      tatter: parseFloat((allProps.tatterEdge ?? 0).toFixed(3)),
    },
  };

  // ── Center column: inner material
  const innerData = {
    innerMaterial: {
      color: allProps.innerColor ?? '#ffffff',
      emissive: allProps.innerEmissive ?? '#000000',
      intensity: parseFloat((allProps.innerIntensity ?? 1).toFixed(2)),
      falloff: parseFloat((allProps.innerFalloff ?? 1).toFixed(2)),
      roughness: parseFloat((allProps.roughness ?? 0).toFixed(2)),
      metalness: parseFloat((allProps.metalness ?? 0).toFixed(2)),
    },
  };

  // ── Right column: outer material
  const outerData = {
    outerMaterial: {
      color: allProps.outerColor ?? '#ffffff',
      emissive: allProps.outerEmissive ?? '#000000',
      intensity: parseFloat((allProps.outerIntensity ?? 1).toFixed(2)),
      falloff: parseFloat((allProps.outerFalloff ?? 1).toFixed(2)),
      roughness: parseFloat((allProps.roughness ?? 0).toFixed(2)),
      metalness: parseFloat((allProps.metalness ?? 0).toFixed(2)),
    },
  };

  const leftLines = JSON.stringify(leftData, null, 2).split('\n');
  const innerLines = JSON.stringify(innerData, null, 2).split('\n');
  const outerLines = JSON.stringify(outerData, null, 2).split('\n');

  // ── Draw three columns with syntax highlighting
  ctx.font = "11px 'Courier New', Courier, monospace";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const col1X = 16;
  const col2X = 272;
  const col3X = 528;
  const startY = 56;
  const lineHeight = 13;

  leftLines.forEach((line, i) => {
    drawJsonLine(ctx, line, col1X, startY + i * lineHeight, 6.6);
  });

  innerLines.forEach((line, i) => {
    drawJsonLine(ctx, line, col2X, startY + i * lineHeight, 6.6);
  });

  outerLines.forEach((line, i) => {
    drawJsonLine(ctx, line, col3X, startY + i * lineHeight, 6.6);
  });
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * A lectern-style debug placard that sits on the floor between the camera
 * and the ghost. Rendered with meshBasicMaterial so it is always readable
 * regardless of scene lighting.
 *
 * Props:
 *   variantName           — current preset name string
 *   clothSegments         — current cloth segment count (number)
 *   animationInputRef     — ref to animation input { windDirX, windDirZ, windStrength }
 *   ghostRef              — ref to GhostCharacter imperative handle for live animation state
 *   stiffness, dampening  — cloth physics props
 *   innerColor, outerColor — hex color strings
 *   innerEmissive, outerEmissive — hex color strings
 *   innerIntensity, outerIntensity — emissive brightness 0–2
 *   innerFalloff, outerFalloff — emissive falloff 0–1
 *   roughness, metalness  — shared PBR material props
 */
export default function GhostPlacard({
  variantName,
  clothSegments,
  animationInputRef,
  ghostRef,
  stiffness,
  dampening,
  holeAmount,
  tatterEdge,
  innerColor,
  innerEmissive,
  innerIntensity,
  innerFalloff,
  outerColor,
  outerEmissive,
  outerIntensity,
  outerFalloff,
  roughness,
  metalness,
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

  useFrame((state) => {
    // Set anisotropy once after renderer is available — helps text at oblique angles.
    // WebGPU renderers don't expose capabilities.getMaxAnisotropy, so guard it.
    if (!anisotropySet.current) {
      const maxAniso = state.gl.capabilities?.getMaxAnisotropy?.();
      if (maxAniso) texture.anisotropy = maxAniso;
      anisotropySet.current = true;
    }

    // Read live animation data from ref
    const input = animationInputRef?.current ?? {};
    const activeAnim = ghostRef?.current?.activeAnimation ?? 'idle';

    drawPlacard(ctx, {
      variantName,
      clothSegments,
      windDirX: input.windDirX ?? 0,
      windDirZ: input.windDirZ ?? 0,
      windStrength: input.windStrength ?? 0,
      activeAnim,
      stiffness,
      dampening,
      holeAmount,
      tatterEdge,
      innerColor,
      innerEmissive,
      innerIntensity,
      innerFalloff,
      outerColor,
      outerEmissive,
      outerIntensity,
      outerFalloff,
      roughness,
      metalness,
    });

    texture.needsUpdate = true;
  });

  // Lectern geometry:
  //   rotation.x = -π/4  →  45° tilt from vertical, face angled up toward camera
  //   The bottom edge rests just above the floor (y ≈ -0.9);
  //   the top edge leans toward the ghost at roughly y ≈ -0.54.
  return (
    <group position={[0, -0.7, 0.9]} rotation={[-Math.PI / 3, 0, 0]}>
      <mesh>
        <planeGeometry args={[2.25, 0.75]} />
        <meshBasicMaterial map={texture} side={THREE.FrontSide} transparent />
      </mesh>
      <mesh>
        <planeGeometry args={[2.25, 0.75]} />
        <meshBasicMaterial color="#000000" side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
