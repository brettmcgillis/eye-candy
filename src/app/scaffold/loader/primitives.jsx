import React from 'react';

export const INK = {
  red: '#E5202A',
  redDeep: '#A8121A',
  black: '#0A0A0A',
  paper: '#ffffff',
};

export const CX = 128;
export const CY = 128;
export const SQ = 36;
export const D = SQ;

export const SQUARES_H = [
  { sx: 0.0, sy: 0.0, layer: 'b', i: 0 },
  { sx: 1.5, sy: -1.5, layer: 'b', i: 1 },
  { sx: -1.5, sy: 1.5, layer: 'b', i: 2 },
  { sx: 0.0, sy: 1.5, layer: 'b', i: 3 },
  { sx: 0.0, sy: -1.5, layer: 'b', i: 4 },
  { sx: 1.5, sy: 0.0, layer: 'b', i: 5 },
  { sx: -1.5, sy: 0.0, layer: 'b', i: 6 },
  { sx: -0.75, sy: -0.75, layer: 't', i: 7 },
  { sx: 0.75, sy: -0.75, layer: 't', i: 8 },
  { sx: -0.75, sy: 0.75, layer: 't', i: 9 },
  { sx: 0.75, sy: 0.75, layer: 't', i: 10 },
];

export const SQUARES_V = [
  { sx: 0.0, sy: 0.0, layer: 'b', i: 0 },
  { sx: 1.5, sy: 1.5, layer: 'b', i: 1 },
  { sx: -1.5, sy: -1.5, layer: 'b', i: 2 },
  { sx: 0.0, sy: 1.5, layer: 'b', i: 3 },
  { sx: 0.0, sy: -1.5, layer: 'b', i: 4 },
  { sx: 1.5, sy: 0.0, layer: 'b', i: 5 },
  { sx: -1.5, sy: 0.0, layer: 'b', i: 6 },
  { sx: -0.75, sy: -0.75, layer: 't', i: 7 },
  { sx: 0.75, sy: -0.75, layer: 't', i: 8 },
  { sx: -0.75, sy: 0.75, layer: 't', i: 9 },
  { sx: 0.75, sy: 0.75, layer: 't', i: 10 },
];

export const OrientationContext = React.createContext('h');

export function OrientationProvider({ orientation = 'h', children }) {
  return (
    <OrientationContext.Provider value={orientation}>
      {children}
    </OrientationContext.Provider>
  );
}

export function useSquares() {
  const o = React.useContext(OrientationContext);
  return o === 'v' ? SQUARES_V : SQUARES_H;
}

export function diamondCenter(sx, sy) {
  const px = sx * SQ;
  const py = sy * SQ;
  const c = Math.cos(Math.PI / 4);
  const s = Math.sin(Math.PI / 4);
  return { x: CX + px * c - py * s, y: CY + px * s + py * c };
}

export const ease = {
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  out: (t) => 1 - (1 - t) ** 3,
  in: (t) => t * t * t,
  back: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
};

export const phase = (t, dur, offset = 0) => {
  const p = (t / dur + offset) % 1;
  return p < 0 ? p + 1 : p;
};

// ─── Canvas drawing primitives ───────────────────────────────────────────────

// Returns screen-space corners of a square at grid position (sx, sy) after 45° rotation around (CX, CY).
function squareScreenCorners(sx, sy) {
  const angle = Math.PI / 4;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const px = sx * SQ;
  const py = sy * SQ;
  const screenX = CX + px * cos - py * sin;
  const screenY = CY + px * sin + py * cos;
  const half = SQ / 2;
  return [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ].map(([x, y]) => [screenX + x * cos - y * sin, screenY + x * sin + y * cos]);
}

// Sets the canvas clip region to the union of all pattern squares (in screen space).
export function clipToPattern(ctx, squares) {
  ctx.beginPath();
  squares.forEach((sq) => {
    const corners = squareScreenCorners(sq.sx, sq.sy);
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(corners[i][0], corners[i][1]);
    ctx.closePath();
  });
  ctx.clip();
}

// Draws a single square in the rotated pattern space (caller must have applied the 45° transform).
export function drawSquare(ctx, sx, sy, opts = {}) {
  const {
    size = SQ,
    color = INK.red,
    opacity = 1,
    extraRotation = 0,
    scale = 1,
    blur = 0,
  } = opts;
  if (opacity <= 0) return;
  ctx.save();
  ctx.translate(sx * SQ, sy * SQ);
  if (extraRotation) ctx.rotate((extraRotation * Math.PI) / 180);
  if (scale !== 1) ctx.scale(scale, scale);
  if (blur) ctx.filter = `blur(${blur}px)`;
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

// Draws the full 11-square pattern with optional per-square overrides.
// parentOpacity multiplies each square's opacity (used for layered compositing).
export function drawPatternBase(
  ctx,
  squares,
  overrides = {},
  ox = 0,
  oy = 0,
  parentOpacity = 1
) {
  ctx.save();
  ctx.translate(CX + ox, CY + oy);
  ctx.rotate(Math.PI / 4);
  squares.forEach((s) => {
    const o = overrides[s.i] || {};
    if (o.skip) return;
    const color = o.color ?? (s.layer === 'b' ? INK.red : INK.black);
    drawSquare(
      ctx,
      (o.sx ?? s.sx) + (o.dsx || 0),
      (o.sy ?? s.sy) + (o.dsy || 0),
      {
        size: o.size ?? SQ,
        color,
        opacity: (o.opacity ?? 1) * parentOpacity,
        extraRotation: o.extraRotation ?? 0,
        scale: o.scale ?? 1,
        blur: o.blur ?? 0,
      }
    );
  });
  ctx.restore();
}

export function drawDrip(ctx, x, y, length, width, color, opacity = 1) {
  if (opacity <= 0 || length <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y, width, length);
  ctx.beginPath();
  ctx.arc(x, y + length, width * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawSplatter(
  ctx,
  {
    seed = 1,
    count = 12,
    cx = CX,
    cy = CY,
    radius = 110,
    color = INK.red,
    opacity = 0.7,
  } = {}
) {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const r = (0.3 + rand() * 0.7) * radius;
    const sz = 0.6 + rand() * 2.6;
    const dotOpacity = opacity * (0.4 + rand() * 0.6);
    if (dotOpacity <= 0) continue;
    ctx.save();
    ctx.globalAlpha = dotOpacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, sz, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ─── Animation hook ───────────────────────────────────────────────────────────

// Runs a RAF loop outside React — drawFn(ctx, t) is called every frame.
// drawFn is stored in a ref so the latest closure (with fresh squares/state) is
// always used without restarting the loop on re-renders.
export function useLoaderCanvas(drawFn) {
  const canvasRef = React.useRef(null);
  const drawRef = React.useRef(drawFn);
  drawRef.current = drawFn;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 256 * dpr;
    canvas.height = 256 * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, 256, 256);
      ctx.fillStyle = INK.paper;
      ctx.fillRect(0, 0, 256, 256);
      drawRef.current(ctx, t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return canvasRef;
}

export function CanvasFrame({ canvasRef }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: INK.paper,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={256}
        height={256}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
