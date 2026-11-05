/* eslint-disable no-continue, no-param-reassign */
export default function createSolidContacts(
  { positions, previous, mass, radii },
  boxes,
  floor
) {
  const count = mass.length;
  const solids = new Map();
  const solidKey = (x, y) => x + y * 8192;
  boxes.forEach((box) => {
    for (
      let x = Math.floor(box.min[0] - 0.2);
      x <= Math.floor(box.max[0] + 0.2);
      x += 1
    ) {
      for (
        let y = Math.floor(box.min[1] - 0.2);
        y <= Math.floor(box.max[1] + 0.2);
        y += 1
      ) {
        const key = solidKey(x, y);
        if (!solids.has(key)) solids.set(key, []);
        solids.get(key).push(box);
      }
    }
  });

  return function collideSolids() {
    for (let k = 0; k < count; k += 1) {
      if (!mass[k]) continue;
      const o = k * 3;
      const r = radii[k];
      let contact = false;
      if (positions[o + 1] < floor + r) {
        positions[o + 1] = floor + r;
        contact = true;
      }
      const nearby = solids.get(
        solidKey(Math.floor(positions[o]), Math.floor(positions[o + 1]))
      );
      for (let b = 0; b < (nearby?.length ?? 0); b += 1) {
        const box = nearby[b];
        if (
          positions[o] <= box.min[0] - r ||
          positions[o] >= box.max[0] + r ||
          positions[o + 1] <= box.min[1] - r ||
          positions[o + 1] >= box.max[1] + r ||
          positions[o + 2] <= box.min[2] - r ||
          positions[o + 2] >= box.max[2] + r
        )
          continue;
        let best = Infinity;
        let axis = 2;
        let boundary = box.max[2] + r;
        for (let a = 0; a < 3; a += 1) {
          const lo = positions[o + a] - (box.min[a] - r);
          const hi = box.max[a] + r - positions[o + a];
          if (lo < best) {
            best = lo;
            axis = a;
            boundary = box.min[a] - r;
          }
          if (hi < best) {
            best = hi;
            axis = a;
            boundary = box.max[a] + r;
          }
        }
        positions[o + axis] = boundary;
        contact = true;
      }
      if (contact) {
        for (let a = 0; a < 3; a += 1)
          previous[o + a] += (positions[o + a] - previous[o + a]) * 0.15;
      }
    }
  };
}
