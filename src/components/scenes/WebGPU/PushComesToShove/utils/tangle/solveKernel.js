import {
  Fn,
  If,
  Loop,
  Return,
  atomicLoad,
  float,
  floor,
  instanceIndex,
  int,
  ivec3,
  length,
  max,
  min,
  uint,
  vec3,
  vec4,
} from 'three/tsl';

import { cellCoordOf, cellIdFromCoord } from './grid';
import { wireAddress } from './wireKernels';

// One Jacobi sweep, read from `source` and written to `target`: every point
// sums its own share of each constraint it touches, so no point ever reads a
// neighbour mid-update. Pairwise shares are halved because the partner applies
// the other half from its own thread. Cells are one contact wide, so the 2x2x2
// block on the side of the cell a point leans toward holds every neighbour.
export default function createSolve(b, u, layout, source, target) {
  const { gridDims, maxPerCell, pointsPerWire } = layout;

  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(layout.pointCount)), () => {
      Return();
    });
    const { pinned, t, wire } = wireAddress(pointsPerWire);
    const self = source.element(instanceIndex);

    If(pinned, () => {
      target.element(instanceIndex).assign(vec4(self.xyz, 0));
      Return();
    });

    const p = self.xyz.toVar();
    const delta = vec3(0).toVar();
    const crowd = float(0).toVar();

    const before = source.element(instanceIndex.sub(1)).xyz;
    const after = source.element(instanceIndex.add(1)).xyz;
    [before, after].forEach((q) => {
      const offset = p.sub(q);
      const distance = max(length(offset), float(1e-6));
      delta.subAssign(
        offset.mul(distance.sub(u.restLength).div(distance)).mul(0.5)
      );
    });
    delta.addAssign(before.add(after).mul(0.5).sub(p).mul(u.bendStiffness));

    const contact = u.collideRadius.mul(2);
    const scaled = p.sub(u.gridOrigin).div(u.cellSize);
    const lean = ivec3(scaled.sub(floor(scaled)).sub(0.5).sign().min(0));
    const cell = cellCoordOf(p, u, layout).add(lean).toVar();
    Loop({ start: int(0), end: int(2), type: 'int', name: 'oz' }, ({ oz }) => {
      Loop(
        { start: int(0), end: int(2), type: 'int', name: 'oy' },
        ({ oy }) => {
          Loop(
            { start: int(0), end: int(2), type: 'int', name: 'ox' },
            ({ ox }) => {
              const c = cell.add(ivec3(ox, oy, oz)).toVar();
              const inside = c.x
                .greaterThanEqual(0)
                .and(c.y.greaterThanEqual(0))
                .and(c.z.greaterThanEqual(0))
                .and(c.x.lessThan(gridDims[0]))
                .and(c.y.lessThan(gridDims[1]))
                .and(c.z.lessThan(gridDims[2]));
              If(inside, () => {
                const id = cellIdFromCoord(c, layout).toVar();
                const stored = atomicLoad(b.cellCount.element(id)).toVar();
                const count = min(stored, uint(maxPerCell)).toVar();
                Loop(
                  { start: uint(0), end: count, type: 'uint', name: 'k' },
                  ({ k }) => {
                    const j = b.cellItems
                      .element(id.mul(uint(maxPerCell)).add(k))
                      .toVar();
                    const jWire = j.div(uint(pointsPerWire));
                    const jt = j.sub(jWire.mul(uint(pointsPerWire)));
                    const gap = max(jt, t).sub(min(jt, t));
                    const sameStretch = jWire
                      .equal(wire)
                      .and(gap.lessThanEqual(uint(2)));
                    If(sameStretch.not(), () => {
                      const offset = p.sub(source.element(j).xyz);
                      const distance = length(offset);
                      If(
                        distance
                          .lessThan(contact)
                          .and(distance.greaterThan(1e-6)),
                        () => {
                          const overlap = contact.sub(distance);
                          delta.addAssign(
                            offset
                              .div(distance)
                              .mul(overlap.mul(0.5).mul(u.collideStiffness))
                          );
                          crowd.addAssign(overlap.div(contact));
                        }
                      );
                    });
                  }
                );
              });
            }
          );
        }
      );
    });

    Loop(
      { start: uint(0), end: u.sphereCount, type: 'uint', name: 's' },
      ({ s }) => {
        const body = b.bodies.element(s);
        const offset = p.sub(body.xyz);
        const distance = max(length(offset), float(1e-5));
        const reach = body.w.add(u.collideRadius);
        If(distance.lessThan(reach), () => {
          delta.addAssign(offset.div(distance).mul(reach.sub(distance)));
          crowd.addAssign(1);
        });
      }
    );

    const step = length(delta);
    If(step.greaterThan(u.collideRadius), () => {
      delta.mulAssign(u.collideRadius.div(step));
    });
    p.addAssign(delta.mul(u.relaxation));

    const z = p.z.clamp(
      u.zBack.add(u.collideRadius),
      u.zFront.sub(u.collideRadius)
    );
    const x = p.x.clamp(u.gridOrigin.x, u.gridOrigin.x.negate());
    target.element(instanceIndex).assign(vec4(x, p.y, z, crowd));
  })().compute(layout.pointCount);
}
