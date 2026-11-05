import { detent, press } from '../hits';
import { part } from '../parts';
import { hash01 } from '../signals';
import { glyphBit } from './glyphs';

export const MATRIX_MODES = [
  'ticker',
  'pattern',
  'sequencer',
  'life',
  'rain',
  'bars',
  'fire',
  'ripple',
  'bounce',
  'clock',
];
const MESSAGE = '  PATCH DISCONNECTED  SENSORS ONLINE  ';
const ROWS = 7;
const LIFE_GENERATIONS = 96;
const DIM = 0.015;
const MAX_PITCH = 0.3;
const LIFE_RATE = 5;
const BOUNCE_RATE = 10;
// Modes whose pixel edits feed their simulation instead of overlaying it.
const SIMULATED = new Set(['life', 'bounce']);

const fract = (v) => v - Math.floor(v);

function lifeStep(cells, cols) {
  return cells.map((alive, i) => {
    const x = i % cols;
    const y = Math.floor(i / cols);
    let n = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const at = ((y + dy + ROWS) % ROWS) * cols + ((x + dx + cols) % cols);
        if ((dx || dy) && cells[at]) n += 1;
      }
    }
    return n === 3 || (alive && n === 2);
  });
}

const reseeded = (count, round) =>
  Array.from({ length: count }, (_, i) => hash01(i, round) < 0.3);

// Generations of Life on the matrix's torus, reseeded whenever the colony
// dies out or freezes, so a frame is just an index into the run.
function lifeRun(seed, cols) {
  const runs = [seed];
  let round = 1;
  while (runs.length < LIFE_GENERATIONS) {
    const cells = runs[runs.length - 1];
    const next = lifeStep(cells, cols);
    const stale =
      next.filter(Boolean).length < 4 || next.every((v, i) => v === cells[i]);
    if (stale) round += 1;
    runs.push(stale ? reseeded(cells.length, round) : next);
  }
  return runs;
}

