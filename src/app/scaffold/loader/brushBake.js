import { mulberry32 } from '@utils/noise2d';

import { SQ } from './primitives';

export const TILE = 160;
export const SIDE = 96;
export const TILE_UNITS = (TILE * SQ) / SIDE;
const COLS = 4;
const ROWS = 3;
const TILES = 11;
const WIDTH = COLS * TILE;
const HEIGHT = ROWS * TILE;

let brushModule;
let bakeCanvas;
let queue = Promise.resolve();
const bakes = new Map();

function loadBrush() {
  brushModule ??= import('p5.brush/standalone');
  return brushModule;
}

export function tileOrigin(i) {
  return [(i % COLS) * TILE, Math.floor(i / COLS) * TILE];
}

function resetBrush(brush) {
  brush.noField();
  brush.noFill();
  brush.noWash();
  brush.noHatch();
  brush.noMass();
  brush.noStroke();
  brush.noClip();
}

function toMask(source) {
  const mask = document.createElement('canvas');
  mask.width = WIDTH;
  mask.height = HEIGHT;
  const ctx = mask.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, WIDTH, HEIGHT);
  const px = image.data;
  for (let p = 0; p < px.length; p += 4) {
    const lum = 0.2126 * px[p] + 0.7152 * px[p + 1] + 0.0722 * px[p + 2];
    px[p + 3] = 255 - lum;
    px[p] = 0;
    px[p + 1] = 0;
    px[p + 2] = 0;
  }
  ctx.putImageData(image, 0, 0);
  return mask;
}

function paintPasses(brush, passes, seed) {
  brush.load(bakeCanvas);
  brush.angleMode(brush.DEGREES);
  brush.clear('#ffffff');
  brush.seed(seed);
  brush.noiseSeed(seed);
  return passes.map((pass) => {
    for (let i = 0; i < TILES; i += 1) {
      const [x, y] = tileOrigin(i);
      resetBrush(brush);
      brush.push();
      try {
        brush.translate(x + TILE / 2 - WIDTH / 2, y + TILE / 2 - HEIGHT / 2);
        pass(brush, {
          s: SIDE / 2,
          i,
          rand: mulberry32(seed * 131 + i * 977),
        });
      } finally {
        brush.pop();
      }
    }
    resetBrush(brush);
    brush.render();
    return toMask(bakeCanvas);
  });
}

async function bake(recipe) {
  const brush = await loadBrush();
  bakeCanvas ??= Object.assign(document.createElement('canvas'), {
    width: WIDTH,
    height: HEIGHT,
  });
  const [sketch] = paintPasses(brush, [recipe.sketch], recipe.seed);
  const ink = paintPasses(brush, recipe.stages, recipe.seed + 1);
  return { sketch, ink };
}

function tinted(mask) {
  const byColor = new Map();
  return (color) => {
    let canvas = byColor.get(color);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      byColor.set(color, canvas);
    }
    return canvas;
  };
}

// Serialized: p5.brush standalone has one active target per page.
export function bakeRecipe(recipe) {
  let entry = bakes.get(recipe.id);
  if (!entry) {
    entry = { ready: null, promise: null, error: null };
    const run = queue.then(() => bake(recipe));
    queue = run.catch(() => {});
    entry.promise = run.then(
      (masks) => {
        entry.ready = {
          masks,
          sketch: tinted(masks.sketch),
          ink: masks.ink.map(tinted),
        };
        return entry.ready;
      },
      (error) => {
        entry.error = error;
        // eslint-disable-next-line no-console
        console.warn(`loader brush bake "${recipe.id}" failed`, error);
      }
    );
    bakes.set(recipe.id, entry);
  }
  return entry;
}
