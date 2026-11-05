export default function createRopeHand(world, anchors) {
  const { positions, previous, mass, owners, ropes } = world;
  let node = -1;
  let inverseMass = 1;
  const target = new Float64Array(3);

  function release() {
    if (node >= 0 && !anchors.has(node)) mass[node] = inverseMass;
    node = -1;
  }

  function move(point) {
    target.set(point);
    if (node < 0) return;
    const rope = ropes[owners[node]];
    let left = rope.start - 1;
    let right = rope.start + rope.count;
    for (let i = rope.start; i < rope.start + rope.count; i += 1) {
      if (!anchors.has(i)) continue; // eslint-disable-line no-continue
      if (i < node) left = i;
      if (i > node && right === rope.start + rope.count) right = i;
    }
    for (let axis = 0; axis < 3; axis += 1) {
      const delta = point[axis] - positions[node * 3 + axis];
      for (let i = left + 1; i < right; i += 1) {
        let share = 1;
        if (i < node && left >= rope.start) share = (i - left) / (node - left);
        if (i > node && right < rope.start + rope.count)
          share = (right - i) / (right - node);
        positions[i * 3 + axis] += delta * share;
        previous[i * 3 + axis] += delta * share;
      }
    }
    positions.set(target, node * 3);
    previous.set(target, node * 3);
  }

  return {
    get active() {
      return node >= 0;
    },
    grab(index, point) {
      release();
      node = index;
      inverseMass = mass[node];
      mass[node] = 0;
      move(point);
    },
    move,
    pin() {
      if (node < 0) return;
      positions.set(target, node * 3);
      previous.set(target, node * 3);
    },
    release,
  };
}
