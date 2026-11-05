import { TAU } from '../parts';
import { hash01 } from '../signals';
import { glyphBit } from './glyphs';

export const EXTRA_MODES = [
  'waterfall',
  'ecg',
  'vector',
  'starfield',
  'horizon',
  'pong',
  'tunnel',
];

const fract = (v) => v - Math.floor(v);

// A segment cut to the glass rectangle (Liang–Barsky), or null when it
// misses the glass entirely.
function clip([x0, y0, x1, y1], hw, hh) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  let lo = 0;
  let hi = 1;
  const edges = [
    [-dx, x0 + hw],
    [dx, hw - x0],
    [-dy, y0 + hh],
    [dy, hh - y0],
  ];
  for (let i = 0; i < edges.length; i += 1) {
    const [p, q] = edges[i];
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return null;
    } else {
      const r = q / p;
      if (p < 0) lo = Math.max(lo, r);
      else hi = Math.min(hi, r);
      if (lo > hi) return null;
    }
  }
  return [x0 + dx * lo, y0 + dy * lo, x0 + dx * hi, y0 + dy * hi];
}

// One beat of an ECG at phase u in [0, 1): P wave, QRS spike, T wave.
function heart(u) {
  const bump = (c, w, a) => a * Math.exp(-(((u - c) / w) ** 2));
  return (
    bump(0.18, 0.035, 0.12) +
    bump(0.36, 0.012, -0.18) +
    bump(0.4, 0.014, 1) +
    bump(0.44, 0.012, -0.3) +
    bump(0.68, 0.06, 0.25)
  );
}

const PONG_RATE = 60;
const PONG_WIN = 10;

// A game of pong stepped at PONG_RATE: the right paddle chases the ball at
// a speed it can be outrun by, the left one does too unless a hand holds
// it. Rewinding time replays the game from the first serve.
export function createPong(hw, hh) {
  const paddle = hh * 0.22;
  const ballR = 0.025;
  const face = hw - 0.04 - 0.018;
  const speed = hw * 0.9;
  const chase = hh * 1.1;
  let game = null;
  const serve = () => {
    const rally = game.score[0] + game.score[1];
    Object.assign(game, {
      vx: speed * (rally % 2 ? 1 : -1),
      vy: speed * (hash01(rally, 7) - 0.5) * 1.2,
      wait: 0.8,
      x: 0,
      y: 0,
    });
  };
  const start = (step) => {
    game = { left: 0, points: 0, returns: 0, right: 0, score: [0, 0], step };
    serve();
  };
  const follow = (from, to, dt) =>
    from + Math.max(-chase * dt, Math.min(chase * dt, to - from));
  const clampPaddle = (y) => Math.max(-hh + paddle, Math.min(hh - paddle, y));
  const point = (side) => {
    game.score[side] += 1;
    game.points += 1;
    if (game.score[side] >= PONG_WIN) game.score = [0, 0];
    serve();
  };
  const tick = (held) => {
    const dt = 1 / PONG_RATE;
    const miss = (hash01(game.returns, 9) - 0.5) * paddle * 2.4;
    const toward = (sign) => (Math.sign(game.vx) === sign ? game.y + miss : 0);
    game.left = clampPaddle(held ?? follow(game.left, toward(-1), dt));
    game.right = clampPaddle(follow(game.right, toward(1), dt));
    if (game.wait > 0) {
      game.wait -= dt;
      return;
    }
    game.x += game.vx * dt;
    game.y += game.vy * dt;
    if (Math.abs(game.y) > hh - ballR) {
      game.y = Math.sign(game.y) * (hh - ballR);
      game.vy = -game.vy;
    }
    const side = game.vx > 0 ? 1 : -1;
    const at = side > 0 ? game.right : game.left;
    if (side * game.x + ballR >= face && side * game.x < face + ballR) {
      if (Math.abs(game.y - at) <= paddle + ballR) {
        game.x = side * (face - ballR);
        game.vx = -side * Math.min(Math.abs(game.vx) * 1.05, speed * 2);
        game.returns += 1;
        game.vy += ((game.y - at) / paddle) * speed * 0.6;
      }
    } else if (side * game.x > hw) point(side > 0 ? 0 : 1);
  };
  return (t, held) => {
    const step = Math.floor(t * PONG_RATE);
    if (!game || step < game.step) start(Math.max(0, step - PONG_RATE * 600));
    while (game.step < step) {
      tick(held);
      game.step += 1;
    }
    return game;
  };
}

const CUBE = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
];
const CUBE_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

