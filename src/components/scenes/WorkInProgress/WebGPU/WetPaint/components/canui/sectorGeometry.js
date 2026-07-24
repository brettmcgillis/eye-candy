import * as THREE from 'three';

// Curved-label helpers: each settings decal is an open cylinder SECTOR
// sharing the can's axis and (slightly padded) radius, so it wraps the can
// like a printed label by construction instead of floating in front of it.
// CylinderGeometry's UVs run u along the arc and v up the height — the same
// clean 0..1 grid a plane has — so the decals' click/drag uv math is
// unchanged by the curvature.
//
// The arc is centered on the can's local +X (theta = PI/2 in three's
// cylinder parameterization, where x = r*sin(theta), z = r*cos(theta)) —
// the side the color-select camera faces after WetPaint's
// COLOR_SELECT_ROTATION. u=0 lands on the viewer's left.

export function createSectorGeometry({ arc, height, radius }) {
  return new THREE.CylinderGeometry(
    radius,
    radius,
    height,
    24,
    1,
    true,
    Math.PI / 2 - arc / 2,
    arc
  );
}

// uv on the sector -> local-space point on (or just off) its surface, for
// placing knobs/indicator dots against the curved label. `lift` pushes the
// point radially outward so markers sit proud of the label.
export function sectorPointFromUv({ arc, height, lift = 0, radius, uv }) {
  const theta = Math.PI / 2 - arc / 2 + uv.x * arc;
  const r = radius + lift;
  return [r * Math.sin(theta), (uv.y - 0.5) * height, r * Math.cos(theta)];
}
