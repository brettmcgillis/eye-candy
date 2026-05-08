import React from 'react';

import {
  CX,
  CY,
  CanvasFrame,
  INK,
  SQ,
  drawPatternBase,
  ease,
  phase,
  useLoaderCanvas,
  useSquares,
} from './primitives';

// 02 — Inner Spin: 4 black squares spin on their own centers, red ring stays.
export function Loader02() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const overrides = {};
    squares
      .filter((s) => s.layer === 't')
      .forEach((s, idx) => {
        overrides[s.i] = {
          extraRotation: ease.inOut(phase(t, 1.6, idx * 0.05)) * 360,
        };
      });
    drawPatternBase(ctx, squares, overrides);
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 03 — Pulse Wave: each square scales independently in a radial wave.
export function Loader03() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const overrides = {};
    squares.forEach((s) => {
      const dist = Math.hypot(s.sx, s.sy);
      const phasedT = phase(t, 1.8, -dist * 0.18);
      const sc = 0.4 + 0.6 * Math.sin(phasedT * Math.PI) ** 2;
      overrides[s.i] = { scale: sc };
    });
    drawPatternBase(ctx, squares, overrides);
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 04 — Build: squares drop in one at a time, then loop.
const BUILD_ORDER = [1, 2, 4, 3, 5, 6, 0, 7, 8, 9, 10];

export function Loader04() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const p = phase(t, 3.2);
    const overrides = {};
    BUILD_ORDER.forEach((i, idx) => {
      const start = (idx / BUILD_ORDER.length) * 0.85;
      const local = Math.max(0, Math.min(1, (p - start) / 0.12));
      const fall = (1 - ease.out(local)) * 4;
      overrides[i] = { dsx: -fall, dsy: -fall, opacity: local };
    });
    drawPatternBase(ctx, squares, overrides);
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 05 — Ink Bleed: each square expands from a tiny dot via blur+scale.
export function Loader05() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const overrides = {};
    squares.forEach((s, idx) => {
      const p = phase(t, 1.6, -idx * 0.06);
      const sc = ease.out(p);
      const blur = (1 - p) * 6;
      const op = ease.out(Math.min(1, p * 2)) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      overrides[s.i] = { scale: sc, blur, opacity: op };
    });
    drawPatternBase(ctx, squares, overrides);
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 06 — Stamp: each square slams down with a splatter halo, in sequence.
export function Loader06() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const p = phase(t, 2.6);
    const order = squares.map((s) => s.i);
    const N = order.length;
    // Drive over N+1 slots: the extra slot lets the last stamp fully land
    // and holds the complete pattern before the cycle resets.
    const stampP = p * (N + 1);
    const stampIdx = Math.min(Math.floor(stampP), N - 1);
    const local = Math.min(stampP - stampIdx, 1);
    const overrides = {};
    order.forEach((i, idx) => {
      if (idx < stampIdx) overrides[i] = {};
      else if (idx === stampIdx) {
        overrides[i] = {
          dsy: -2.5 * (1 - ease.in(local)),
          scale: 1 + (1 - local) * 0.3,
          opacity: local,
        };
      } else {
        overrides[i] = { skip: true };
      }
    });
    drawPatternBase(ctx, squares, overrides);
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 07 — Vertical Wipe: correct colors fill top-down over a ghost.
export function Loader07() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const p = phase(t, 2.2);
    const ghostOverrides = {};
    squares.forEach((s) => {
      ghostOverrides[s.i] = { opacity: 0.15 };
    });
    drawPatternBase(ctx, squares, ghostOverrides);

    // Clip to the filled region and redraw with each square's correct color
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 256, ease.inOut(p) * 256);
    ctx.clip();
    drawPatternBase(ctx, squares);
    ctx.restore();
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 08 — Inner Orbit: 4 inner squares orbit around center, return home.
export function Loader08() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const p = phase(t, 2.6);
    const angle = ease.inOut(p) * Math.PI * 2;
    const overrides = {};
    squares
      .filter((s) => s.layer === 't')
      .forEach((s) => {
        const r = Math.hypot(s.sx, s.sy);
        const baseA = Math.atan2(s.sy, s.sx);
        const a = baseA + angle;
        overrides[s.i] = {
          sx: Math.cos(a) * r,
          sy: Math.sin(a) * r,
          extraRotation: (angle * 180) / Math.PI,
        };
      });
    drawPatternBase(ctx, squares, overrides);
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 09 — Bleed Lines: bands sweep down revealing correct colors per square.
export function Loader09() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const ghostOverrides = {};
    squares.forEach((s) => {
      ghostOverrides[s.i] = { opacity: 0.22 };
    });
    drawPatternBase(ctx, squares, ghostOverrides);

    // Each band clips to its strip and reveals the pattern's true colors
    [0, 0.33, 0.66].forEach((off) => {
      const p = phase(t, 1.8, off);
      const y = p * 320 - 32;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-20, y, 296, 28);
      ctx.clip();
      drawPatternBase(ctx, squares);
      ctx.restore();
    });
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 12 — Flicker: each square fades in/out at offset rates.
export function Loader12() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const overrides = {};
    squares.forEach((s, idx) => {
      const p = phase(t, 1.0 + idx * 0.07);
      overrides[s.i] = {
        opacity: 0.25 + 0.75 * (Math.sin(p * Math.PI * 2) * 0.5 + 0.5),
      };
    });
    drawPatternBase(ctx, squares, overrides);
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 14 — Color Invert: pattern crossfades between normal and inverted palette.
export function Loader14() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const p = phase(t, 2.2);
    const k = ease.inOut(Math.sin(p * Math.PI) ** 2);

    // Normal colors (b=red, t=black) fading out
    if (k < 1) {
      drawPatternBase(ctx, squares, {}, 0, 0, 1 - k);
    }

    // Inverted colors (b=black, t=red) fading in
    if (k > 0) {
      const overrides = {};
      squares.forEach((s) => {
        overrides[s.i] = { color: s.layer === 'b' ? INK.black : INK.red };
      });
      drawPatternBase(ctx, squares, overrides, 0, 0, k);
    }
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 16 — Misregister: CMYK-style channel drift.
export function Loader16() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const off = Math.sin(t * 3) * 4;

    drawPatternBase(ctx, squares, {}, off, off * 0.6, 0.55);

    const blueOverrides = {};
    squares.forEach((s) => {
      blueOverrides[s.i] = { color: s.layer === 'b' ? '#3aa6ff' : INK.black };
    });
    drawPatternBase(ctx, squares, blueOverrides, -off, -off * 0.6, 0.55);

    drawPatternBase(ctx, squares, {}, 0, 0, 0.85);
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 17 — Snake Trail: progress trail through squares.
const SNAKE_ORDER = [4, 1, 5, 3, 2, 6, 0, 7, 8, 10, 9];

