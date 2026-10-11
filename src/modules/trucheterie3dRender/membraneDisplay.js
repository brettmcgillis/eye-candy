import {
  Fn,
  If,
  instanceIndex,
  instancedArray,
  int,
  uint,
  vec3,
  vec4,
} from 'three/tsl';

import { membraneLevels } from '@modules/trucheterie3d';

import {
  RING,
  createNormalPass,
  gridVertex,
  isPinned,
  wrapColumn,
} from './membraneGrid';

const SMOOTHING = 0.18;
// The reference's render topology on the GPU: per level, Loop subdivision
// with every strip edge a crease (3/4 · 1/8 · 1/8 along it, plain midpoints
// on it), then `level` Laplacian passes at 0.18 that leave the creases be;
// at the end the pinned simulation vertices snap back to where they are
// pinned, and normals are taken off the finest grid. The strips are regular
// triangulated grids at every level, so each stencil is fixed and no
// per-vertex stencil tables are needed.
export default function createMembraneDisplay(membrane, solver, level) {
  const { index, levels, sampleOf } = membraneLevels(membrane, level);
  const tables = levels.map(({ table }, l) =>
    instancedArray(table, 'vec4').setName(`membraneStrips${l}`)
  );
  const layouts = levels.map(({ layout }, l) =>
    layout ? instancedArray(layout, 'vec4').setName(`membraneLayout${l}`) : null
  );
  const grids = levels.map(({ count }, l) =>
    l > 0
      ? [
          instancedArray(count, 'vec4').setName(`membraneGrid${l}A`),
          instancedArray(count, 'vec4').setName(`membraneGrid${l}B`),
        ]
      : null
  );
  const top = levels[level];
  const finalGrid = level > 0 ? grids[level][level % 2] : solver.positions;
  const normals = instancedArray(top.count, 'vec4').setName('membraneNormal');

  const subdivide = (l) => {
    const parent = l === 1 ? solver.positions : grids[l - 1][(l - 1) % 2];
    const table = tables[l - 1];
    return Fn(() => {
      const i = instanceIndex;
      const v = gridVertex(layouts[l], i);
      const p = table.element(uint(v.strip));
      const pBase = int(p.x);
      const pCols = int(p.y);
      const pRows = int(p.z);
      const at = (c, k) =>
        parent.element(
          uint(pBase.add(wrapColumn(c, pCols, v.loop).mul(pRows)).add(k))
        ).xyz;
      const ci = v.col.div(2);
      const kj = v.row.div(2);
      const oddCol = v.col.mod(2).equal(1);
      const oddRow = v.row.mod(2).equal(1);
      const atEnd = (c) =>
        v.loop.not().and(c.equal(0).or(c.equal(pCols.sub(1))));
      const onRowEdge = kj.equal(0).or(kj.equal(pRows.sub(1)));
      const out = vec3(0).toVar();

      If(oddCol.not().and(oddRow.not()), () => {
        const here = at(ci, kj);
        If(onRowEdge.and(atEnd(ci).not()), () => {
          out.assign(
            here.mul(0.75).add(
              at(ci.sub(1), kj)
                .add(at(ci.add(1), kj))
                .mul(0.125)
            )
          );
        })
          .ElseIf(atEnd(ci).and(onRowEdge.not()), () => {
            out.assign(
              here.mul(0.75).add(
                at(ci, kj.sub(1))
                  .add(at(ci, kj.add(1)))
                  .mul(0.125)
              )
            );
          })
          .ElseIf(atEnd(ci), () => {
            const along = ci.equal(0).select(ci.add(1), ci.sub(1));
            const across = kj.equal(0).select(kj.add(1), kj.sub(1));
            out.assign(
              here.mul(0.75).add(at(along, kj).add(at(ci, across)).mul(0.125))
            );
          })
          .Else(() => {
            const ring = vec3(0).toVar();
            RING.forEach(([dc, dk]) => {
              ring.addAssign(at(ci.add(dc), kj.add(dk)));
            });
            out.assign(here.mul(10 / 16).add(ring.mul(1 / 16)));
          });
      })
        .ElseIf(oddCol.and(oddRow.not()), () => {
          const a = at(ci, kj);
          const b = at(ci.add(1), kj);
          If(onRowEdge, () => {
            out.assign(a.add(b).mul(0.5));
          }).Else(() => {
            out.assign(
              a
                .add(b)
                .mul(3 / 8)
                .add(
                  at(ci.add(1), kj.add(1))
                    .add(at(ci, kj.sub(1)))
                    .mul(1 / 8)
                )
            );
          });
        })
        .ElseIf(oddCol.not().and(oddRow), () => {
          const a = at(ci, kj);
          const b = at(ci, kj.add(1));
          If(atEnd(ci), () => {
            out.assign(a.add(b).mul(0.5));
          }).Else(() => {
            out.assign(
              a
                .add(b)
                .mul(3 / 8)
                .add(
                  at(ci.add(1), kj.add(1))
                    .add(at(ci.sub(1), kj))
                    .mul(1 / 8)
                )
            );
          });
        })
        .Else(() => {
          out.assign(
            at(ci, kj)
              .add(at(ci.add(1), kj.add(1)))
              .mul(3 / 8)
              .add(
                at(ci, kj.add(1))
                  .add(at(ci.add(1), kj))
                  .mul(1 / 8)
              )
          );
        });
      grids[l][0].element(i).assign(vec4(out, 0));
    })()
      .compute(levels[l].count)
      .setName(`membraneSubdivide${l}`);
  };

  const smooth = (l, read, write) =>
    Fn(() => {
      const i = instanceIndex;
      const v = gridVertex(layouts[l], i);
      const here = read.element(i).xyz;
      const edge = v.row
        .equal(0)
        .or(v.row.equal(v.rows.sub(1)))
        .or(v.loop.not().and(v.col.equal(0).or(v.col.equal(v.cols.sub(1)))));
      If(edge, () => {
        write.element(i).assign(vec4(here, 0));
      }).Else(() => {
        const ring = vec3(0).toVar();
        RING.forEach(([dc, dk]) => {
          const c = wrapColumn(v.col.add(dc), v.cols, v.loop);
          ring.addAssign(
            read.element(uint(v.base.add(c.mul(v.rows)).add(v.row.add(dk)))).xyz
          );
        });
        write
          .element(i)
          .assign(
            vec4(here.mul(1 - SMOOTHING).add(ring.mul(SMOOTHING / 6)), 0)
          );
      });
    })()
      .compute(levels[l].count)
      .setName(`membraneSmooth${l}`);

  const snap =
    level > 0
      ? Fn(() => {
          const i = instanceIndex;
          const v = gridVertex(layouts[level], i);
          const step = 2 ** level;
          If(v.col.mod(step).equal(0).and(v.row.mod(step).equal(0)), () => {
            const sim = tables[0].element(uint(v.strip));
            const s = uint(
              int(sim.x)
                .add(v.col.div(step).mul(int(sim.z)))
                .add(v.row.div(step))
            );
            If(isPinned(solver.rest.element(s).w), () => {
              finalGrid.element(i).assign(solver.positions.element(s));
            });
          });
        })()
          .compute(top.count)
          .setName('membraneSnap')
      : null;

  const shade = createNormalPass({
    count: top.count,
    layout: level > 0 ? layouts[level] : solver.layout,
    name: 'membraneNormals',
    normals,
    positions: finalGrid,
  });

  const passes = [];
  for (let l = 1; l <= level; l += 1) {
    passes.push(subdivide(l));
    for (let p = 0; p < l; p += 1) {
      passes.push(smooth(l, grids[l][p % 2], grids[l][(p + 1) % 2]));
    }
  }

  return {
    count: top.count,
    index,
    normals,
    pitch: solver.pitch,
    positions: finalGrid,
    sampleOf,

    // Re-derives the display surface from the solver's current positions.
    update(renderer) {
      passes.forEach((pass) => renderer.compute(pass));
      if (snap) renderer.compute(snap);
      renderer.compute(shade);
    },

    dispose() {
      [...tables, ...layouts, ...grids.flat(), normals]
        .filter(Boolean)
        .forEach((buffer) => buffer.value.dispose?.());
    },
  };
}
