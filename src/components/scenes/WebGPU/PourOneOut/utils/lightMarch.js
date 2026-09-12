import { Loop, float, hash, int, ivec3 } from 'three/tsl';

import { FLUID, SOLID } from '@modules/flip';

const STEPS = 24;

// Beer-Lambert transmittance along the light ray, marched through the solver's
// own marker grid. Reading the marker rather than a separate density field is
// what makes the obstacles shadow the fluid for free: the pressure solve
// already classified those cells as SOLID.
export default function lightMarch({ grid, marker, origin, salt, uniforms }) {
  const optical = float(0).toVar('optical');
  const jitter = hash(salt).mul(uniforms.shadowStep);

  Loop({ start: 1, end: STEPS + 1, type: 'int', name: 'i' }, ({ i }) => {
    const reach = float(i)
      .mul(uniforms.shadowStep)
      .add(jitter)
      .add(uniforms.shadowBias);
    const cell = ivec3(origin.sub(uniforms.lightDirection.mul(reach)).floor());
    const kind = marker.element(grid.cellIndex(cell));

    const density = kind
      .equal(int(FLUID))
      .select(
        uniforms.shadowDensity,
        kind.equal(int(SOLID)).select(uniforms.shadowSolid, float(0))
      );

    optical.addAssign(grid.inCells(cell).select(density, float(0)));
  });

  return optical.mul(uniforms.shadowStep).negate().exp();
}

export { STEPS as LIGHT_MARCH_STEPS };
