/* eslint-disable no-bitwise */
const INK = '#1d1d28';
const ACCENTS = [
  '#ffc300',
  '#ff4fa3',
  '#2ec4f0',
  '#70c22e',
  '#ff7b00',
  '#c3a6ff',
];
const POINTS = 72;

export const MAX_AVATAR_SEED = 2 ** 32 - 1;

export function randomAvatarSeed() {
  return Math.floor(Math.random() * MAX_AVATAR_SEED);
}

export function isAvatarSeed(value) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_AVATAR_SEED;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rand, items) {
  return items[Math.floor(rand() * items.length)];
}

function weighted(rand, entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rand() * total;
  const hit = entries.find(([, weight]) => {
    roll -= weight;
    return roll <= 0;
  });
  return (hit ?? entries[entries.length - 1])[0];
}

function rollMonster(seed) {
  const rand = mulberry32(seed);
  const shape = weighted(rand, [
    ['blob', 3],
    ['tall', 2],
    ['wide', 2],
    ['fuzzy', 2],
  ]);
  const harmonics = [2, 3, 5].map((k) => ({
    amp: 0.03 + rand() * (shape === 'blob' ? 0.1 : 0.05),
    k,
    phase: rand() * Math.PI * 2,
  }));
  const eyes = weighted(rand, [
    [1, 3],
    [2, 5],
    [3, 2],
  ]);
  return {
    accent: pick(rand, ACCENTS),
    antennae: rand() < 0.35,
    cheeks: rand() < 0.45,
    ears: rand() < 0.3,
    eyeSize: eyes === 1 ? 13 + rand() * 4 : 7 + rand() * 4,
    eyes,
    feet: weighted(rand, [
      ['none', 2],
      ['feet', 3],
      ['tentacles', 2],
    ]),
    fuzz: 8 + Math.floor(rand() * 6),
    harmonics,
    horns: rand() < 0.35,
    lookX: (rand() - 0.5) * 0.7,
    lookY: (rand() - 0.5) * 0.5,
    mouth: pick(rand, ['smile', 'fangs', 'o', 'zigzag', 'tongue']),
    radius: 27 + rand() * 5,
    shape,
    sleepy: rand() < 0.2,
    spots: rand() < 0.4 ? 2 + Math.floor(rand() * 4) : 0,
    spotSeed: rand(),
  };
}

function bodyPath(ctx, m) {
  const sx = { tall: 0.84, wide: 1.14 }[m.shape] ?? 1;
  const sy = { tall: 1.12, wide: 0.86 }[m.shape] ?? 1;
  ctx.beginPath();
  for (let i = 0; i <= POINTS; i += 1) {
    const theta = (i / POINTS) * Math.PI * 2;
    let r = 1;
    m.harmonics.forEach(({ amp, k, phase }) => {
      r += amp * Math.sin(k * theta + phase);
    });
    if (m.shape === 'fuzzy') r += 0.07 * Math.abs(Math.sin(m.fuzz * theta));
    const x = 50 + Math.cos(theta) * m.radius * r * sx;
    const y = 54 + Math.sin(theta) * m.radius * r * sy;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function outlined(ctx, fill, draw) {
  ctx.beginPath();
  draw();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.stroke();
}

function drawBehind(ctx, m, color) {
  if (m.antennae) {
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(50 + side * 8, 32);
      ctx.quadraticCurveTo(50 + side * 14, 14, 50 + side * 20, 10);
      ctx.stroke();
      outlined(ctx, m.accent, () =>
        ctx.arc(50 + side * 20, 10, 5, 0, Math.PI * 2)
      );
    });
  }
  if (m.horns) {
    [-1, 1].forEach((side) => {
      outlined(ctx, '#fff1d6', () => {
        ctx.moveTo(50 + side * 12, 34);
        ctx.quadraticCurveTo(50 + side * 26, 22, 50 + side * 24, 8);
        ctx.quadraticCurveTo(50 + side * 18, 22, 50 + side * 4, 30);
        ctx.closePath();
      });
    });
  }
  if (m.ears) {
    [-1, 1].forEach((side) => {
      outlined(ctx, color, () =>
        ctx.arc(50 + side * 26, 34, 9, 0, Math.PI * 2)
      );
    });
  }
  if (m.feet === 'feet') {
    [-1, 1].forEach((side) => {
      outlined(ctx, color, () =>
        ctx.ellipse(50 + side * 13, 86, 10, 6, 0, 0, Math.PI * 2)
      );
    });
  } else if (m.feet === 'tentacles') {
    [-15, -5, 5, 15].forEach((x, i) => {
      outlined(ctx, color, () => {
        ctx.moveTo(50 + x - 4, 74);
        ctx.quadraticCurveTo(50 + x + (i % 2 ? 6 : -6), 88, 50 + x, 96);
        ctx.quadraticCurveTo(50 + x + 4, 88, 50 + x + 4, 74);
        ctx.closePath();
      });
    });
  }
}

