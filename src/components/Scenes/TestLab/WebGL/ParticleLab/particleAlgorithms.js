// Particle cloud algorithms used by ParticleLab.

const normalizeVec3 = (v) => {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
};

const crossVec3 = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const rotateYawPitch = (dir, yaw, pitch) => {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = dir[0] * cosY - dir[2] * sinY;
  const z1 = dir[0] * sinY + dir[2] * cosY;

  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const y2 = dir[1] * cosP - z1 * sinP;
  const z2 = dir[1] * sinP + z1 * cosP;

  return normalizeVec3([x1, y2, z2]);
};

const makeSeededRandom = (seedValue) => {
  let seed = Math.floor(seedValue);
  if (!Number.isFinite(seed) || seed <= 0) seed = 1;
  seed %= 4294967296;

  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
};

// Attractor definitions for Gravity Attractors sim
// Exported so the scene can clone these as the initial mutable state.
export const INITIAL_ATTRACTORS = [
  { position: [-1, 0, 0], direction: [0, 1, 0] },
  { position: [1, 0, -0.5], direction: [0, 1, 0] },
  { position: [0, 0.5, 1], direction: normalizeVec3([1, 0, -0.5]) },
];

const shuffledBranchTokens = (rand) => {
  const tokens = ['+', '-', '&', '^'];
  for (let i = tokens.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = tokens[i];
    tokens[i] = tokens[j];
    tokens[j] = tmp;
  }
  return tokens;
};

const generateVascularTree = (p, positions, pointsCount) => {
  const rand = makeSeededRandom(p.seed);
  const iterations = Math.max(1, Math.floor(p.iterations));
  const angle = (p.angleDeg * Math.PI) / 180;
  const maxSymbols = Math.max(pointsCount * 2, 60000);
  const { step: initialStep } = p;

  let sentence = 'X';
  for (let i = 0; i < iterations; i += 1) {
    let next = '';
    for (let j = 0; j < sentence.length; j += 1) {
      const ch = sentence.charAt(j);
      if (ch === 'X') {
        const tokens = shuffledBranchTokens(rand);
        if (rand() < p.forkChance) {
          next += `F[${tokens[0]}X][${tokens[1]}X][${tokens[2]}X][${tokens[3]}X]X`;
        } else {
          next += `F[${tokens[0]}X][${tokens[1]}X]X`;
        }
      } else if (ch === 'F') {
        next += rand() < p.stretch ? 'FF' : 'F';
      } else {
        next += ch;
      }

      if (next.length >= maxSymbols) break;
    }

    sentence = next;
    if (sentence.length >= maxSymbols) break;
  }

  let segmentIndex = 0;

  const pushSegmentPoints = (from, to, currentStep) => {
    const segmentDir = normalizeVec3([
      to[0] - from[0],
      to[1] - from[1],
      to[2] - from[2],
    ]);
    const up = Math.abs(segmentDir[1]) < 0.92 ? [0, 1, 0] : [1, 0, 0];
    const side = normalizeVec3(crossVec3(segmentDir, up));
    const binormal = normalizeVec3(crossVec3(segmentDir, side));
    const samples = Math.max(2, Math.floor(6 + currentStep * 12));

    for (let i = 0; i < samples; i += 1) {
      if (positions.length >= pointsCount * 3) return;
      const t = i / (samples - 1);
      const lx = from[0] + (to[0] - from[0]) * t;
      const ly = from[1] + (to[1] - from[1]) * t;
      const lz = from[2] + (to[2] - from[2]) * t;
      const wobble =
        Math.sin(segmentIndex * 0.37 + t * 7.2) * p.jitter * currentStep;
      const ripple =
        Math.cos(segmentIndex * 0.21 + t * 5.4) * p.jitter * currentStep * 0.7;

      positions.push(
        lx + side[0] * wobble + binormal[0] * ripple,
        ly + side[1] * wobble + binormal[1] * ripple,
        lz + side[2] * wobble + binormal[2] * ripple
      );
    }
    segmentIndex += 1;
  };

  const growFromTrunk = (startDir, targetPoints, trunkSeed) => {
    const trunkRand = makeSeededRandom(trunkSeed);
    const stack = [];
    const startLen = positions.length;
    const maxLen = targetPoints * 3;

    let pos = [0, 0, 0];
    let dir = normalizeVec3(startDir);
    let step = initialStep;

    for (let i = 0; i < sentence.length; i += 1) {
      const ch = sentence.charAt(i);
      if (positions.length - startLen >= maxLen) break;
      if (positions.length >= pointsCount * 3) break;

      if (ch === 'F' || ch === 'X') {
        const veinPulse = 1 + Math.sin(segmentIndex * 0.33) * 0.18;
        const currentStep = step * veinPulse;
        const nextPos = [
          pos[0] + dir[0] * currentStep,
          pos[1] + dir[1] * currentStep,
          pos[2] + dir[2] * currentStep,
        ];
        pushSegmentPoints(pos, nextPos, currentStep);
        pos = nextPos;
        step = Math.max(0.02, step * p.taper);
      } else if (ch === '+') {
        dir = rotateYawPitch(
          dir,
          angle * (0.7 + trunkRand() * 0.8),
          p.curl * 0.25
        );
      } else if (ch === '-') {
        dir = rotateYawPitch(
          dir,
          -angle * (0.7 + trunkRand() * 0.8),
          -p.curl * 0.25
        );
      } else if (ch === '&') {
        dir = rotateYawPitch(
          dir,
          p.curl * 0.3,
          angle * (0.65 + trunkRand() * 0.7)
        );
      } else if (ch === '^') {
        dir = rotateYawPitch(
          dir,
          -p.curl * 0.3,
          -angle * (0.65 + trunkRand() * 0.7)
        );
      } else if (ch === '[') {
        stack.push({ pos: [...pos], dir: [...dir], step });
        step = Math.max(0.02, step * p.branchShrink);
      } else if (ch === ']') {
        const state = stack.pop();
        if (state) {
          pos = state.pos;
          dir = state.dir;
          step = state.step;
        }
      }
    }
  };

  const upCount = Math.floor(pointsCount * 0.5);
  const downCount = pointsCount - upCount;
  const startYaw = (rand() - 0.5) * Math.PI * 2;
  const startPitch = (rand() - 0.5) * angle * 0.45;
  const upDir = rotateYawPitch([0, 1, 0], startYaw, startPitch);
  const downDir = rotateYawPitch(
    [0, -1, 0],
    startYaw + Math.PI * 0.33,
    -startPitch
  );

  growFromTrunk(upDir, upCount, p.seed + 101);
  growFromTrunk(downDir, downCount, p.seed + 2027);

  if (positions.length >= 3 && positions.length < pointsCount * 3) {
    const existing = positions.length;
    for (let i = existing; i < pointsCount * 3; i += 3) {
      const idx = i % existing;
      positions.push(positions[idx], positions[idx + 1], positions[idx + 2]);
    }
  }
};