export default function buildMatrix(kit, { w, h, variant }) {
  const { slab, disc, style, rng } = kit;
  const tall = Math.min((h - 0.55) / ROWS, MAX_PITCH);
  const cols = Math.max(6, Math.min(24, Math.floor((w - 0.4) / tall)));
  const pitch = Math.min((w - 0.4) / cols, tall);
  const radius = pitch * 0.32;
  const at = (i) => [
    ((i % cols) - (cols - 1) / 2) * pitch,
    ((ROWS - 1) / 2 - Math.floor(i / cols)) * pitch + 0.05,
  ];
  const count = cols * ROWS;
  const color = Math.floor(rng() * 3);
  const bits = Array.from({ length: count }, () => rng() < 0.22);
  const button = [w / 2 - 0.24, -h / 2 + 0.24];
  const start = variant
    ? MATRIX_MODES.indexOf(variant)
    : Math.floor(rng() * MATRIX_MODES.length);
  const last = MATRIX_MODES.length - 1;
  const salt = bits.reduce((sum, bit, i) => sum + (bit ? i : 0), 0);
  let life = null;
  const lifeAt = (gen) => {
    life ??= lifeRun(bits, cols);
    return life[gen % LIFE_GENERATIONS];
  };
  const lit = (edits) => edits.map((v) => v > 0.5);

  // Life runs the precomputed colony until a pixel is clicked; from then a
  // live board steps on, each click flipping its cell, until time rewinds.
  const board = { cells: null, edits: null, gen: 0 };
  const lifeBoard = (t, edits) => {
    const gen = Math.floor(t * LIFE_RATE);
    const flips = board.edits
      ? edits.map((v, i) => v > 0.5 !== board.edits[i])
      : edits.map(() => false);
    board.edits = lit(edits);
    if (board.cells && gen < board.gen) board.cells = null;
    if (!board.cells && !flips.some(Boolean)) return lifeAt(gen);
    if (!board.cells) board.cells = lifeAt(gen).slice();
    board.gen = Math.max(board.gen, gen - LIFE_GENERATIONS);
    while (board.gen < gen) {
      board.cells = lifeStep(board.cells, cols);
      board.gen += 1;
    }
    board.cells = board.cells.map((alive, i) => (flips[i] ? !alive : alive));
    return board.cells;
  };

  // A ball stepping a cell a tick, bouncing off the frame and off every lit
  // pixel. Rewinding time replays it from the start against today's walls.
  const ball = { hits: new Map(), step: -1, trail: [] };
  const bounceAt = (t, edits) => {
    const step = Math.floor(t * BOUNCE_RATE);
    const walls = lit(edits);
    const wall = (x, y) =>
      x < 0 || x >= cols || y < 0 || y >= ROWS || walls[y * cols + x];
    if (step < ball.step || ball.step < 0) {
      Object.assign(ball, {
        hits: new Map(),
        step: 0,
        trail: [[salt % cols, salt % ROWS]],
        vx: 1,
        vy: 1,
        x: salt % cols,
        y: salt % ROWS,
      });
    }
    const bump = (x, y) => {
      if (!wall(x, y)) return false;
      if (walls[y * cols + x]) ball.hits.set(y * cols + x, ball.step);
      return true;
    };
    const under = ball.y * cols + ball.x;
    if (walls[under] && ball.trail.length > 1) {
      ball.hits.set(under, ball.step);
      ball.trail.shift();
      [[ball.x, ball.y]] = ball.trail;
      ball.vx = -ball.vx;
      ball.vy = -ball.vy;
    }
    while (ball.step < step) {
      const { x, y } = ball;
      if (bump(x + ball.vx, y)) ball.vx = -ball.vx;
      if (bump(x, y + ball.vy)) ball.vy = -ball.vy;
      if (bump(x + ball.vx, y + ball.vy)) {
        ball.vx = -ball.vx;
        ball.vy = -ball.vy;
      }
      if (!wall(x + ball.vx, y + ball.vy)) {
        ball.x += ball.vx;
        ball.y += ball.vy;
      }
      ball.trail = [[ball.x, ball.y], ...ball.trail].slice(0, 5);
      ball.step += 1;
    }
    return { step, walls };
  };

  // Each mode maps a pixel (x, y, its index) at state to a level in [0, 1].
  const modes = {
    ticker: ({ t }) => {
      const scroll = Math.floor(t * 8);
      return (x, y) => {
        const col = (x + scroll) % (MESSAGE.length * 4);
        return y > 0 &&
          y < 6 &&
          col % 4 < 3 &&
          glyphBit(MESSAGE[Math.floor(col / 4)], col % 4, y - 1)
          ? 1
          : 0;
      };
    },
    pattern:
      ({ t }) =>
      (x, y) =>
        Math.sin(x * 0.7 + t * 2) + Math.cos(y * 0.8 - t * 1.4) > 0.5 ? 1 : 0,
    sequencer:
      ({ step }) =>
      (x, y, i) => {
        if (bits[i]) return 1;
        return x === step % cols ? 0.22 : 0;
      },
    life: ({ t }, edits) => {
      const cells = lifeBoard(t, edits);
      return (x, y, i) => (cells[i] ? 1 : 0);
    },
    // Falling code: one drop per column with a fading tail.
    rain:
      ({ t }) =>
      (x, y) => {
        const speed = 0.25 + hash01(x, salt) * 0.5;
        const head = fract(hash01(x + 31, salt) + t * speed) * (ROWS + 6) - 2;
        const behind = head - y;
        if (behind < 0 || behind > 5) return 0;
        return behind < 1 ? 1 : 0.7 - behind * 0.13;
      },
    // A spectrum analyser over the audio bands, with falling peak dots.
    bars:
      ({ audio }) =>
      (x, y) => {
        const band = Math.floor((x / cols) * audio.length);
        const height = Math.round(Math.min(1, audio[band] * 1.3) * ROWS);
        const fromBottom = ROWS - 1 - y;
        if (fromBottom < height) return fromBottom > ROWS - 3 ? 1 : 0.75;
        return fromBottom === height ? 0.2 : 0;
      },
    fire:
      ({ t }) =>
      (x, y) => {
        const frame = Math.floor(t * 14);
        const heat =
          (y / (ROWS - 1)) * 1.25 -
          0.55 * hash01(x * 7 + y, frame) -
          0.25 * hash01(x, frame + salt);
        return Math.max(0, Math.min(1, heat));
      },
    ripple: ({ t }) => {
      const cx = (cols - 1) / 2 + Math.sin(t * 0.3) * cols * 0.25;
      const cy = (ROWS - 1) / 2;
      return (x, y) => {
        const wave = Math.sin(Math.hypot(x - cx, y - cy) * 1.2 - t * 5);
        return wave > 0.3 ? (wave - 0.3) / 0.7 : 0;
      };
    },
    // A ball ricocheting round the frame, trailing its last few positions.
    bounce: ({ t }, edits) => {
      const { step, walls } = bounceAt(t, edits);
      return (x, y, i) => {
        const k = ball.trail.findIndex(([bx, by]) => bx === x && by === y);
        if (k === 0) return 1;
        if (walls[i]) return step - (ball.hits.get(i) ?? -99) < 3 ? 1 : 0.45;
        return k > 0 ? 1 - k * 0.2 : 0;
      };
    },
    // The scene clock as MM:SS, or seconds alone on a narrow matrix.
    clock: ({ t }) => {
      const seconds = Math.floor(t);
      const pad2 = (v) => String(v % 60).padStart(2, '0');
      const text =
        cols >= 19
          ? `${pad2(Math.floor(seconds / 60))}:${pad2(seconds)}`
          : pad2(seconds);
      const left = Math.floor((cols - (text.length * 4 - 1)) / 2);
      const blink = fract(t) < 0.5;
      return (x, y) => {
        const col = x - left;
        if (col < 0 || y < 1 || y > 5) return 0;
        const char = text[Math.floor(col / 4)];
        if (!char || col % 4 === 3) return 0;
        if (char === ':' && !blink) return 0;
        return glyphBit(char, col % 4, y - 1) ? 1 : 0;
      };
    },
  };

  return {
    live: true,
    statics: [
      slab(0, 0, w / 2 - 0.08, h / 2 - 0.08, 0, 0.035, style.knob, 0, 'rbox'),
      ...bits.map((_, i) =>
        disc(...at(i), radius * 1.25, 0.035, 0.04, style.hole)
      ),
      disc(...button, 0.06, 0.035, 0.07, style.cap(0), 'cap'),
    ],
    hits: [
      detent(0, ...button, 0.09, MATRIX_MODES.length),
      ...bits.map((_, i) => press(i + 1, ...at(i), { r: pitch * 0.47 })),
    ],
    signals: [
      {
        kind: 'step',
        steps: MATRIX_MODES.length,
        fixed: true,
        base: start / last,
      },
      ...bits.map(() => ({ kind: 'switch', base: 0, fixed: true })),
    ],
    pose: ([modeValue, ...edits], state) => {
      const mode = MATRIX_MODES[Math.round(modeValue * last)];
      const level = modes[mode](state, edits);
      const overlay = !SIMULATED.has(mode);
      return bits.flatMap((_, i) => {
        const x = i % cols;
        const y = Math.floor(i / cols);
        let value = level(x, y, i);
        if (overlay && edits[i] > 0.5) value = value > 0.5 ? 0 : 1;
        return [
          part(
            'sphere',
            [...at(i), 0.04],
            [radius, radius, radius * 0.6],
            style.led(color, Math.max(DIM, value))
          ),
          ...(value > 0.5
            ? kit.spill(...at(i), pitch * 0.9, 0.04, color, value * 0.5)
            : []),
        ];
      });
    },
  };
}
