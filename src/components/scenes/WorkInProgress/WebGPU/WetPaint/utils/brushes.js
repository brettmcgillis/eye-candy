import { colorToRgba } from './sceneUtils';

// Brush library ported from chameleon.js (dev/examples/chameleon.js, todo
// item 71), reshaped for this scene's pipeline: chameleon brushes are
// stateful stroke objects (startStroke/continueStoke on one canvas), but
// WetPaint strokes can hop between paint surfaces mid-drag (wall -> curb),
// so every brush here is a STATELESS segment renderer instead — PaintRig
// remembers the previous frame's hit and each call draws from->to in canvas
// px space. A zero-length segment (from == to, e.g. holding the button
// still) is valid and keeps depositing paint, which is exactly how a real
// rattle can behaves.

function distance(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Walks the segment at `spacing` px intervals (always at least the endpoint)
// so stamp-based brushes stay gap-free at any mouse speed — this is the
// "fluid stroke" half of the chameleon port.
function forEachStep(fromX, fromY, toX, toY, spacing, fn) {
  const dist = distance(fromX, fromY, toX, toY);
  const steps = Math.max(1, Math.ceil(dist / Math.max(spacing, 0.5)));
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    fn(fromX + (toX - fromX) * t, fromY + (toY - fromY) * t);
  }
}

