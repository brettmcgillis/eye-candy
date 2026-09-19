import * as THREE from 'three/webgpu';

// The wall is a surface of revolution whose radius and centre both follow the
// profile, so it can never disagree with the stair it encloses. Lofted over
// the visible window on the shared grid and rebuilt only when the walker has
// moved far enough to need it. Cells that a landing's mouth patch redraws are
// left out here; the patch's edge rows and columns are this grid's own, so
// the two meet exactly.
export default function buildShaftWall({ grid, rowFrom, rowTo, patches }) {
  const { cols } = grid;
  const inPatch = (r, c) =>
    patches.some((patch) => {
      if (r < patch.rows[0] || r >= patch.rows[1]) return false;
      const [c0, c1] = patch.cols;
      const span = c1 - c0;
      const rel = (((c - c0) % cols) + cols) % cols;
      return rel < span;
    });

  // Sized up front: a window of the wall is tens of thousands of triangles,
  // and growing a JS array that far is most of the cost of building it.
  let quads = 0;
  for (let r = rowFrom; r < rowTo; r += 1) {
    for (let c = 0; c < cols; c += 1) if (!inPatch(r, c)) quads += 1;
  }
  const positions = new Float32Array(quads * 18);
  const normals = new Float32Array(quads * 18);
  let o = 0;
  const push = (p, n) => {
    positions.set(p, o);
    normals.set(n, o);
    o += 3;
  };
  for (let r = rowFrom; r < rowTo; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (!inPatch(r, c)) {
        const a = grid.ring(r, c);
        const b = grid.ring(r, c + 1);
        const cc = grid.ring(r + 1, c + 1);
        const d = grid.ring(r + 1, c);
        const na = grid.inward(r, c);
        const nb = grid.inward(r, c + 1);
        // Seen from inside: winding chosen so the face points at the axis.
        push(a, na);
        push(d, na);
        push(cc, nb);
        push(a, na);
        push(cc, nb);
        push(b, nb);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return geometry;
}
