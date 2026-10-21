// GPGL for the Curio's pen passes: ETX-ended ASCII commands, 1/20 mm
// units, y (the bed's travel, down the paper) before x. Protocol facts come
// from inkscape-silhouette (GPLv2); none of its code is used here.

export const ESC = 0x1b;
export const ETX = 0x03;
export const CURIO = {
  name: 'Silhouette Curio',
  productId: 0x112c,
  vendorId: 0x0b4d,
};
export const CURIO_WIDTH_MM = 215.9;
export const SU_PER_MM = 20;

export const INITIALIZE = Uint8Array.of(ESC, 0x04);
export const STATUS = Uint8Array.of(ESC, 0x05);
export const VERSION = 'FG';
export const STATES = { 0: 'ready', 1: 'moving', 2: 'unloaded' };

const su = (mm) => Math.round(mm * SU_PER_MM);
const clampInt = (value, lo, hi) =>
  Math.min(hi, Math.max(lo, Math.round(value)));

export const PEN_DEFAULTS = { force: 10, speed: 5 };

// Pen setup for one carriage: select it, its speed (1–10) and force
// (1–33), no blade offset, no track enhancing, portrait, the work area,
// and no lift or corner sharpening between strokes.
export function setupCommands({ force, holder, paper, speed }) {
  return [
    `J${holder === 2 ? 2 : 1}`,
    `!${clampInt(speed ?? PEN_DEFAULTS.speed, 1, 10)}`,
    `FX${clampInt(force ?? PEN_DEFAULTS.force, 1, 33)}`,
    'FC0',
    'FY1',
    'FN0',
    'TB50,0',
    'FE0,0',
    '\\0,0',
    `Z${su(paper.heightMm)},${su(Math.min(paper.widthMm, CURIO_WIDTH_MM))}`,
    'L0',
    'FE0,0',
    'FF0,0,0',
  ];
}

const inside = ([x, y], paper) =>
  x >= 0 && y >= 0 && x <= paper.widthMm && y <= paper.heightMm;

// Each run: move to its start with the pen up, draw the rest; a closed run
// draws back to its start. Points off the paper are travelled to, never
// drawn.
export function strokeCommands(runs, paper) {
  const commands = [];
  runs.forEach(({ closed, points }) => {
    if (points.length < 2) return;
    const path = closed ? [...points, points[0]] : points;
    let last = null;
    path.forEach((point, i) => {
      const [x, y] = point;
      const at = `${su(y)},${su(x)}`;
      if (at === last) return;
      const draw = i > 0 && inside(point, paper) && inside(path[i - 1], paper);
      commands.push(`${draw ? 'D' : 'M'}${at}`);
      last = at;
    });
  });
  return commands;
}

// Back to the origin with the pen up. Not `SO0`, which would make the
// current point the origin and shift every later pass.
export const parkCommands = () => ['M0,0'];

export function passCommands(pass, settings) {
  return [
    ...setupCommands(settings),
    ...strokeCommands(pass.runs, settings.paper),
    ...parkCommands(),
  ];
}

// Commands as bytes, in pieces of at most `size` that each end on an ETX,
// so the cutter can be waited on between them.
export function encode(commands, size = 1024) {
  const pieces = [];
  let current = '';
  commands.forEach((command) => {
    const next = `${command}\x03`;
    if (current && current.length + next.length > size) {
      pieces.push(current);
      current = '';
    }
    current += next;
  });
  if (current) pieces.push(current);
  return pieces.map((piece) => Uint8Array.from(piece, (c) => c.charCodeAt(0)));
}

// What a status reply means: '0', '1' or '2' before the ETX.
export function decodeStatus(bytes) {
  if (!bytes?.length) return 'none';
  const text = String.fromCharCode(
    ...bytes.filter((byte) => byte !== ETX)
  ).trim();
  return STATES[text] ?? `unknown:${text}`;
}

// Hardware checks before a real plot. `travel` moves the pen up round the
// paper's corners and back, drawing nothing; `orientation` draws an L at
// the paper's top-left (long arm along the top) with an arrow pointing
// right, and a small square at the bottom-right, so a rotated or mirrored
// setup shows at a glance.
export function testRuns(kind, paper, marginMm = 10) {
  const m = marginMm;
  const w = paper.widthMm;
  const h = paper.heightMm;
  if (kind === 'travel') {
    return [
      [m, m],
      [w - m, m],
      [w - m, h - m],
      [m, h - m],
      [m, m],
    ];
  }
  return [
    {
      closed: false,
      points: [
        [m + 30, m],
        [m, m],
        [m, m + 15],
      ],
    },
    {
      closed: false,
      points: [
        [m + 8, m + 6],
        [m + 22, m + 6],
      ],
    },
    {
      closed: false,
      points: [
        [m + 18, m + 3],
        [m + 22, m + 6],
        [m + 18, m + 9],
      ],
    },
    {
      closed: true,
      points: [
        [w - m - 10, h - m - 10],
        [w - m, h - m - 10],
        [w - m, h - m],
        [w - m - 10, h - m],
      ],
    },
  ];
}

export function testCommands(kind, settings) {
  const runs = testRuns(kind, settings.paper);
  if (kind === 'travel') {
    return [
      ...setupCommands(settings),
      ...runs.map(([x, y]) => `M${su(y)},${su(x)}`),
      ...parkCommands(),
    ];
  }
  return [
    ...setupCommands(settings),
    ...strokeCommands(runs, settings.paper),
    ...parkCommands(),
  ];
}