export function Loader17() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const p = phase(t, 2.4);
    const head = p * SNAKE_ORDER.length;
    const overrides = {};
    squares.forEach((s) => {
      const slot = SNAKE_ORDER.indexOf(s.i);
      const dist = (head - slot + SNAKE_ORDER.length) % SNAKE_ORDER.length;
      overrides[s.i] = { opacity: Math.max(0.1, 1 - dist / 5) };
    });
    drawPatternBase(ctx, squares, overrides);
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 18 — Burst & Snap: explodes outward, snaps back.
export function Loader18() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const p = phase(t, 2.0);
    const k = p < 0.5 ? ease.out(p / 0.5) : 1 - ease.out((p - 0.5) / 0.5);
    const overrides = {};
    squares.forEach((s) => {
      const r = Math.hypot(s.sx, s.sy) || 1;
      overrides[s.i] = {
        dsx: (s.sx / r) * k * 2,
        dsy: (s.sy / r) * k * 2,
        extraRotation: k * 180,
      };
    });
    drawPatternBase(ctx, squares, overrides);
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 19 — Drip Fill: outlines fill with correct colors top-down.
export function Loader19() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const p = phase(t, 3.0);

    // Outline-only pass (persists throughout)
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(Math.PI / 4);
    squares.forEach((s) => {
      ctx.strokeStyle = s.layer === 'b' ? INK.red : INK.black;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(s.sx * SQ - SQ / 2, s.sy * SQ - SQ / 2, SQ, SQ);
    });
    ctx.restore();

    // Clip to wipe region and redraw with each square's correct color
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 256, ease.inOut(p) * 256);
    ctx.clip();
    drawPatternBase(ctx, squares);
    ctx.restore();
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 20 — Outline Orbit: all squares as strokes, inner four orbit the center.
export function Loader20() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const p = phase(t, 2.6);
    const angle = ease.inOut(p) * Math.PI * 2;

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(Math.PI / 4);

    squares.forEach((s) => {
      let { sx } = s;
      let { sy } = s;
      let rot = 0;

      if (s.layer === 't') {
        const r = Math.hypot(s.sx, s.sy);
        const baseA = Math.atan2(s.sy, s.sx);
        const a = baseA + angle;
        sx = Math.cos(a) * r;
        sy = Math.sin(a) * r;
        rot = angle;
      }

      ctx.save();
      ctx.translate(sx * SQ, sy * SQ);
      ctx.rotate(rot);
      ctx.strokeStyle = s.layer === 'b' ? INK.red : INK.black;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-SQ / 2, -SQ / 2, SQ, SQ);
      ctx.restore();
    });

    ctx.restore();
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