// Seven more patterns for the phosphor screen, each reading the touch pad
// its own way. `ctx` carries the screen's glass half extents and drawing
// helpers; every pose is pure in (state, touch).
export default function screenModes({ disc, hh, hw, rng, seg, slab, style }) {
  const bright = style.screen(1);
  const dim = style.screen(0.25);
  const line = (points, width, look) => {
    const cut = clip(points, hw, hh);
    return cut ? [seg(...cut, width, look)] : [];
  };
  const stars = Array.from({ length: 64 }, () => [
    rng() * TAU,
    rng(),
    0.4 + rng() * 0.6,
  ]);
  const drift = rng() * TAU;
  const pong = createPong(hw, hh);

  return {
    // A spectrogram scrolling down; a touch parks a frequency cursor.
    waterfall: ({ t }, touch) => {
      const pitch = Math.max(0.07, Math.sqrt((4 * hw * hh) / 220));
      const cols = Math.max(4, Math.floor((2 * hw) / pitch));
      const rows = Math.max(3, Math.floor((2 * hh) / pitch));
      const scroll = t * 5;
      const out = [];
      for (let r = 0; r < rows; r += 1) {
        const age = Math.floor(scroll) - r;
        const peaks = [0.2, 0.55, 0.8].map(
          (c, k) => c + 0.12 * Math.sin(age * (0.07 + k * 0.05) + drift + k)
        );
        for (let c = 0; c < cols; c += 1) {
          const u = (c + 0.5) / cols;
          const level = Math.min(
            1,
            peaks.reduce(
              (sum, p, k) =>
                sum + (0.9 - k * 0.2) * Math.exp(-((u - p) ** 2) / 0.004),
              0.15 * hash01(c * 13 + 5, age)
            )
          );
          out.push(
            disc(
              -hw + pitch * (c + 0.5),
              hh - pitch * (r + 0.5 + fract(scroll)) + pitch,
              pitch * 0.3,
              0.026,
              0.03,
              style.screen(0.05 + level)
            )
          );
        }
      }
      if (touch.on) {
        out.push(...line([touch.at[0], -hh, touch.at[0], hh], 0.008, bright));
      }
      return out.filter((item) => Math.abs(item.p[1]) + item.s[1] <= hh);
    },

    // A heart monitor sweeping left to right; pad y sets the rate.
    ecg: ({ t }, touch) => {
      const steps = 80;
      const sweep = fract(t * 0.35);
      const rate = 0.5 + touch.y * 1.4;
      const at = (u) => [
        -hw + u * 2 * hw,
        -hh * 0.35 +
          heart(fract(u * 3 * rate + Math.floor(t * 0.35) * 0.5)) * hh * 1.2,
      ];
      const out = [];
      for (let i = 0; i < steps; i += 1) {
        const u0 = i / steps;
        const u1 = (i + 1) / steps;
        const behind = sweep - u1;
        if (behind >= -0.04 && behind <= 0.9) {
          const fade = behind < 0 ? 0 : 1 - behind * 0.9;
          out.push(
            ...line([...at(u0), ...at(u1)], 0.012, style.screen(0.15 + fade))
          );
        }
      }
      const [hx, hy] = at(sweep);
      out.push(disc(hx, hy, 0.03, 0.026, 0.03, bright));
      return out;
    },

    // A vector-monitor wireframe; dragging spins it.
    vector: ({ t }, touch) => {
      const a = t * 0.7 + touch.x * TAU;
      const b = t * 0.45 + touch.y * TAU;
      const size = Math.min(hw, hh) * 0.5;
      const project = ([x, y, z]) => {
        const x1 = x * Math.cos(a) - z * Math.sin(a);
        const z1 = x * Math.sin(a) + z * Math.cos(a);
        const y1 = y * Math.cos(b) - z1 * Math.sin(b);
        const z2 = y * Math.sin(b) + z1 * Math.cos(b);
        const k = size / (1 + z2 * 0.25);
        return [x1 * k, y1 * k];
      };
      const points = CUBE.map(project);
      const inner = CUBE.map(([x, y, z]) =>
        project([x * 0.45, y * 0.45, z * 0.45])
      );
      return [
        ...CUBE_EDGES.flatMap(([i, j]) =>
          line([...points[i], ...points[j]], 0.012, bright)
        ),
        ...CUBE_EDGES.flatMap(([i, j]) =>
          line([...inner[i], ...inner[j]], 0.008, dim)
        ),
        ...CUBE.map((_, i) =>
          line([...points[i], ...inner[i]], 0.006, dim)
        ).flat(),
      ];
    },

    // Stars streaming out of the vanishing point; a touch moves it.
    starfield: ({ t }, touch) => {
      const [cx, cy] = touch.on ? touch.at : [0, 0];
      const reachOut = Math.hypot(hw, hh) * 1.2;
      const out = [];
      stars.forEach(([angle, seed, speed]) => {
        const z = fract(seed + t * 0.25 * speed);
        const r = z * z * reachOut;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (Math.abs(x) > hw || Math.abs(y) > hh) return;
        const tail = Math.max(z - 0.06, 0) ** 2 * reachOut;
        out.push(
          ...line(
            [cx + Math.cos(angle) * tail, cy + Math.sin(angle) * tail, x, y],
            0.006 + z * 0.012,
            style.screen(0.2 + z)
          )
        );
      });
      return out;
    },

    // An attitude indicator: the horizon rolls and pitches; the pad flies it.
    horizon: ({ t }, touch) => {
      const roll = touch.on
        ? (touch.x - 0.5) * 1.4
        : 0.25 * Math.sin(t * 0.4 + drift);
      const pitch = touch.on
        ? (touch.y - 0.5) * hh * 1.6
        : 0.25 * hh * Math.sin(t * 0.27);
      const c = Math.cos(roll);
      const s = Math.sin(roll);
      const span = Math.hypot(hw, hh) * 1.5;
      const rung = (offset, half) => {
        const ox = -s * offset;
        const oy = c * offset - pitch;
        return [ox - c * half, oy - s * half, ox + c * half, oy + s * half];
      };
      const out = [...line(rung(0, span), 0.014, bright)];
      [-3, -2, -1, 1, 2, 3].forEach((k) => {
        out.push(
          ...line(rung(k * hh * 0.22, hw * (k % 2 ? 0.18 : 0.3)), 0.007, dim)
        );
      });
      const w = Math.min(hw, hh) * 0.35;
      out.push(
        ...line([-w, 0, -w * 0.35, 0], 0.012, style.screen(1.4)),
        ...line([w * 0.35, 0, w, 0], 0.012, style.screen(1.4)),
        disc(0, 0, 0.025, 0.026, 0.03, style.screen(1.4))
      );
      return out;
    },

    // Pong with a score: the pad holds the left paddle.
    pong: ({ t }, touch) => {
      const game = pong(t, touch.on ? touch.at[1] : null);
      const pixel = hh * 0.045;
      const digit = (value, cx) => {
        const parts = [];
        for (let row = 0; row < 5; row += 1) {
          for (let col = 0; col < 3; col += 1) {
            if (glyphBit(String(value), col, row)) {
              parts.push(
                slab(
                  cx + (col - 1) * pixel,
                  hh - pixel * (row + 1.5),
                  pixel * 0.45,
                  pixel * 0.45,
                  0.026,
                  0.03,
                  dim
                )
              );
            }
          }
        }
        return parts;
      };
      const paddle = hh * 0.22;
      const out = [
        ...digit(game.score[0], -hw * 0.3),
        ...digit(game.score[1], hw * 0.3),
        slab(-hw + 0.04, game.left, 0.018, paddle, 0.026, 0.03, bright),
        slab(hw - 0.04, game.right, 0.018, paddle, 0.026, 0.03, bright),
      ];
      if (game.wait <= 0) {
        out.push(
          slab(game.x, game.y, 0.025, 0.025, 0.026, 0.03, style.screen(1.4))
        );
      }
      for (let y = -hh + 0.05; y < hh; y += 0.12) {
        out.push(slab(0, y, 0.006, 0.03, 0.026, 0.03, dim));
      }
      return out;
    },

    // Frames rushing toward the viewer; a touch steers the tunnel.
    tunnel: ({ t }, touch) => {
      const [cx, cy] = touch.on ? touch.at : [0, 0];
      const frames = 9;
      const out = [];
      for (let i = 0; i < frames; i += 1) {
        const z = fract(i / frames + t * 0.2);
        const k = z * z;
        const fw = hw * 1.3 * k;
        const fh = hh * 1.3 * k;
        const ox = cx * (1 - k);
        const oy = cy * (1 - k);
        const turn = (1 - z) * 0.6 * Math.sin(t * 0.5);
        const corner = (sx, sy) => {
          const x = sx * fw;
          const y = sy * fh;
          return [
            ox + x * Math.cos(turn) - y * Math.sin(turn),
            oy + x * Math.sin(turn) + y * Math.cos(turn),
          ];
        };
        const pts = [
          corner(-1, -1),
          corner(1, -1),
          corner(1, 1),
          corner(-1, 1),
        ];
        const look = style.screen(0.1 + z);
        pts.forEach((p, j) => {
          out.push(
            ...line([...p, ...pts[(j + 1) % 4]], 0.004 + z * 0.01, look)
          );
        });
      }
      return out;
    },
  };
}
