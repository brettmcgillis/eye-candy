// The rug as a verlet sheet: a particle grid with stretch, shear and bend
// links, laid on a floor or hung from a rod against a wall. Plain JS and
// deterministic, so the CLI settles exactly the drape the scene shows.
//
// World units are metres. Floor: x across, z along (head at -z), y up.
// Wall: x across, y up (head at the top), z out from the wall.

const GRAVITY = -9.81;
const DT = 1 / 120;
const STATIC_SLIDE = 0.004;

export function clothLayout({ cols, rows }, { fringeLength, rugWidth }) {
  const length = (rugWidth * rows) / cols;
  const across = Math.max(12, Math.min(36, Math.round(rugWidth / 0.05)));
  const spacing = rugWidth / across;
  const along = Math.max(12, Math.round(length / spacing));
  const fringeRows =
    fringeLength > 0.005 ? Math.max(1, Math.round(fringeLength / spacing)) : 0;
  const totalRows = along + fringeRows * 2;
  return {
    across,
    along,
    fringeRows,
    fringeV: fringeRows / totalRows,
    length,
    nx: across + 1,
    ny: totalRows + 1,
    spacing: length / along,
    spacingX: spacing,
    totalLength: length + fringeRows * 2 * (length / along),
    width: rugWidth,
  };
}

