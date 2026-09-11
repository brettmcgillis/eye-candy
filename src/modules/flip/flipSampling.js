import { Loop, float, ivec3, vec3 } from 'three/tsl';

// Trilinear sample of ONE staggered component. MAC velocities are stored at
// face centres, so each component is offset by half a cell on the two axes it
// is not aligned with; shifting the query by that half cell is what lets a
// plain trilinear read be correct.
function sampleComponent(grid, buffer, query, pick, tag) {
  const base = ivec3(query.floor()).toConst(`base${tag}`);
  const f = query.sub(vec3(base)).toConst(`frac${tag}`);
  const total = float(0).toVar(`sampled${tag}`);

  Loop({ start: 0, end: 2, type: 'int', name: 'dx' }, ({ dx }) => {
    Loop({ start: 0, end: 2, type: 'int', name: 'dy' }, ({ dy }) => {
      Loop({ start: 0, end: 2, type: 'int', name: 'dz' }, ({ dz }) => {
        const weight = float(dx)
          .equal(0)
          .select(f.x.oneMinus(), f.x)
          .mul(float(dy).equal(0).select(f.y.oneMinus(), f.y))
          .mul(float(dz).equal(0).select(f.z.oneMinus(), f.z));
        const node = buffer.element(grid.velIndex(base.add(ivec3(dx, dy, dz))));
        total.addAssign(pick(node).mul(weight));
      });
    });
  });

  return total;
}

let tagSeed = 0;

export default function sampleVelocity(grid, buffer, position) {
  tagSeed += 1;
  const tag = tagSeed;
  return vec3(
    sampleComponent(
      grid,
      buffer,
      vec3(position.x, position.y.sub(0.5), position.z.sub(0.5)),
      (node) => node.x,
      `X${tag}`
    ),
    sampleComponent(
      grid,
      buffer,
      vec3(position.x.sub(0.5), position.y, position.z.sub(0.5)),
      (node) => node.y,
      `Y${tag}`
    ),
    sampleComponent(
      grid,
      buffer,
      vec3(position.x.sub(0.5), position.y.sub(0.5), position.z),
      (node) => node.z,
      `Z${tag}`
    )
  );
}