function softCircle(ctx, x, y, radius, color, hardness, opacity = 1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  // Full 0..~0.92 range (was floored at 0.15): hardness 0 is a genuinely
  // soft airbrush edge for clean-outline underpainting (todo item 57).
  const hardStop = Math.min(0.98, 0.02 + hardness * 0.9);
  gradient.addColorStop(0, colorToRgba(color, opacity));
  gradient.addColorStop(hardStop, colorToRgba(color, opacity));
  gradient.addColorStop(1, colorToRgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

// Soft airbrush disc dragged along the segment (the scene's original
// "clean" stamp, now gap-free).
function drawSoft(
  ctx,
  { fromX, fromY, toX, toY, radiusPx, color, hardness, opacity }
) {
  forEachStep(fromX, fromY, toX, toY, radiusPx * 0.35, (x, y) =>
    softCircle(ctx, x, y, radiusPx, color, hardness, opacity)
  );
}

// Loose droplet scatter (the scene's original "splatter" stamp).
function drawSplatter(
  ctx,
  { fromX, fromY, toX, toY, radiusPx, color, hardness, opacity }
) {
  forEachStep(fromX, fromY, toX, toY, radiusPx * 0.5, (x, y) => {
    const dropletCount = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < dropletCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radiusPx * 1.4;
      const dropletRadius = radiusPx * (0.08 + Math.random() * 0.22);
      softCircle(
        ctx,
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist,
        dropletRadius,
        color,
        hardness,
        opacity
      );
    }
  });
}

// chameleon SprayBrush: dense random speckle inside the radius. The most
// rattle-can-realistic brush — paint builds up while hovering, edges stay
// grainy. Hardness biases dots toward the center (tight cone vs wide mist).
function drawSpray(
  ctx,
  { fromX, fromY, toX, toY, radiusPx, color, hardness, opacity = 1 }
) {
  ctx.save();
  ctx.fillStyle = colorToRgba(color, 1);
  const density = Math.min(220, Math.max(30, Math.round(radiusPx * 3)));
  const centerBias = 1 + hardness * 2;
  forEachStep(fromX, fromY, toX, toY, radiusPx * 0.3, (x, y) => {
    for (let i = 0; i < density; i += 1) {
      const dotRadius = radiusPx * Math.random() ** centerBias;
      const angle = Math.random() * Math.PI * 2;
      const dotWidth = 1 + Math.random() * Math.max(1, radiusPx * 0.04);
      ctx.globalAlpha = (0.15 + Math.random() * 0.5) * opacity;
      ctx.fillRect(
        x + dotRadius * Math.cos(angle),
        y + dotRadius * Math.sin(angle),
        dotWidth,
        dotWidth
      );
    }
  });
  ctx.restore();
}

function strokeSegment(ctx, fromX, fromY, toX, toY, radiusPx) {
  if (distance(fromX, fromY, toX, toY) < 0.5) {
    // Zero-length stroke: a lineTo would draw nothing, so dot it instead.
    ctx.beginPath();
    ctx.arc(toX, toY, radiusPx, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.lineWidth = radiusPx * 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

// chameleon MarkerBrush: solid round-capped line — the "fat cap marker"
// look, ideal for crisp outlines.
function drawMarker(ctx, { fromX, fromY, toX, toY, radiusPx, color, opacity }) {
  ctx.save();
  ctx.strokeStyle = colorToRgba(color, opacity);
  ctx.fillStyle = colorToRgba(color, opacity);
  strokeSegment(ctx, fromX, fromY, toX, toY, radiusPx);
  ctx.restore();
}

// chameleon BlurryMarkerBrush: marker with a shadow-blur halo — soft wet
// edges without the airbrush gradient.
function drawBlurry(ctx, { fromX, fromY, toX, toY, radiusPx, color, opacity }) {
  ctx.save();
  ctx.strokeStyle = colorToRgba(color, opacity);
  ctx.fillStyle = colorToRgba(color, opacity);
  ctx.shadowBlur = radiusPx;
  ctx.shadowColor = colorToRgba(color, opacity);
  strokeSegment(ctx, fromX, fromY, toX, toY, radiusPx * 0.5);
  ctx.restore();
}

// chameleon ThickBrush: a fan of thin diagonal-offset lines — reads like a
// wide flat nib / dry roller.
function drawThick(ctx, { fromX, fromY, toX, toY, radiusPx, color, opacity }) {
  ctx.save();
  ctx.strokeStyle = colorToRgba(color, 0.85 * opacity);
  ctx.lineWidth = Math.max(1, radiusPx / 10);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const step = Math.max(1, radiusPx / 20);
  for (let i = -radiusPx * 0.9; i <= radiusPx * 0.9; i += step) {
    ctx.beginPath();
    ctx.moveTo(fromX + i, fromY + i);
    ctx.lineTo(toX + i, toY + i);
    ctx.stroke();
  }
  ctx.restore();
}

// chameleon Pencil: a thin hard line regardless of brush size — the
// "skinny cap" for fine detail work.
function drawPencil(ctx, { fromX, fromY, toX, toY, radiusPx, color, opacity }) {
  ctx.save();
  ctx.strokeStyle = colorToRgba(color, opacity);
  ctx.fillStyle = colorToRgba(color, opacity);
  strokeSegment(ctx, fromX, fromY, toX, toY, Math.max(1, radiusPx * 0.15));
  ctx.restore();
}

// chameleon CalligraphyBrush: a fixed-angle flat nib (a 45deg dash stamped
// densely along the path), so stroke width varies with direction — the
// original stamps a brush image; the diagonal dash reproduces the look
// without the image asset.
function drawCalligraphy(
  ctx,
  { fromX, fromY, toX, toY, radiusPx, color, opacity }
) {
  ctx.save();
  ctx.strokeStyle = colorToRgba(color, opacity);
  ctx.lineWidth = Math.max(1, radiusPx * 0.3);
  ctx.lineCap = 'round';
  const nib = radiusPx * 0.7;
  forEachStep(fromX, fromY, toX, toY, 1.5, (x, y) => {
    ctx.beginPath();
    ctx.moveTo(x - nib, y - nib);
    ctx.lineTo(x + nib, y + nib);
    ctx.stroke();
  });
  ctx.restore();
}

// chameleon InkDropBrush: irregular varying-alpha blobs spaced along the
// stroke — drippy tag-pen look.
function drawInkDrop(
  ctx,
  { fromX, fromY, toX, toY, radiusPx, color, opacity = 1 }
) {
  ctx.save();
  ctx.fillStyle = colorToRgba(color, 1);
  forEachStep(fromX, fromY, toX, toY, radiusPx * 0.66, (x, y) => {
    ctx.globalAlpha = (0.3 + Math.random() * 0.7) * opacity;
    ctx.beginPath();
    ctx.arc(x, y, radiusPx * (0.33 + Math.random() * 0.67), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

const BRUSHES = {
  clean: drawSoft,
  splatter: drawSplatter,
  spray: drawSpray,
  marker: drawMarker,
  blurry: drawBlurry,
  thick: drawThick,
  inkdrop: drawInkDrop,
  pencil: drawPencil,
  calligraphy: drawCalligraphy,
};

// Baked half of the metallic finish (the other half is the synced
// metalnessMap canvas in usePaintableSurface): bright and dark flecks
// scattered along the segment so metallic paint reads sparkly up close even
// where scene lighting is flat.
const tmpFleckColor = { light: null, dark: null };

export function drawMetallicFlecks(
  ctx,
  { fromX, fromY, toX, toY, radiusPx, color, opacity = 1 }
) {
  const c = color;
  tmpFleckColor.light = `rgba(${Math.round(
    Math.min(255, c.r * 255 + 140)
  )},${Math.round(Math.min(255, c.g * 255 + 140))},${Math.round(
    Math.min(255, c.b * 255 + 140)
  )},`;
  tmpFleckColor.dark = `rgba(${Math.round(c.r * 90)},${Math.round(
    c.g * 90
  )},${Math.round(c.b * 90)},`;
  ctx.save();
  forEachStep(fromX, fromY, toX, toY, radiusPx * 0.4, (x, y) => {
    const fleckCount = Math.max(4, Math.round(radiusPx * 0.5));
    for (let i = 0; i < fleckCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radiusPx * 0.85;
      const size = 0.6 + Math.random() * Math.max(1, radiusPx * 0.03);
      const base =
        Math.random() < 0.6 ? tmpFleckColor.light : tmpFleckColor.dark;
      ctx.fillStyle = `${base}${(0.25 + Math.random() * 0.45) * opacity})`;
      ctx.fillRect(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist,
        size,
        size
      );
    }
  });
  ctx.restore();
}

// Leva options / can-decal picker share this list; keys are the flat
// `brushTexture` control values (kept 1:1 with presets per conventions).
export const BRUSH_TYPES = Object.keys(BRUSHES);

export function drawBrushSegment(ctx, params) {
  const draw = BRUSHES[params.brushTexture] ?? drawSoft;
  draw(ctx, { ...params, opacity: params.opacity ?? 1 });
}