export default function createRugCloth(layout, options) {
  const { nx, ny, fringeRows } = layout;
  const spacingY = layout.spacing;
  const count = nx * ny;
  const pos = new Float32Array(count * 3);
  const prev = new Float32Array(count * 3);
  const invMass = new Float32Array(count).fill(1);
  const floorLift = new Float32Array(count);
  const maxLinks = count * 8;
  const linkA = new Int32Array(maxLinks);
  const linkB = new Int32Array(maxLinks);
  const linkRest = new Float32Array(maxLinks);
  const linkStiff = new Float32Array(maxLinks);
  let linkCount = 0;
  const isFringe = (j) => j < fringeRows || j > ny - 1 - fringeRows;

  const link = (a, b, stiff) => {
    const dx = pos[a * 3] - pos[b * 3];
    const dy = pos[a * 3 + 1] - pos[b * 3 + 1];
    const dz = pos[a * 3 + 2] - pos[b * 3 + 2];
    linkA[linkCount] = a;
    linkB[linkCount] = b;
    linkRest[linkCount] = Math.sqrt(dx * dx + dy * dy + dz * dz);
    linkStiff[linkCount] = stiff;
    linkCount += 1;
  };

  let { mode } = options;
  let state = { ...options };
  let grabbed = -1;
  const grabTarget = [0, 0, 0];
  let time = 0;

  function restPosition(i, j) {
    const x = (i / (nx - 1) - 0.5) * layout.width;
    const along = (j - fringeRows) * spacingY;
    if (mode === 'wall') {
      return [x, state.rodHeight - along, state.wallGap];
    }
    return [x, state.floorGap, along - layout.length / 2];
  }

  function pinWall() {
    const top = fringeRows;
    const pins = new Set();
    if (state.hangStyle === 'corners') {
      pins.add(0);
      pins.add(nx - 1);
    } else if (state.hangStyle === 'clips') {
      const n = Math.max(2, Math.round(state.clipCount));
      for (let c = 0; c < n; c += 1)
        pins.add(Math.round((c * (nx - 1)) / (n - 1)));
    } else {
      for (let i = 0; i < nx; i += 1) pins.add(i);
    }
    for (let j = 0; j <= top; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const k = j * nx + i;
        if (j < top || pins.has(i)) invMass[k] = 0;
      }
    }
  }

  // Ripples ride across the rug and one corner may lie folded back over it.
  // Ripples ride on a per-particle floor offset that travels with the rug,
  // so a kicked-up fold holds its shape; a folded corner is laid over after
  // the links are made.
  function rumpleFloor() {
    const r = state.rumple;
    const phase = state.seed * 1.618;
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const u = i / (nx - 1);
        const v = j / (ny - 1);
        const ridge = Math.sin(
          v * 7.3 + phase + Math.sin(u * 3.1 + phase) * 0.8
        );
        const fade = Math.sin(u * Math.PI) ** 0.5;
        const k = j * nx + i;
        floorLift[k] = Math.max(0, ridge) ** 3 * fade * r * 0.06;
        pos[k * 3 + 1] += floorLift[k];
      }
    }
  }

  function flipCorner() {
    const flip = state.cornerFlip;
    if (flip <= 0) return;
    const reach = flip * 0.55;
    const cornerI = state.seed % 2 ? nx - 1 : 0;
    const signX = cornerI === 0 ? 1 : -1;
    const ox = pos[(fringeRows * nx + cornerI) * 3];
    const oz = pos[(fringeRows * nx + cornerI) * 3 + 2];
    const nxD = signX * Math.SQRT1_2;
    const nzD = Math.SQRT1_2;
    const line = reach * Math.min(layout.width, layout.length);
    for (let k = 0; k < count; k += 1) {
      const d = (pos[k * 3] - ox) * nxD + (pos[k * 3 + 2] - oz) * nzD;
      if (d < line) {
        const over = line - d;
        pos[k * 3] += 2 * over * nxD;
        pos[k * 3 + 2] += 2 * over * nzD;
        const roll = 0.028 * Math.exp(-over / 0.04);
        pos[k * 3 + 1] = state.floorGap * 3 + roll;
        floorLift[k] = state.floorGap * 2.2 + roll;
      } else if (d < line + 0.05) {
        floorLift[k] = 0.024 * (1 - (d - line) / 0.05);
        pos[k * 3 + 1] = state.floorGap + floorLift[k];
      }
    }
  }

  function collide() {
    const friction = 0.8;
    for (let k = 0; k < count; k += 1) {
      const o = k * 3;
      if (mode === 'wall') {
        const wall = state.wallGap * 0.5;
        if (pos[o + 2] < wall) {
          pos[o + 2] = wall;
          prev[o + 1] += (pos[o + 1] - prev[o + 1]) * 0.3;
        }
      } else {
        const floor = state.floorGap + floorLift[k];
        if (pos[o + 1] <= floor + 0.0005) {
          pos[o + 1] = floor;
          // Wool on wood holds until it is properly dragged.
          const slide = Math.hypot(pos[o] - prev[o], pos[o + 2] - prev[o + 2]);
          if (k !== grabbed && slide < STATIC_SLIDE) {
            pos[o] = prev[o];
            pos[o + 2] = prev[o + 2];
          } else {
            prev[o] += (pos[o] - prev[o]) * friction;
            prev[o + 2] += (pos[o + 2] - prev[o + 2]) * friction;
          }
        }
      }
    }
  }

  // Builds the sheet at rest, then the links from those rest lengths; the
  // floor's rumple and corner flip are displacements the solver then fights.
  function reset(next = {}) {
    state = { ...state, ...next };
    mode = state.mode;
    linkCount = 0;
    invMass.fill(1);
    floorLift.fill(0);
    grabbed = -1;
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const k = j * nx + i;
        const [x, y, z] = restPosition(i, j);
        pos.set([x, y, z], k * 3);
      }
    }
    if (mode !== 'wall') rumpleFloor();
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const k = j * nx + i;
        const fringe = isFringe(j);
        if (i + 1 < nx) link(k, k + 1, fringe ? 0.05 : 1);
        if (j + 1 < ny) link(k, k + nx, 1);
        if (!fringe && i + 1 < nx && j + 1 < ny && !isFringe(j + 1)) {
          link(k, k + nx + 1, 0.5);
          link(k + 1, k + nx, 0.5);
        }
        if (i + 2 < nx && !fringe) link(k, k + 2, state.stiffness);
        if (j + 2 < ny)
          link(
            k,
            k + 2 * nx,
            isFringe(j + 2) || fringe ? 0.04 : state.stiffness
          );
      }
    }
    if (mode === 'wall') pinWall();
    else flipCorner();
    prev.set(pos);
  }

  function step(dt) {
    time += dt;
    const damping = 0.985;
    const g = GRAVITY * dt * dt;
    const wind = mode === 'wall' ? state.wind : state.wind * 0.15;
    for (let k = 0; k < count; k += 1) {
      if (invMass[k] === 0) continue; // eslint-disable-line no-continue
      const o = k * 3;
      const x = pos[o];
      const y = pos[o + 1];
      const z = pos[o + 2];
      const gust =
        wind *
        (0.55 + 0.45 * Math.sin(time * 1.3 + x * 2.1 + y * 1.3)) *
        (0.6 + 0.4 * Math.sin(time * 0.37 + z * 3.0));
      pos[o] += (x - prev[o]) * damping + gust * 0.3 * dt * dt;
      pos[o + 1] += (y - prev[o + 1]) * damping + g;
      pos[o + 2] +=
        (z - prev[o + 2]) * damping + (mode === 'wall' ? gust : 0) * dt * dt;
      prev[o] = x;
      prev[o + 1] = y;
      prev[o + 2] = z;
    }

    for (let it = 0; it < state.iterations; it += 1) {
      for (let l = 0; l < linkCount; l += 1) {
        const a = linkA[l];
        const b = linkB[l];
        const wa = invMass[a];
        const wb = invMass[b];
        const w = wa + wb;
        if (w === 0) continue; // eslint-disable-line no-continue
        const oa = a * 3;
        const ob = b * 3;
        const dx = pos[ob] - pos[oa];
        const dy = pos[ob + 1] - pos[oa + 1];
        const dz = pos[ob + 2] - pos[oa + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const rest = linkRest[l];
        const stiff = linkStiff[l];
        // Fringe cords are slack under compression; only the pile resists.
        if (stiff <= 0.05 && dist < rest) continue; // eslint-disable-line no-continue
        const diff = ((dist - rest) / dist) * stiff;
        const sa = (diff * wa) / w;
        const sb = (diff * wb) / w;
        pos[oa] += dx * sa;
        pos[oa + 1] += dy * sa;
        pos[oa + 2] += dz * sa;
        pos[ob] -= dx * sb;
        pos[ob + 1] -= dy * sb;
        pos[ob + 2] -= dz * sb;
      }
      if (grabbed >= 0) pos.set(grabTarget, grabbed * 3);
      collide();
    }
  }

  reset();

  return {
    count,
    layout,
    nx,
    ny,
    positions: pos,

    reset,

    set(next) {
      state = { ...state, ...next };
    },

    step(delta, substeps = 2) {
      const dt = Math.min(delta, 1 / 30) / substeps;
      for (let s = 0; s < substeps; s += 1) step(dt);
    },

    settle(steps = 360) {
      for (let s = 0; s < steps; s += 1) step(DT);
    },

    grab(index, target) {
      grabbed = index;
      grabTarget.splice(0, 3, ...target);
    },

    release() {
      grabbed = -1;
    },

    nearest(point) {
      let best = -1;
      let bestD = Infinity;
      for (let k = 0; k < count; k += 1) {
        const d = Math.hypot(
          pos[k * 3] - point[0],
          pos[k * 3 + 1] - point[1],
          pos[k * 3 + 2] - point[2]
        );
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      }
      return best;
    },
  };
}