// 21 — Ghost Outline: hard outlines over ghost fills that breathe in a radial wave.
export function Loader21() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    // Ghost fills — radial wave pulses outward from center
    const overrides = {};
    squares.forEach((s) => {
      const dist = Math.hypot(s.sx, s.sy);
      const p = phase(t, 2.4, -dist * 0.15);
      overrides[s.i] = { opacity: 0.06 + 0.14 * Math.sin(p * Math.PI) ** 2 };
    });
    drawPatternBase(ctx, squares, overrides);

    // Hard outlines on top — correct color per square, always sharp
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(Math.PI / 4);
    squares.forEach((s) => {
      ctx.strokeStyle = s.layer === 'b' ? INK.red : INK.black;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(s.sx * SQ - SQ / 2, s.sy * SQ - SQ / 2, SQ, SQ);
    });
    ctx.restore();
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

Loader02.cycleDuration = 1.6;
Loader03.cycleDuration = 1.8;
Loader04.cycleDuration = 3.2;
Loader05.cycleDuration = 1.6;
Loader06.cycleDuration = 2.6;
Loader07.cycleDuration = 2.2;
Loader08.cycleDuration = 2.6;
Loader09.cycleDuration = 1.8;
Loader12.cycleDuration = 1.8;
Loader14.cycleDuration = 2.2;
Loader16.cycleDuration = 2.1;
Loader17.cycleDuration = 2.4;
Loader18.cycleDuration = 2.0;
Loader19.cycleDuration = 3.0;
Loader20.cycleDuration = 2.6;
Loader21.cycleDuration = 2.4;

// 22 — Figure Eight: black squares stay solid; red squares trail through an ∞ path.
// 8-step cycle: 6 → 0 → 5 → 1 → 4 → 0 → 3 → 2 → repeat.
// Square 0 (center) appears twice (slots 1 and 5), so we pick the closer slot.
const FIGURE8_ORDER = [6, 0, 5, 1, 4, 0, 3, 2];

export function Loader22() {
  const squares = useSquares();

  const canvasRef = useLoaderCanvas((ctx, t) => {
    const N = FIGURE8_ORDER.length; // 8
    const p = phase(t, 2.4);
    const head = p * N;
    const overrides = {};

    squares.forEach((s) => {
      if (s.layer === 't') {
        // Black squares: always fully lit
        overrides[s.i] = { opacity: 1 };
      } else {
        // Red squares: a square may appear more than once in the path (center square i:0
        // is at slots 1 and 5). Compute minimum circular distance to any of its slots.
        let minDist = N;
        FIGURE8_ORDER.forEach((id, slot) => {
          if (id === s.i) {
            const dist = (head - slot + N) % N;
            if (dist < minDist) minDist = dist;
          }
        });
        overrides[s.i] = { opacity: Math.max(0.08, 1 - minDist / 4) };
      }
    });

    drawPatternBase(ctx, squares, overrides);
  });

  return <CanvasFrame canvasRef={canvasRef} />;
}

Loader22.cycleDuration = 2.4;

export const ALL_LOADERS = [
  Loader02,
  Loader03,
  Loader04,
  Loader05,
  Loader06,
  Loader07,
  Loader08,
  Loader09,
  Loader12,
  Loader14,
  Loader16,
  Loader17,
  Loader18,
  Loader19,
  Loader20,
  Loader21,
  Loader22,
];
