/* eslint-disable no-param-reassign */
export const MAX_CELLS = 1008;

export const RULES = {
  Life: 'B3/S23',
  HighLife: 'B36/S23',
  'Day & Night': 'B3678/S34678',
  Seeds: 'B2/S',
  Diamoeba: 'B35678/S5678',
  Maze: 'B3/S12345',
  Anneal: 'B4678/S35678',
};

const ruleCache = new Map();

export function parseRule(notation) {
  if (ruleCache.has(notation)) return ruleCache.get(notation);
  const [born, survive] = notation.split('/');
  const table = (digits) => {
    const out = new Array(9).fill(false);
    digits
      .slice(1)
      .split('')
      .forEach((d) => {
        out[Number(d)] = true;
      });
    return out;
  };
  const rule = { born: table(born), survive: table(survive) };
  ruleCache.set(notation, rule);
  return rule;
}

export function scatter(sim, density) {
  for (let i = 0; i < sim.cells.length; i += 1) {
    if (Math.random() < density) sim.cells[i] = 1;
  }
}

export function createSim(cols, rows, density) {
  const sim = {
    birthGlow: new Float32Array(cols * rows),
    cells: new Uint8Array(cols * rows),
    cols,
    deathGlow: new Float32Array(cols * rows),
    display: new Uint8Array(cols * rows),
    history: [],
    next: new Uint8Array(cols * rows),
    nextStep: null,
    queue: [],
    rows,
  };
  scatter(sim, density);
  sim.display.set(sim.cells);
  return sim;
}

export function clear(sim) {
  sim.cells.fill(0);
  sim.display.fill(0);
  sim.queue.length = 0;
  sim.history.length = 0;
}

export function paint(sim, index, alive) {
  sim.cells[index] = alive;
  sim.display[index] = alive;
  sim.queue.forEach((entry) => {
    entry.cells[index] = alive;
  });
}

function hash(cells) {
  let h = 7;
  for (let i = 0; i < cells.length; i += 1) {
    h = (h * 31 + cells[i] + 1) % 4294967291;
  }
  return h;
}

export function generation(sim, notation, wrap) {
  const { cells, cols, next, rows } = sim;
  const rule = parseRule(notation);
  const births = [];
  const deaths = [];
  let population = 0;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx !== 0 || dy !== 0) {
            let nx = x + dx;
            let ny = y + dy;
            if (wrap) {
              nx = (nx + cols) % cols;
              ny = (ny + rows) % rows;
            }
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
              n += cells[ny * cols + nx];
            }
          }
        }
      }
      const i = y * cols + x;
      const alive = cells[i] ? rule.survive[n] : rule.born[n];
      next[i] = alive ? 1 : 0;
      if (alive) population += 1;
      if (alive && !cells[i]) births.push(i);
      if (!alive && cells[i]) deaths.push(i);
    }
  }

  sim.cells = next;
  sim.next = cells;

  const key = hash(sim.cells);
  const stuck = sim.history.includes(key);
  sim.history.push(key);
  if (sim.history.length > 4) sim.history.shift();
  return { births, deaths, population, stuck };
}
