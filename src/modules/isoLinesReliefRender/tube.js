const SIDES = 16;

export function tubeTemplate() {
  const position = [];
  const face = [];
  const index = [];
  const vertex = (x, y, z, id) => {
    position.push(x, y, z);
    face.push(id);
  };
  for (let end = 0; end < 2; end += 1) {
    for (let i = 0; i < SIDES; i += 1) {
      const angle = (i / SIDES) * Math.PI * 2;
      vertex(end, Math.cos(angle), (Math.sin(angle) + 1) / 2, 0);
    }
  }
  for (let i = 0; i < SIDES; i += 1) {
    const next = (i + 1) % SIDES;
    index.push(i, next, i + SIDES, next, next + SIDES, i + SIDES);
  }
  for (let end = 0; end < 2; end += 1) {
    const start = position.length / 3;
    vertex(end, 0, 0.5, end + 3);
    for (let i = 0; i < SIDES; i += 1) {
      const angle = (i / SIDES) * Math.PI * 2;
      vertex(end, Math.cos(angle), (Math.sin(angle) + 1) / 2, end + 3);
    }
    for (let i = 0; i < SIDES; i += 1) {
      const a = start + 1 + i;
      const b = start + 1 + ((i + 1) % SIDES);
      index.push(start, end ? a : b, end ? b : a);
    }
  }
  return { face, index, position };
}

const TEMPLATE = tubeTemplate();

export function tubePlot({ count, data }, radius, baseOf) {
  const position = [];
  const index = [];
  const ends = new Map();
  const keyOf = (o, end) =>
    `${data[o + end * 2]},${data[o + end * 2 + 1]},${data[o + 8]}`;
  for (let s = 0; s < count; s += 1) {
    for (let end = 0; end < 2; end += 1) {
      const key = keyOf(s * 12, end);
      ends.set(key, (ends.get(key) ?? 0) + 1);
    }
  }
  for (let s = 0; s < count; s += 1) {
    const o = s * 12;
    const base = baseOf(data, o);
    if (base !== null) {
      const first = position.length / 3;
      for (let v = 0; v < TEMPLATE.position.length; v += 3) {
        const along = TEMPLATE.position[v];
        const side = TEMPLATE.position[v + 1] * radius;
        const up = TEMPLATE.position[v + 2] * radius * 2;
        const x = data[o] + (data[o + 2] - data[o]) * along;
        const y = data[o + 1] + (data[o + 3] - data[o + 1]) * along;
        const mx = data[o + 4] + (data[o + 6] - data[o + 4]) * along;
        const my = data[o + 5] + (data[o + 7] - data[o + 5]) * along;
        position.push(x + mx * side, base + up, -(y + my * side));
      }
      for (let t = 0; t < TEMPLATE.index.length; t += 3) {
        const a = TEMPLATE.index[t];
        const face = TEMPLATE.face[a];
        if (face === 0 || ends.get(keyOf(o, face - 3)) === 1) {
          index.push(
            first + a,
            first + TEMPLATE.index[t + 1],
            first + TEMPLATE.index[t + 2]
          );
        }
      }
    }
  }
  const placed = Float64Array.from(position);
  return {
    boundaries: true,
    creaseAngle: 60,
    index: Uint32Array.from(index),
    position: placed,
    rest: placed,
    smooth: true,
  };
}
