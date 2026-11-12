import { CX, CY, SQ, roleColor } from './primitives';

// A motion returns layers; a layer is a list of square states drawn with one
// look ('ink' — the finished mark, or 'sketch' — its underdrawing) of a style.
//
// square state: { i, layer, sx, sy, rot (deg), scale, opacity, color, reveal }
// layer:        { look, squares, alpha?, offset?: [x, y], clip?: (ctx) => path }

export function restState(squares) {
  return squares.map((s) => ({
    i: s.i,
    layer: s.layer,
    sx: s.sx,
    sy: s.sy,
    rot: 0,
    scale: 1,
    opacity: 1,
    color: roleColor(s.layer),
    reveal: 1,
  }));
}

// Wipes along the local diagonal, which is top-to-bottom on screen.
export function clipReveal(ctx, reveal, extent = SQ) {
  const b = extent;
  const k = -b + reveal * 2 * b;
  ctx.beginPath();
  ctx.moveTo(-2 * b, -2 * b);
  ctx.lineTo(k + 2 * b, -2 * b);
  ctx.lineTo(-2 * b, k + 2 * b);
  ctx.closePath();
  ctx.clip();
}

export function drawLayers(ctx, layers, style) {
  layers.forEach((layer) => {
    const alpha = layer.alpha ?? 1;
    if (alpha <= 0) return;
    ctx.save();
    if (layer.clip) {
      ctx.beginPath();
      layer.clip(ctx);
      ctx.clip();
    }
    const [ox, oy] = layer.offset ?? [0, 0];
    ctx.translate(CX + ox, CY + oy);
    ctx.rotate(Math.PI / 4);
    layer.squares.forEach((sq) => {
      const opacity = sq.opacity * alpha;
      if (opacity <= 0 || sq.reveal <= 0 || sq.scale <= 0) return;
      ctx.save();
      ctx.translate(sq.sx * SQ, sq.sy * SQ);
      if (sq.rot) ctx.rotate((sq.rot * Math.PI) / 180);
      if (sq.scale !== 1) ctx.scale(sq.scale, sq.scale);
      ctx.globalAlpha = opacity;
      style.draw(ctx, sq, layer.look);
      ctx.restore();
    });
    ctx.restore();
  });
}
