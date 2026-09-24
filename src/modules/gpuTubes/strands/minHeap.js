// Binary min-heap of (priority, id) pairs in growable typed arrays; arrays of
// [d, i] tuples made Dijkstra over a million nodes allocation-bound.
export default function createMinHeap(initialCapacity = 1024) {
  let keys = new Float64Array(initialCapacity);
  let ids = new Int32Array(initialCapacity);
  let size = 0;

  const swap = (a, b) => {
    const k = keys[a];
    keys[a] = keys[b];
    keys[b] = k;
    const i = ids[a];
    ids[a] = ids[b];
    ids[b] = i;
  };

  return {
    get size() {
      return size;
    },
    push(key, id) {
      if (size === keys.length) {
        const nextKeys = new Float64Array(size * 2);
        nextKeys.set(keys);
        keys = nextKeys;
        const nextIds = new Int32Array(size * 2);
        nextIds.set(ids);
        ids = nextIds;
      }
      keys[size] = key;
      ids[size] = id;
      let c = size;
      size += 1;
      while (c > 0) {
        const p = Math.floor((c - 1) / 2);
        if (keys[p] <= keys[c]) break;
        swap(p, c);
        c = p;
      }
    },
    // Pops the smallest entry into `out` ([key, id]) and returns it.
    pop(out) {
      /* eslint-disable no-param-reassign, prefer-destructuring */
      out[0] = keys[0];
      out[1] = ids[0];
      /* eslint-enable no-param-reassign, prefer-destructuring */
      size -= 1;
      if (size > 0) {
        keys[0] = keys[size];
        ids[0] = ids[size];
        let c = 0;
        for (;;) {
          const l = c * 2 + 1;
          const r = l + 1;
          let m = c;
          if (l < size && keys[l] < keys[m]) m = l;
          if (r < size && keys[r] < keys[m]) m = r;
          if (m === c) break;
          swap(m, c);
          c = m;
        }
      }
      return out;
    },
  };
}
