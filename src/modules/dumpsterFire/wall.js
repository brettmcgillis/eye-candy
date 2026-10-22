import { createRng } from '@modules/flora';

import {
  BLOCK_GAP,
  BLOCK_SIZE,
  BLOCK_VARIANTS,
  FLOOR_COLLIDER_HALF_EXTENTS,
  FLOOR_COLLIDER_POSITION,
  MAX_WALL_COLUMNS,
  MAX_WALL_ROWS,
  SCENE_ROOT_POSITION,
  WALL_EDGE_MARGIN,
} from './constants';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Smooth seeded noise along one axis: lattice values every `scale` metres,
// cosine-blended.
function valueNoise1(rng, scale) {
  const lattice = Array.from({ length: 64 }, () => rng());
  return (x) => {
    const t = x / scale + 32;
    const i = Math.floor(t);
    const f = t - i;
    const a = lattice[((i % 64) + 64) % 64];
    const b = lattice[(((i + 1) % 64) + 64) % 64];
    return a + (b - a) * ((1 - Math.cos(f * Math.PI)) / 2);
  };
}

function valueNoise2(rng, scale) {
  const lattice = Array.from({ length: 32 * 32 }, () => rng());
  const at = (i, j) =>
    lattice[(((j % 32) + 32) % 32) * 32 + (((i % 32) + 32) % 32)];
  const blend = (f) => (1 - Math.cos(f * Math.PI)) / 2;
  return (x, y) => {
    const u = x / scale + 16;
    const v = y / scale + 16;
    const i = Math.floor(u);
    const j = Math.floor(v);
    const fu = blend(u - i);
    const fv = blend(v - j);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * fu;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * fu;
    return a + (b - a) * fv;
  };
}

// The running-bond courses the scene stacks: full rows alternate with rows
// one block shorter, centred on the floor, against its back edge. Local to
// the wall group, bottom course on y = 0.
function courses({ brickWallHeight, brickWallLength }) {
  const [bx, by, bz] = BLOCK_SIZE;
  const maxWallLength =
    FLOOR_COLLIDER_HALF_EXTENTS[0] * 2 - WALL_EDGE_MARGIN * 2;
  const length = clamp(brickWallLength, bx, maxWallLength);
  const columnSpan = bx + BLOCK_GAP[0];
  const rowSpan = by + BLOCK_GAP[1];
  const fullColumns = clamp(
    Math.floor((length + BLOCK_GAP[0]) / columnSpan),
    1,
    MAX_WALL_COLUMNS
  );
  const rows = clamp(
    Math.floor((brickWallHeight + BLOCK_GAP[1]) / rowSpan),
    1,
    MAX_WALL_ROWS
  );
  const centerX = FLOOR_COLLIDER_POSITION[0] - SCENE_ROOT_POSITION[0];
  const backZ =
    FLOOR_COLLIDER_POSITION[2] -
    SCENE_ROOT_POSITION[2] -
    FLOOR_COLLIDER_HALF_EXTENTS[2] +
    WALL_EDGE_MARGIN +
    bz / 2;
  const blocks = [];
  for (let row = 0; row < rows; row += 1) {
    const staggered = row % 2 === 1 && fullColumns > 1;
    const columns = staggered ? fullColumns - 1 : fullColumns;
    const rowLength = columns * bx + Math.max(columns - 1, 0) * BLOCK_GAP[0];
    const startX = centerX - rowLength / 2 + bx / 2;
    for (let column = 0; column < columns; column += 1) {
      blocks.push({
        column,
        key: `${row}-${column}`,
        position: [startX + column * columnSpan, by / 2 + row * rowSpan, backZ],
        row,
        variant: (row * 3 + column) % BLOCK_VARIANTS,
      });
    }
  }
  return { blocks, rows };
}

// Whether `block` still has a block under it to stand on.
function supported(block, standing) {
  if (block.row === 0) return true;
  const [x] = block.position;
  return standing.some(
    (other) =>
      other.row === block.row - 1 &&
      Math.abs(other.position[0] - x) < BLOCK_SIZE[0]
  );
}

// The scene's cinderblock wall, cut down by the generation: `brickWallCrumble`
// drops a ragged run off the top, `brickWallHoles` knocks out patches, and
// every block left with nothing under it falls. `brickWallRubble` of what
// came down lies at the foot of the wall. Positions are local to the wall
// group (`brickWallPosition`), bottom course on its y = 0; each block has
// `variant` (0–3, the cinderblock GLB) and `rubble`.
export default function layoutWall(config) {
  if (!config.brickWallEnabled) return [];
  const { blocks, rows } = courses(config);
  const rng = createRng(`wall:${config.wallSeed}`);
  const crumble = valueNoise1(rng, 2.4);
  const holes = valueNoise2(rng, 1.6);
  const crumbleRows = config.brickWallCrumble * rows * 0.7;

  let standing = blocks.filter((block) => {
    const [x, y] = block.position;
    const top = rows - crumbleRows * crumble(x);
    if (block.row >= Math.round(top)) return false;
    if (block.row === 0) return true;
    return holes(x, y) >= config.brickWallHoles;
  });
  let changed = true;
  while (changed) {
    const next = [...standing]
      .sort((a, b) => a.row - b.row)
      .reduce((kept, block) => {
        if (supported(block, kept)) kept.push(block);
        return kept;
      }, []);
    changed = next.length !== standing.length;
    standing = next;
  }
  const fallen = blocks.filter((block) => !standing.includes(block));

  const [bx, by, bz] = BLOCK_SIZE;
  const backZ = blocks[0]?.position[2] ?? 0;
  const pile = [];
  fallen.forEach((block) => {
    if (rng() >= config.brickWallRubble) return;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const x = block.position[0] + (rng() - 0.5) * 1.6;
      const z = backZ + bz + rng() * (0.6 + block.row * 0.18);
      const yaw = (rng() - 0.5) * Math.PI;
      const clear = pile.every(
        (other) =>
          Math.hypot(other.position[0] - x, other.position[2] - z) > bx * 0.75
      );
      if (clear) {
        pile.push({
          ...block,
          key: `rubble-${block.key}`,
          position: [x, by / 2, z],
          rotation: [0, yaw, 0],
          rubble: true,
        });
        break;
      }
    }
  });

  return [
    ...standing.map((block) => ({
      ...block,
      rotation: [0, 0, 0],
      rubble: false,
    })),
    ...pile,
  ];
}
