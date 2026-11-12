import { watercolorStages } from '@modules/painted';

import { TILE, TILE_UNITS, bakeRecipe, tileOrigin } from './brushBake';
import { clipReveal } from './drawFrame';
import { SQ } from './primitives';

const HALF = SQ / 2;

function vectorStyle(id, label, paint) {
  return {
    id,
    label,
    engine: 'canvas',
    draw(ctx, sq, look) {
      if (sq.reveal < 1) clipReveal(ctx, sq.reveal);
      paint(ctx, sq, look);
    },
  };
}

function strokeSquare(ctx, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.strokeRect(-HALF, -HALF, SQ, SQ);
}

const solid = vectorStyle('solid', 'Solid', (ctx, sq, look) => {
  if (look === 'sketch') {
    strokeSquare(ctx, sq.color, 2.5);
    return;
  }
  ctx.fillStyle = sq.color;
  ctx.fillRect(-HALF, -HALF, SQ, SQ);
});

const outline = vectorStyle('outline', 'Outline', (ctx, sq, look) => {
  if (look === 'sketch') {
    ctx.globalAlpha *= 0.35;
    strokeSquare(ctx, sq.color, 1);
    return;
  }
  strokeSquare(ctx, sq.color, 2.5);
});

function blit(ctx, atlas, i) {
  const [x, y] = tileOrigin(i);
  const h = TILE_UNITS / 2;
  ctx.drawImage(atlas, x, y, TILE, TILE, -h, -h, TILE_UNITS, TILE_UNITS);
}

function brushStyle(recipe) {
  const entry = () => bakeRecipe(recipe);
  return {
    id: recipe.id,
    label: recipe.label,
    engine: 'brush',
    recipe,
    prepare: () => entry().promise,
    baked: () => entry().ready,
    draw(ctx, sq, look) {
      const { ready } = entry();
      if (!ready) {
        outline.draw(ctx, sq, 'sketch');
        return;
      }
      if (look === 'sketch') {
        if (sq.reveal < 1) clipReveal(ctx, sq.reveal, TILE_UNITS);
        blit(ctx, ready.sketch(sq.color), sq.i);
        return;
      }
      const frames = ready.ink;
      const x = Math.min(sq.reveal, 1) * frames.length;
      const k = Math.min(Math.floor(x), frames.length);
      if (k > 0) blit(ctx, frames[k - 1](sq.color), sq.i);
      const frac = x - k;
      if (k < frames.length && frac > 0) {
        clipReveal(ctx, frac, TILE_UNITS);
        blit(ctx, frames[k](sq.color), sq.i);
      }
    },
  };
}

const INK = '#000000';
const square = (b, s, inset = 0) =>
  b.rect(-s + inset, -s + inset, 2 * (s - inset), 2 * (s - inset));

function construction(b, s, rand, overshoot = 7) {
  const j = () => (rand() - 0.5) * 2;
  const o = overshoot;
  b.line(-s - o, -s + j(), s + o * rand(), -s + j());
  b.line(s + j(), -s - o * rand(), s + j(), s + o);
  b.line(s + o, s + j(), -s - o * rand(), s + j());
  b.line(-s + j(), s + o * rand(), -s + j(), -s - o);
}

function sweep(b, s, rand, { step, angle = 0, reach = 8 }) {
  b.clip([-s, -s, s, s]);
  b.push();
  b.rotate(angle);
  const r = s * 1.5;
  for (let y = -r; y <= r; y += step) {
    const jitter = (rand() - 0.5) * step * 0.6;
    b.line(-r - reach, y + jitter, r + reach, y + jitter + step * 0.5);
  }
  b.pop();
  b.noClip();
}

const RECIPES = [
  {
    id: 'pencil',
    label: 'Pencil',
    seed: 11,
    sketch(b, { s, rand }) {
      b.set('2H', INK, 1);
      construction(b, s, rand);
    },
    stages: [
      (b, { s }) => {
        b.hatchStyle('HB', INK, 1.6);
        b.hatch(3, 30, { rand: 0.15 });
        square(b, s);
      },
      (b, { s }) => {
        b.hatchStyle('2B', INK, 1.6);
        b.hatch(3.5, -60, { rand: 0.15 });
        square(b, s);
      },
      (b, { s }) => {
        b.set('2B', INK, 1.8);
        square(b, s);
      },
    ],
  },
  {
    id: 'marker',
    label: 'Marker',
    seed: 23,
    sketch(b, { s, rand }) {
      b.set('HB', INK, 1);
      construction(b, s, rand, 4);
    },
    stages: [
      (b, { s, rand }) => {
        b.set('marker', INK, 3);
        sweep(b, s, rand, { step: 7, angle: 8 });
      },
      (b, { s, rand }) => {
        b.set('marker', INK, 2.5);
        sweep(b, s, rand, { step: 9, angle: 96 });
      },
      (b, { s }) => {
        b.set('pen', INK, 1.6);
        square(b, s);
      },
    ],
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    seed: 37,
    sketch(b, { s, rand }) {
      b.set('2H', INK, 0.8);
      construction(b, s, rand, 3);
    },
    stages: watercolorStages,
  },
  {
    id: 'engraving',
    label: 'Engraving',
    seed: 41,
    sketch(b, { s }) {
      b.set('rotring', INK, 0.5);
      square(b, s);
    },
    stages: [0, 90, 45]
      .map((angle) => (b, { s }) => {
        b.hatchStyle('rotring', INK, 0.7);
        b.hatch(5, angle);
        square(b, s);
      })
      .concat((b, { s }) => {
        b.set('rotring', INK, 1);
        square(b, s);
      }),
  },
  {
    id: 'charcoal',
    label: 'Charcoal',
    seed: 53,
    sketch(b, { s, rand }) {
      b.set('charcoal', INK, 0.5);
      construction(b, s, rand, 5);
    },
    stages: [
      (b, { s }) => {
        b.mass('charcoal', INK, { style: 'scribble', strength: 0.5 });
        square(b, s);
      },
      (b, { s }) => {
        b.mass('charcoal', INK, { style: 'scribble', strength: 1 });
        square(b, s);
      },
      (b, { s }) => {
        b.set('charcoal', INK, 1);
        square(b, s);
      },
    ],
  },
  {
    id: 'spray',
    label: 'Spray',
    seed: 67,
    sketch(b, { s, rand }) {
      b.set('2H', INK, 0.8);
      construction(b, s, rand, 2);
    },
    stages: [
      (b, { s, rand }) => {
        b.set('spray', INK, 1);
        sweep(b, s, rand, { step: 9, reach: 4 });
      },
      (b, { s, rand }) => {
        b.set('spray', INK, 1.2);
        sweep(b, s, rand, { step: 7, angle: 90, reach: 4 });
      },
      (b, { s, rand }) => {
        b.set('spray', INK, 1.4);
        sweep(b, s, rand, { step: 6, angle: 45, reach: 4 });
      },
    ],
  },
  {
    id: 'plotter',
    label: 'Plotter',
    seed: 79,
    sketch(b, { s }) {
      b.set('rotring', INK, 0.4);
      square(b, s);
    },
    stages: [
      (b, { s }) => {
        b.set('rotring', INK, 1);
        square(b, s);
      },
      (b, { s }) => {
        b.hatchStyle('rotring', INK, 0.8);
        b.hatch(3.5, 0, { continuous: true });
        square(b, s);
      },
      (b, { s }) => {
        b.hatchStyle('rotring', INK, 0.8);
        b.hatch(3.5, 90, { continuous: true });
        square(b, s);
      },
    ],
  },
];

export default [solid, outline, ...RECIPES.map(brushStyle)];
