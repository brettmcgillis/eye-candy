// 8 retained favorites, 4 fixed, 5 custom algorithms.

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
};

export default algorithms;