function drawFace(ctx, m) {
  const spacing = m.eyes === 1 ? 0 : 15 - m.eyes * 1.5;
  const offsets = { 1: [0], 2: [-1, 1], 3: [-1, 0, 1] }[m.eyes];
  offsets.forEach((offset) => {
    const x = 50 + offset * spacing;
    const y = 46 - (m.eyes === 3 && offset === 0 ? 6 : 0);
    const r = m.eyeSize;
    outlined(ctx, '#ffffff', () => ctx.arc(x, y, r, 0, Math.PI * 2));
    ctx.beginPath();
    ctx.arc(x + m.lookX * r, y + m.lookY * r, r * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
    if (m.sleepy) {
      outlined(ctx, 'rgba(0,0,0,0.25)', () => {
        ctx.arc(x, y, r, Math.PI, Math.PI * 2);
        ctx.closePath();
      });
    }
  });

  if (m.cheeks) {
    ctx.fillStyle = 'rgba(255, 105, 150, 0.45)';
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.arc(50 + side * 20, 62, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.lineWidth = 3.5;
  if (m.mouth === 'o') {
    outlined(ctx, INK, () => ctx.ellipse(50, 68, 5, 6, 0, 0, Math.PI * 2));
  } else if (m.mouth === 'zigzag') {
    outlined(ctx, '#ffffff', () => {
      ctx.moveTo(38, 64);
      [42, 46, 50, 54, 58, 62].forEach((x, i) =>
        ctx.lineTo(x, i % 2 ? 64 : 70)
      );
      ctx.lineTo(62, 64);
    });
  } else {
    outlined(ctx, INK, () => {
      ctx.moveTo(39, 63);
      ctx.quadraticCurveTo(50, 78, 61, 63);
      ctx.closePath();
    });
    if (m.mouth === 'fangs') {
      [-1, 1].forEach((side) => {
        outlined(ctx, '#ffffff', () => {
          ctx.moveTo(50 + side * 7, 64);
          ctx.lineTo(50 + side * 4, 64);
          ctx.lineTo(50 + side * 5.5, 70);
          ctx.closePath();
        });
      });
    } else if (m.mouth === 'tongue') {
      ctx.beginPath();
      ctx.ellipse(52, 69, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b8b';
      ctx.fill();
    }
  }
}

export function drawAvatar(ctx, { color, seed, size, x = 0, y = 0 }) {
  const m = rollMonster(isAvatarSeed(seed) ? seed : 0);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;

  drawBehind(ctx, m, color);

  bodyPath(ctx, m);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.ellipse(50, 72, 18, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  if (m.spots) {
    const spotRand = mulberry32(Math.floor(m.spotSeed * MAX_AVATAR_SEED));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    for (let i = 0; i < m.spots; i += 1) {
      ctx.beginPath();
      ctx.arc(
        22 + spotRand() * 56,
        30 + spotRand() * 50,
        3 + spotRand() * 5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  ctx.restore();
  bodyPath(ctx, m);
  ctx.stroke();

  drawFace(ctx, m);
  ctx.restore();
}