const algorithms = {
  'Aizawa Sphere': {
    type: 'ode',
    defaults: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 0.1, dt: 0.01 },
    ranges: {
      a: [0.1, 2.0, 0.01],
      b: [0.1, 2.0, 0.01],
      c: [0.1, 2.0, 0.01],
      d: [1.0, 5.0, 0.01],
      e: [0.1, 1.0, 0.01],
      f: [0.0, 0.5, 0.01],
      dt: [0.001, 0.05, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < pointsCount; i += 1) {
        const dx = (z - p.b) * x - p.d * y;
        const dy = p.d * x + (z - p.b) * y;
        const dz =
          p.c +
          p.a * z -
          z ** 3 / 3 -
          (x * x + y * y) * (1 + p.e * z) +
          p.f * z * x ** 3;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.1;
          z = 0.1;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Thomas Labyrinth': {
    type: 'ode',
    defaults: { b: 0.19, dt: 0.05 },
    ranges: { b: [0.0, 0.5, 0.001], dt: [0.01, 0.1, 0.001] },
    generate: (p, positions, pointsCount) => {
      let x = 1.0;
      let y = 0.0;
      let z = 0.0;
      for (let i = 0; i < pointsCount; i += 1) {
        const dx = Math.sin(y) - p.b * x;
        const dy = Math.sin(z) - p.b * y;
        const dz = Math.sin(x) - p.b * z;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 1;
          y = 0;
          z = 0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Nose-Hoover Braid': {
    type: 'ode',
    defaults: { a: 0.2, dt: 0.01 },
    ranges: { a: [0.1, 5.0, 0.1], dt: [0.001, 0.05, 0.001] },
    generate: (p, positions, pointsCount) => {
      let x = 1.0;
      let y = 0.0;
      let z = 0.0;
      for (let i = 0; i < pointsCount; i += 1) {
        const dx = y;
        const dy = -x + y * z;
        const dz = p.a - y * y;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 1.0;
          y = 0.0;
          z = 0.0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Four-Wing Butterfly': {
    type: 'ode',
    defaults: { a: 0.2, b: 0.01, c: -0.4, dt: 0.05 },
    ranges: {
      a: [0.1, 0.5, 0.01],
      b: [-0.1, 0.1, 0.001],
      c: [-1.0, 0.0, 0.01],
      dt: [0.01, 0.1, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 1.0;
      let y = 1.0;
      let z = 1.0;
      for (let i = 0; i < pointsCount; i += 1) {
        const dx = p.a * x + y * z;
        const dy = p.b * x + p.c * y - x * z;
        const dz = -z - x * y;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 1.0;
          y = 1.0;
          z = 1.0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Clifford Cloud': {
    type: 'map',
    defaults: { a: 1.5, b: -1.8, c: 1.6, d: 0.9 },
    ranges: {
      a: [-3.0, 3.0, 0.01],
      b: [-3.0, 3.0, 0.01],
      c: [-3.0, 3.0, 0.01],
      d: [-3.0, 3.0, 0.01],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < pointsCount; i += 1) {
        const nx = Math.sin(p.a * y) + p.c * Math.cos(p.a * x);
        const ny = Math.sin(p.b * x) + p.d * Math.cos(p.b * y);
        const nz = Math.sin(p.c * z) + p.a * Math.cos(p.d * x);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Hopalong Nebula': {
    type: 'map',
    defaults: { a: 2.01, b: -2.53, c: 1.61, d: -0.33, e: 2.0, f: -1.0 },
    ranges: {
      a: [-3, 3, 0.01],
      b: [-3, 3, 0.01],
      c: [-3, 3, 0.01],
      d: [-3, 3, 0.01],
      e: [-3, 3, 0.01],
      f: [-3, 3, 0.01],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < pointsCount; i += 1) {
        const nx = Math.sin(p.a * y) - Math.cos(p.b * x) + Math.sin(p.e * z);
        const ny = Math.sin(p.c * x) - Math.cos(p.d * y) + Math.sin(p.f * z);
        const nz = Math.sin(p.e * x) - Math.cos(p.f * y) + Math.sin(p.a * z);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Quantum Lotus': {
    type: 'map',
    defaults: { a: 1.2, b: 0.8, c: -1.5, d: 2.0, e: 0.9, f: 1.5 },
    ranges: {
      a: [-3, 3, 0.01],
      b: [-3, 3, 0.01],
      c: [-3, 3, 0.01],
      d: [-3, 3, 0.01],
      e: [0.1, 1.5, 0.01],
      f: [-3, 3, 0.01],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < pointsCount; i += 1) {
        const r = Math.sqrt(x * x + y * y);
        const nx = y * Math.cos(p.a) - x * Math.sin(p.b + r) - z;
        const ny = x * Math.cos(p.c) + y * Math.sin(p.d + r) - z;
        const nz = z * p.e + Math.sin(r * p.f);
        x = nx;
        y = ny;
        z = nz;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.1;
          z = 0.1;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Stellar Web': {
    type: 'map',
    defaults: { a: 2.1, b: -1.5, c: 1.8, d: 2.4, e: -1.2, f: 1.1 },
    ranges: {
      a: [-3, 3, 0.01],
      b: [-3, 3, 0.01],
      c: [-3, 3, 0.01],
      d: [-3, 3, 0.01],
      e: [-3, 3, 0.01],
      f: [-3, 3, 0.01],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < pointsCount; i += 1) {
        const nx = p.a * Math.sin(y) - Math.cos(p.b * z) * x;
        const ny = p.c * Math.sin(z) - Math.cos(p.d * x) * y;
        const nz = p.e * Math.sin(x) - Math.cos(p.f * y) * z;
        x = nx;
        y = ny;
        z = nz;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.1;
          z = 0.1;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Abyssal Jellyfish': {
    type: 'map',
    defaults: { a: -1.72, b: 1.16, c: -1.35, d: 0.66 },
    ranges: {
      a: [-3, 3, 0.01],
      b: [-3, 3, 0.01],
      c: [-3, 3, 0.01],
      d: [-10, 10, 0.01],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < pointsCount; i += 1) {
        const nx = Math.sin(p.a * y) + Math.cos(p.b * z) - Math.sin(p.c * x);
        const ny = Math.sin(p.a * z) + Math.cos(p.b * x) - Math.sin(p.c * y);
        const nz = Math.sin(p.a * x) + Math.cos(p.b * y) - Math.sin(p.d * z);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Ethereal Loom': {
    type: 'map',
    defaults: { a: 2.1, b: -1.2, c: 1.5 },
    ranges: { a: [-3, 3, 0.01], b: [-3, 3, 0.01], c: [-3, 3, 0.01] },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < pointsCount; i += 1) {
        const nx = Math.sin(p.a * y) * Math.sin(p.b * z) + Math.cos(p.c * x);
        const ny = Math.sin(p.b * z) * Math.sin(p.c * x) + Math.cos(p.a * y);
        const nz = Math.sin(p.c * x) * Math.sin(p.a * y) + Math.cos(p.b * z);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Chrono Core': {
    type: 'map',
    defaults: { a: 2.5, b: 1.47, c: 0.5, d: 0.1 },
    ranges: {
      a: [0.1, 3, 0.01],
      b: [0.1, 3, 0.01],
      c: [0.1, 3, 0.01],
      d: [0.1, 3, 0.01],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < pointsCount; i += 1) {
        const r = Math.sqrt(x * x + y * y + z * z);
        const nx = Math.sin(p.a * y) + p.b * Math.cos(r);
        const ny = Math.sin(p.c * z) + p.d * Math.sin(r);
        const nz = Math.sin(p.a * x) + Math.cos(p.b * r);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Crystalline Spire': {
    type: 'ode',
    defaults: { a: 1.75, dt: 0.01 },
    ranges: { a: [1.0, 2.0, 0.01], dt: [0.001, 0.05, 0.001] },
    generate: (p, positions, pointsCount) => {
      let x = 1.0;
      let y = 0.0;
      let z = 0.0;
      for (let i = 0; i < pointsCount; i += 1) {
        const dx = (-p.a * x - 4 * y - 4 * z - y * y) * p.dt;
        const dy = (-p.a * y - 4 * z - 4 * x - z * z) * p.dt;
        const dz = (-p.a * z - 4 * x - 4 * y - x * x) * p.dt;
        x += dx;
        y += dy;
        z += dz;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 1.0;
          y = 0.0;
          z = 0.0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Void Dragon': {
    type: 'ode',
    defaults: { a: 40.0, b: 3.0, c: 28.0, dt: 0.002 },
    ranges: {
      a: [10.0, 60.0, 0.1],
      b: [1.0, 10.0, 0.1],
      c: [10.0, 50.0, 0.1],
      dt: [0.001, 0.01, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.5;
      let z = -0.6;
      for (let i = 0; i < pointsCount; i += 1) {
        const dx = p.a * (y - x) * p.dt;
        const dy = ((p.c - p.a) * x - x * z + p.c * y) * p.dt;
        const dz = (x * y - p.b * z) * p.dt;
        x += dx;
        y += dy;
        z += dz;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.5;
          z = -0.6;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Astral Web': {
    type: 'map',
    defaults: { a: 1.1, b: 2.2, c: 1.5, d: 0.8 },
    ranges: {
      a: [0.1, 3, 0.01],
      b: [0.1, 3, 0.01],
      c: [0.1, 3, 0.01],
      d: [0.1, 3, 0.01],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < pointsCount; i += 1) {
        const nx = Math.sin(p.a * (y - z)) + p.b * Math.cos(x);
        const ny = Math.sin(p.c * (z - x)) + p.d * Math.cos(y);
        const nz = Math.sin(p.a * (x - y)) + p.b * Math.cos(z);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Hyperborean Snowflake': {
    type: 'map',
    defaults: { a: 1.5, b: 1.2, c: 1.8, d: 0.5 },
    ranges: {
      a: [0.1, 3, 0.01],
      b: [0.1, 3, 0.01],
      c: [0.1, 3, 0.01],
      d: [0.1, 3, 0.01],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < pointsCount; i += 1) {
        const r = Math.sqrt(x * x + y * y + z * z);
        const nx =
          Math.cos(p.a * r) * x - Math.sin(p.b * r) * y + p.c * Math.sin(z);
        const ny =
          Math.sin(p.a * r) * x + Math.cos(p.b * r) * y + p.c * Math.sin(x);
        const nz = p.d * Math.cos(r) + Math.sin(y);
        const f = 1.0 / (1.0 + r * 0.05);
        x = nx * f;
        y = ny * f;
        z = nz * f;
        positions.push(x, y, z);
      }
    },
  },
  'Aetheric Crown': {
    type: 'map',
    defaults: { a: 1.2, b: 2.1, c: 1.4, d: 1.5 },
    ranges: {
      a: [0.1, 3, 0.01],
      b: [0.1, 3, 0.01],
      c: [0.1, 3, 0.01],
      d: [0.1, 3, 0.01],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < pointsCount; i += 1) {
        const nx = Math.cos(p.a * y) + Math.sin(p.b * z) - Math.cos(p.c * x);
        const ny = Math.cos(p.d * z) + Math.sin(p.a * x) - Math.cos(p.b * y);
        const nz = Math.cos(p.c * x) + Math.sin(p.d * y) - Math.cos(p.a * z);
        x = nx;
        y = ny;
        z = nz;
        positions.push(x, y, z);
      }
    },
  },
  'Plasma Coil': {
    type: 'ode',
    defaults: { s: 20.0, v: 4.272, dt: 0.005 },
    ranges: {
      s: [1.0, 20.0, 0.1],
      v: [1.0, 10.0, 0.001],
      dt: [0.001, 0.02, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 1.0;
      let y = 0.0;
      let z = 0.0;
      for (let i = 0; i < pointsCount; i += 1) {
        const dx = -p.s * (x + y) * p.dt;
        const dy = (-y - p.s * x * z) * p.dt;
        const dz = (p.s * x * y + p.v) * p.dt;
        x += dx;
        y += dy;
        z += dz;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 1.0;
          y = 0.0;
          z = 0.0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Lorenz Attractor': {
    type: 'ode',
    defaults: { sigma: 10.0, rho: 28.0, beta: 2.67, dt: 0.005 },
    ranges: {
      sigma: [1.0, 30.0, 0.1],
      rho: [5.0, 60.0, 0.1],
      beta: [1.0, 4.0, 0.01],
      dt: [0.001, 0.02, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.0;
      let z = 0.0;
      for (let i = 0; i < pointsCount; i += 1) {
        const dx = p.sigma * (y - x);
        const dy = x * (p.rho - z) - y;
        const dz = x * y - p.beta * z;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.0;
          z = 0.0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Rossler Attractor': {
    type: 'ode',
    defaults: { a: 0.2, b: 0.2, c: 5.7, dt: 0.01 },
    ranges: {
      a: [0.05, 0.6, 0.01],
      b: [0.05, 0.6, 0.01],
      c: [2.0, 12.0, 0.1],
      dt: [0.001, 0.03, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.0;
      let z = 0.0;
      for (let i = 0; i < pointsCount; i += 1) {
        const dx = -y - z;
        const dy = x + p.a * y;
        const dz = p.b + z * (x - p.c);
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.0;
          z = 0.0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Dadras Attractor': {
    type: 'ode',
    defaults: { a: 3.0, b: 2.7, c: 1.7, d: 2.0, e: 9.0, dt: 0.002 },
    ranges: {
      a: [0.5, 6.0, 0.1],
      b: [0.5, 6.0, 0.1],
      c: [0.1, 4.0, 0.1],
      d: [0.5, 4.0, 0.1],
      e: [1.0, 15.0, 0.1],
      dt: [0.001, 0.02, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      const burnIn = 1200;

      for (let i = 0; i < pointsCount + burnIn; i += 1) {
        const dx = y - p.a * x + p.b * y * z;
        const dy = p.c * y - x * z + z;
        const dz = p.d * x * y - p.e * z;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.1;
          z = 0.1;
        }

        if (i >= burnIn) {
          positions.push(x, y, z);
        }
      }
    },
  },
  'Rabinovich-Fabrikant': {
    type: 'ode',
    defaults: { alpha: 0.14, gamma: 0.1, dt: 0.002 },
    ranges: {
      alpha: [0.02, 0.4, 0.001],
      gamma: [0.02, 0.3, 0.001],
      dt: [0.0005, 0.01, 0.0005],
    },
    generate: (p, positions, pointsCount) => {
      let x = -1.0;
      let y = 0.0;
      let z = 0.5;
      const burnIn = 1500;

      for (let i = 0; i < pointsCount + burnIn; i += 1) {
        const xx = x * x;
        const dx = y * (z - 1 + xx) + p.gamma * x;
        const dy = x * (3 * z + 1 - xx) + p.gamma * y;
        const dz = -2 * z * (p.alpha + x * y);
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = -1.0;
          y = 0.0;
          z = 0.5;
        }

        if (i >= burnIn) {
          positions.push(x, y, z);
        }
      }
    },
  },
  'Arneodo Attractor': {
    type: 'ode',
    defaults: { a: -5.5, b: 3.5, c: -1.0, dt: 0.005 },
    ranges: {
      a: [-8.0, -1.0, 0.1],
      b: [0.5, 6.0, 0.1],
      c: [-2.5, -0.1, 0.01],
      dt: [0.001, 0.02, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.0;
      let z = 0.0;
      const burnIn = 1200;

      for (let i = 0; i < pointsCount + burnIn; i += 1) {
        const dx = y;
        const dy = z;
        const dz = -p.a * x - p.b * y - z + p.c * x ** 3;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.0;
          z = 0.0;
        }

        if (i >= burnIn) {
          positions.push(x, y, z);
        }
      }
    },
  },
  'Burke-Shaw Clover': {
    type: 'ode',
    defaults: { s: 10.0, v: 4.272, dt: 0.005 },
    ranges: {
      s: [1.0, 25.0, 0.1],
      v: [0.5, 8.0, 0.001],
      dt: [0.001, 0.02, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.0;
      let z = 0.0;
      const burnIn = 1000;

      for (let i = 0; i < pointsCount + burnIn; i += 1) {
        const dx = -p.s * (x + y);
        const dy = -y - p.s * x * z;
        const dz = p.s * x * y + p.v;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.0;
          z = 0.0;
        }

        if (i >= burnIn) {
          positions.push(x, y, z);
        }
      }
    },
  },
  'Sprott Orbit': {
    type: 'ode',
    defaults: { a: 2.07, b: 1.79, dt: 0.004 },
    ranges: {
      a: [0.5, 4.0, 0.01],
      b: [0.5, 3.0, 0.01],
      dt: [0.001, 0.02, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.0;
      let z = 0.0;
      const burnIn = 1500;

      for (let i = 0; i < pointsCount + burnIn; i += 1) {
        const xx = x * x;
        const dx = y + p.a * x * y + x * z;
        const dy = 1 - p.b * xx + y * z;
        const dz = x - xx - y * y;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.0;
          z = 0.0;
        }

        if (i >= burnIn) {
          positions.push(x, y, z);
        }
      }
    },
  },
  'Halvorsen Attractor': {
    type: 'ode',
    defaults: { a: 1.4, dt: 0.005 },
    ranges: {
      a: [0.5, 3.0, 0.01],
      dt: [0.001, 0.02, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 1.0;
      let y = 0.0;
      let z = 0.0;
      for (let i = 0; i < pointsCount; i += 1) {
        const dx = -p.a * x - 4 * y - 4 * z - y * y;
        const dy = -p.a * y - 4 * z - 4 * x - z * z;
        const dz = -p.a * z - 4 * x - 4 * y - x * x;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 1.0;
          y = 0.0;
          z = 0.0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Chen Attractor': {
    type: 'ode',
    defaults: { a: 35.0, b: 3.0, c: 28.0, dt: 0.002 },
    ranges: {
      a: [10.0, 60.0, 0.1],
      b: [1.0, 10.0, 0.1],
      c: [10.0, 50.0, 0.1],
      dt: [0.001, 0.01, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.0;
      let z = 0.0;
      for (let i = 0; i < pointsCount; i += 1) {
        const dx = p.a * (y - x);
        const dy = (p.c - p.a) * x - x * z + p.c * y;
        const dz = x * y - p.b * z;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.0;
          z = 0.0;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Chen-Lee': {
    type: 'ode',
    defaults: { alpha: 5.0, beta: -10.0, delta: -0.38, dt: 0.003 },
    ranges: {
      alpha: [0.5, 20.0, 0.1],
      beta: [-30.0, 5.0, 0.1],
      delta: [-3.0, 1.0, 0.01],
      dt: [0.0005, 0.02, 0.0005],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      const burnIn = 1000;

      for (let i = 0; i < pointsCount + burnIn; i += 1) {
        const dx = p.alpha * x - y * z;
        const dy = p.beta * y + x * z;
        const dz = p.delta * z + (x * y) / 3;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.1;
          z = 0.1;
        }

        if (i >= burnIn) {
          positions.push(x, y, z);
        }
      }
    },
  },
  'Lorenz 83': {
    type: 'ode',
    defaults: { a: 0.95, b: 7.91, f: 4.83, g: 4.66, dt: 0.004 },
    ranges: {
      a: [0.1, 3.0, 0.01],
      b: [0.1, 20.0, 0.01],
      f: [0.1, 10.0, 0.01],
      g: [0.1, 10.0, 0.01],
      dt: [0.0005, 0.02, 0.0005],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.0;
      let z = 0.0;
      const burnIn = 1200;

      for (let i = 0; i < pointsCount + burnIn; i += 1) {
        const dx = -p.a * x - y * y - z * z + p.a * p.f;
        const dy = -y + x * y - p.b * x * z + p.g;
        const dz = -z + p.b * x * y + x * z;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.0;
          z = 0.0;
        }

        if (i >= burnIn) {
          positions.push(x, y, z);
        }
      }
    },
  },
  'Three-Scroll Unified Chaotic System': {
    type: 'ode',
    defaults: {
      a: 32.48,
      b: 45.84,
      c: 1.18,
      d: 0.13,
      e: 0.57,
      f: 14.7,
      dt: 0.0008,
    },
    ranges: {
      a: [5.0, 60.0, 0.01],
      b: [5.0, 70.0, 0.01],
      c: [0.2, 5.0, 0.01],
      d: [0.0, 1.0, 0.001],
      e: [0.0, 2.0, 0.001],
      f: [1.0, 25.0, 0.01],
      dt: [0.0001, 0.01, 0.0001],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.0;
      let z = 0.0;
      const burnIn = 1500;

      for (let i = 0; i < pointsCount + burnIn; i += 1) {
        const dx = p.a * (y - x) + p.d * x * z;
        const dy = p.b * x - x * z + p.f * y;
        const dz = p.c * z + x * y - p.e * x * x;
        x += dx * p.dt;
        y += dy * p.dt;
        z += dz * p.dt;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.0;
          z = 0.0;
        }

        if (i >= burnIn) {
          positions.push(x, y, z);
        }
      }
    },
  },
  'Pickover Attractor': {
    type: 'map',
    defaults: { a: 2.24, b: 0.43, c: -0.65, d: -2.43 },
    ranges: {
      a: [-3.0, 3.0, 0.01],
      b: [-3.0, 3.0, 0.01],
      c: [-3.0, 3.0, 0.01],
      d: [-3.0, 3.0, 0.01],
    },
    generate: (p, positions, pointsCount) => {
      let x = 0.1;
      let y = 0.1;
      let z = 0.1;
      for (let i = 0; i < pointsCount; i += 1) {
        const nx = Math.sin(p.a * y) - z * Math.cos(p.b * x);
        const ny = z * Math.sin(p.c * x) - Math.cos(p.d * y);
        const nz = Math.sin(x);
        x = nx;
        y = ny;
        z = nz;
        if (Number.isNaN(x) || Math.abs(x) > 1000) {
          x = 0.1;
          y = 0.1;
          z = 0.1;
        }
        positions.push(x, y, z);
      }
    },
  },
  'Popcorn Cloud': {
    type: 'map',
    defaults: { h: 0.05, k: 3.0 },
    ranges: {
      h: [0.005, 0.2, 0.001],
      k: [0.5, 8.0, 0.01],
    },
    generate: (p, positions, pointsCount) => {
      // Single-seed trajectories collapse — use many seeds spread deterministically
      // across [-π, π]² via the golden ratio so we fill the full chaotic domain.
      const PHI = 1.6180339887;
      const { PI } = Math;
      const seeds = 300;
      const stepsPerSeed = Math.ceil(pointsCount / seeds);

      for (let s = 0; s < seeds; s += 1) {
        let x = ((s * PHI) % 1) * 2 * PI - PI;
        let y = ((s * PHI * PHI) % 1) * 2 * PI - PI;

        for (let i = 0; i < stepsPerSeed; i += 1) {
          const ty = Math.tan(p.k * y);
          const tx = Math.tan(p.k * x);
          // tan blows up at π/2 + nπ — bail on this seed rather than resetting
          if (!Number.isFinite(ty) || !Number.isFinite(tx)) break;
          const nx = x - p.h * Math.sin(y + ty);
          const ny = y - p.h * Math.sin(x + tx);
          if (Number.isNaN(nx) || Math.abs(nx) > 50) break;
          x = nx;
          y = ny;
          const z =
            Math.sin(p.k * x) * Math.cos(p.k * y) * 0.4 +
            Math.cos(x * y * 0.3) * 0.2;
          positions.push(x, y, z);
        }
      }
    },
  },
  'Hopf Fibration Sampler': {
    type: 'map',
    defaults: {
      fibers: 220,
      twist: 1.0,
      projection: 0.92,
      phase: 0.0,
      jitter: 0.01,
      baseRotation: 0.0,
    },
    ranges: {
      fibers: [24, 900, 1],
      twist: [0.3, 4.0, 0.01],
      projection: [0.5, 0.98, 0.001],
      phase: [0.0, Math.PI * 2, 0.01],
      jitter: [0.0, 0.08, 0.001],
      baseRotation: [0.0, Math.PI * 2, 0.01],
    },
    generate: (p, positions, pointsCount) => {
      const PHI = (1 + Math.sqrt(5)) / 2;
      const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
      const totalFibers = Math.max(
        1,
        Math.min(pointsCount, Math.floor(p.fibers))
      );
      const samplesPerFiber = Math.max(6, Math.ceil(pointsCount / totalFibers));
      const maxProjection = Math.max(0.001, Number(p.projection) || 0.92);
      let seed = 2463534242;

      const rand = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      for (let i = 0; i < totalFibers; i += 1) {
        if (positions.length >= pointsCount * 3) break;

        const u = (i + 0.5) / totalFibers;
        const yBase = 1 - 2 * u;
        const radial = Math.sqrt(Math.max(0, 1 - yBase * yBase));
        const azimuth = GOLDEN_ANGLE * i + p.baseRotation * PHI;
        const xBase = radial * Math.cos(azimuth);
        const zBase = radial * Math.sin(azimuth);

        const eta = Math.acos(Math.max(-1, Math.min(1, yBase)));
        const phi = Math.atan2(zBase, xBase);
        const halfEtaCos = Math.cos(eta * 0.5);
        const halfEtaSin = Math.sin(eta * 0.5);

        for (let j = 0; j < samplesPerFiber; j += 1) {
          if (positions.length >= pointsCount * 3) break;

          const t = (j / samplesPerFiber) * Math.PI * 2;
          const psi = t * p.twist + p.phase + i * 0.013;
          const a1 = (psi + phi) * 0.5;
          const a2 = (psi - phi) * 0.5;

          const x = halfEtaCos * Math.cos(a1);
          const y = halfEtaCos * Math.sin(a1);
          const z = halfEtaSin * Math.cos(a2);
          const w = halfEtaSin * Math.sin(a2);

          const denom = Math.max(0.03, 1 - w * maxProjection);
          const { jitter } = p;
          const jx = (rand() * 2 - 1) * jitter;
          const jy = (rand() * 2 - 1) * jitter;
          const jz = (rand() * 2 - 1) * jitter;

          const px = x / denom + jx;
          const py = y / denom + jy;
          const pz = z / denom + jz;

          if (
            Number.isFinite(px) &&
            Number.isFinite(py) &&
            Number.isFinite(pz) &&
            Math.abs(px) < 100 &&
            Math.abs(py) < 100 &&
            Math.abs(pz) < 100
          ) {
            positions.push(px, py, pz);
          }
        }
      }

      if (positions.length >= 3 && positions.length < pointsCount * 3) {
        const existing = positions.length;
        for (let i = existing; i < pointsCount * 3; i += 3) {
          const idx = i % existing;
          positions.push(
            positions[idx],
            positions[idx + 1],
            positions[idx + 2]
          );
        }
      }
    },
  },
  'L-Systems Vascular Tree': {
    type: 'map',
    defaults: {
      iterations: 5,
      angleDeg: 24,
      step: 0.32,
      taper: 0.992,
      branchShrink: 0.8,
      jitter: 0.23,
      forkChance: 0.62,
      stretch: 0.38,
      curl: 0.33,
      seed: 11,
    },
    ranges: {
      iterations: [2, 7, 1],
      angleDeg: [8, 48, 1],
      step: [0.08, 0.75, 0.01],
      taper: [0.96, 0.999, 0.001],
      branchShrink: [0.55, 0.95, 0.01],
      jitter: [0.0, 0.45, 0.005],
      forkChance: [0.2, 0.95, 0.01],
      stretch: [0.05, 0.8, 0.01],
      curl: [0.0, 0.8, 0.01],
      seed: [1, 999, 1],
    },
    generate: (p, positions, pointsCount) => {
      generateVascularTree(p, positions, pointsCount);
    },
  },
  'Mandelbulb Point Sampler': {
    type: 'map',
    defaults: {
      power: 8.0,
      bailout: 4.0,
      iterations: 12,
      radius: 1.4,
      jitter: 0.02,
    },
    ranges: {
      power: [2.0, 12.0, 0.1],
      bailout: [2.0, 8.0, 0.1],
      iterations: [5, 20, 1],
      radius: [0.8, 2.2, 0.01],
      jitter: [0.0, 0.1, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let seed = 1337;
      const accepted = [];
      const maxAttempts = Math.max(pointsCount * 12, 200000);

      const rand = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      const iterateMandelbulb = (cx, cy, cz) => {
        let x = 0.0;
        let y = 0.0;
        let z = 0.0;
        let escaped = false;
        let orbitTrap = 9999;

        for (let i = 0; i < p.iterations; i += 1) {
          const r = Math.sqrt(x * x + y * y + z * z);
          orbitTrap = Math.min(orbitTrap, r);

          if (r > p.bailout) {
            escaped = true;
            break;
          }

          const theta = r > 0.000001 ? Math.acos(z / r) : 0.0;
          const phi = Math.atan2(y, x);
          const rn = r ** p.power;
          const thetan = theta * p.power;
          const phin = phi * p.power;
          const sinTheta = Math.sin(thetan);

          x = rn * sinTheta * Math.cos(phin) + cx;
          y = rn * sinTheta * Math.sin(phin) + cy;
          z = rn * Math.cos(thetan) + cz;
        }

        return { escaped, orbitTrap };
      };

      for (let attempts = 0; attempts < maxAttempts; attempts += 1) {
        if (accepted.length >= pointsCount * 3) break;

        const cx = (rand() * 2 - 1) * p.radius;
        const cy = (rand() * 2 - 1) * p.radius;
        const cz = (rand() * 2 - 1) * p.radius;

        const { escaped, orbitTrap } = iterateMandelbulb(cx, cy, cz);

        if (!escaped) {
          const jx = (rand() * 2 - 1) * p.jitter;
          const jy = (rand() * 2 - 1) * p.jitter;
          const jz = (rand() * 2 - 1) * p.jitter;
          const trapBias = Math.min(1, orbitTrap * 0.5);

          accepted.push(cx + jx, cy + jy, cz + jz + (0.5 - trapBias) * 0.08);
        }
      }

      if (accepted.length >= 3) {
        for (let i = 0; i < pointsCount; i += 1) {
          const idx = (i * 3) % accepted.length;
          positions.push(accepted[idx], accepted[idx + 1], accepted[idx + 2]);
        }
      }
    },
  },
  'Quaternion Julia Sampler': {
    type: 'map',
    defaults: {
      cx: -0.2,
      cy: 0.72,
      cz: 0.0,
      cw: 0.12,
      bailout: 4.0,
      iterations: 14,
      radius: 1.3,
      jitter: 0.015,
    },
    ranges: {
      cx: [-1.2, 1.2, 0.01],
      cy: [-1.2, 1.2, 0.01],
      cz: [-1.2, 1.2, 0.01],
      cw: [-1.2, 1.2, 0.01],
      bailout: [2.0, 8.0, 0.1],
      iterations: [5, 24, 1],
      radius: [0.7, 2.0, 0.01],
      jitter: [0.0, 0.08, 0.001],
    },
    generate: (p, positions, pointsCount) => {
      let seed = 4242;
      const accepted = [];
      const maxAttempts = Math.max(pointsCount * 20, 250000);

      const rand = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      const iterateQuaternionJulia = (qx, qy, qz, qw) => {
        let x = qx;
        let y = qy;
        let z = qz;
        let w = qw;
        let escaped = false;

        for (let i = 0; i < p.iterations; i += 1) {
          const xx = x * x;
          const yy = y * y;
          const zz = z * z;
          const ww = w * w;

          const nx = xx - yy - zz - ww + p.cx;
          const ny = 2 * x * y + p.cy;
          const nz = 2 * x * z + p.cz;
          const nw = 2 * x * w + p.cw;

          x = nx;
          y = ny;
          z = nz;
          w = nw;

          const magSq = x * x + y * y + z * z + w * w;
          if (magSq > p.bailout * p.bailout) {
            escaped = true;
            break;
          }
        }

        return { escaped, x, y, z, w };
      };

      for (let attempts = 0; attempts < maxAttempts; attempts += 1) {
        if (accepted.length >= pointsCount * 3) break;

        const qx = (rand() * 2 - 1) * p.radius;
        const qy = (rand() * 2 - 1) * p.radius;
        const qz = (rand() * 2 - 1) * p.radius;
        const qw = (rand() * 2 - 1) * p.radius;

        const result = iterateQuaternionJulia(qx, qy, qz, qw);

        if (!result.escaped) {
          const jx = (rand() * 2 - 1) * p.jitter;
          const jy = (rand() * 2 - 1) * p.jitter;
          const jz = (rand() * 2 - 1) * p.jitter;
          // Project the original bounded 4D sample into 3D to preserve shell thickness.
          const px = qx * 0.86 + qz * 0.34;
          const py = qy * 0.9 + qw * 0.22;
          const pz = qz * 0.72 - qx * 0.24 + qw * 0.46;
          const proj = 1 / (1 + Math.abs(qw) * 0.6);

          accepted.push((px + jx) * proj, (py + jy) * proj, (pz + jz) * proj);
        }
      }

      if (accepted.length >= 3) {
        for (let i = 0; i < pointsCount; i += 1) {
          const idx = (i * 3) % accepted.length;
          positions.push(accepted[idx], accepted[idx + 1], accepted[idx + 2]);
        }
      }
    },
  },

  // ---------------------------------------------------------------------------
  // Gravity Attractors — real-time N-body attractor simulation (type: 'sim')
  // Ported from the Three.js WebGPU compute-shader example.
  // ---------------------------------------------------------------------------
  'Gravity Attractors': {
    type: 'sim',
    defaults: {
      attractorMassExp: 7,
      particleMassExp: 4,
      maxSpeed: 8,
      velocityDamping: 0.1,
      spinningStrength: 2.75,
      boundHalfExtent: 8,
      timeScale: 1,
    },
    ranges: {
      attractorMassExp: [1, 10, 1],
      particleMassExp: [1, 10, 1],
      maxSpeed: [0.5, 20, 0.1],
      velocityDamping: [0, 0.2, 0.001],
      spinningStrength: [0, 10, 0.01],
      boundHalfExtent: [2, 20, 0.5],
      timeScale: [0.1, 3, 0.1],
    },
    generate: (_p, positions, pointsCount) => {
      // Deterministic initial positions so geometry doesn't re-randomise on
      // param slider changes (useEffect re-fires on paramsKey).
      const rand = makeSeededRandom(42);
      for (let i = 0; i < pointsCount; i += 1) {
        positions.push(
          (rand() - 0.5) * 5,
          (rand() - 0.5) * 0.2,
          (rand() - 0.5) * 5
        );
      }
    },

    /** Create mutable simulation buffers (called once per algo/count change). */
    createSimState: (pointsCount) => {
      const positions = new Float32Array(pointsCount * 3);
      const velocities = new Float32Array(pointsCount * 3);
      const masses = new Float32Array(pointsCount);

      // Initial positions — must match generate() above (same seed).
      const randPos = makeSeededRandom(42);
      for (let i = 0; i < pointsCount; i += 1) {
        positions[i * 3] = (randPos() - 0.5) * 5;
        positions[i * 3 + 1] = (randPos() - 0.5) * 0.2;
        positions[i * 3 + 2] = (randPos() - 0.5) * 5;
      }

      // Random velocities + per-particle mass multiplier.
      const randVel = makeSeededRandom(1337);
      for (let i = 0; i < pointsCount; i += 1) {
        const phi = randVel() * Math.PI * 2;
        const theta = randVel() * Math.PI;
        const sinPhi = Math.sin(phi);
        velocities[i * 3] = sinPhi * Math.sin(theta) * 0.05;
        velocities[i * 3 + 1] = Math.cos(phi) * 0.05;
        velocities[i * 3 + 2] = sinPhi * Math.cos(theta) * 0.05;
        masses[i] = 0.25 + randVel() * 0.75;
      }

      return { positions, velocities, masses };
    },

    /** Advance the simulation one fixed-dt step (called every frame).
     *  @param {object}  state      – mutable sim buffers
     *  @param {object}  params     – Leva parameter values
     *  @param {Array}   [liveAttractors] – optional live attractor array from
     *                   the scene (position/direction per entry). Falls back to
     *                   INITIAL_ATTRACTORS when omitted.
     */
    update: (state, params, liveAttractors) => {
      const { positions, velocities, masses } = state;
      const pointsCount = masses.length;
      const attractorMass = 10 ** params.attractorMassExp;
      const particleGlobalMass = 10 ** params.particleMassExp;
      const G = 6.67e-11;
      const dt = (1 / 60) * params.timeScale;
      const { maxSpeed, spinningStrength, boundHalfExtent } = params;
      const dampFactor = 1 - params.velocityDamping;
      const halfHalf = boundHalfExtent / 2;
      const attractors = liveAttractors || INITIAL_ATTRACTORS;
      const numAttractors = attractors.length;

      for (let i = 0; i < pointsCount; i += 1) {
        const idx = i * 3;
        let px = positions[idx];
        let py = positions[idx + 1];
        let pz = positions[idx + 2];
        const pMass = masses[i] * particleGlobalMass;

        let fx = 0;
        let fy = 0;
        let fz = 0;

        for (let a = 0; a < numAttractors; a += 1) {
          const attr = attractors[a];
          const dx = attr.position[0] - px;
          const dy = attr.position[1] - py;
          const dz = attr.position[2] - pz;
          const distSq = dx * dx + dy * dy + dz * dz;
          const dist = Math.sqrt(distSq);
          if (dist < 0.001) continue; // eslint-disable-line no-continue

          const invDist = 1 / dist;
          const gStr = (attractorMass * pMass * G) / distSq;

          // Gravity
          fx += dx * invDist * gStr;
          fy += dy * invDist * gStr;
          fz += dz * invDist * gStr;

          // Spinning: cross(rotAxis * gStr * spin, toAttractor)
          const s = gStr * spinningStrength;
          const sx = attr.direction[0] * s;
          const sy = attr.direction[1] * s;
          const sz = attr.direction[2] * s;
          fx += sy * dz - sz * dy;
          fy += sz * dx - sx * dz;
          fz += sx * dy - sy * dx;
        }

        // Velocity update
        let vx = velocities[idx] + fx * dt;
        let vy = velocities[idx + 1] + fy * dt;
        let vz = velocities[idx + 2] + fz * dt;

        // Clamp speed
        const spd = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (spd > maxSpeed) {
          const sc = maxSpeed / spd;
          vx *= sc;
          vy *= sc;
          vz *= sc;
        }

        // Damping
        vx *= dampFactor;
        vy *= dampFactor;
        vz *= dampFactor;

        velocities[idx] = vx;
        velocities[idx + 1] = vy;
        velocities[idx + 2] = vz;

        // Position update
        px += vx * dt;
        py += vy * dt;
        pz += vz * dt;

        // Box wrap (JS-safe modulo for negatives)
        px =
          ((((px + halfHalf) % boundHalfExtent) + boundHalfExtent) %
            boundHalfExtent) -
          halfHalf;
        py =
          ((((py + halfHalf) % boundHalfExtent) + boundHalfExtent) %
            boundHalfExtent) -
          halfHalf;
        pz =
          ((((pz + halfHalf) % boundHalfExtent) + boundHalfExtent) %
            boundHalfExtent) -
          halfHalf;

        positions[idx] = px;
        positions[idx + 1] = py;
        positions[idx + 2] = pz;
      }
    },
  },
};

export default algorithms;
