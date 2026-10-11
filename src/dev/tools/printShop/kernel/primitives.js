// Closed, outward-wound solids in millimetres, Y-up, built around the origin
// and placed by `at`. Used for mounts: bases, stems, flares and loops.

function lathe(profile, segments, at = [0, 0, 0]) {
  // `profile` is [radius, y] from bottom to top; zero-radius ends become
  // single pole vertices so the solid closes without slivers.
  const positions = [];
  const rings = profile.map(([radius, y]) => {
    if (radius === 0) {
      positions.push(at[0], at[1] + y, at[2]);
      return { pole: positions.length / 3 - 1 };
    }
    const start = positions.length / 3;
    for (let s = 0; s < segments; s += 1) {
      const angle = (s / segments) * Math.PI * 2;
      positions.push(
        at[0] + Math.cos(angle) * radius,
        at[1] + y,
        at[2] + Math.sin(angle) * radius
      );
    }
    return { start };
  });
  const indices = [];
  for (let r = 0; r < rings.length - 1; r += 1) {
    const lo = rings[r];
    const hi = rings[r + 1];
    for (let s = 0; s < segments; s += 1) {
      const s1 = (s + 1) % segments;
      if (lo.pole !== undefined) {
        indices.push(lo.pole, hi.start + s, hi.start + s1);
      } else if (hi.pole !== undefined) {
        indices.push(lo.start + s, hi.pole, lo.start + s1);
      } else {
        indices.push(lo.start + s, hi.start + s, hi.start + s1);
        indices.push(lo.start + s, hi.start + s1, lo.start + s1);
      }
    }
  }
  return {
    indices: Uint32Array.from(indices),
    positions: Float64Array.from(positions),
  };
}

export function cylinder(radius, height, { at, segments = 48 } = {}) {
  return lathe(
    [
      [0, 0],
      [radius, 0],
      [radius, height],
      [0, height],
    ],
    segments,
    at
  );
}

// A stem that flares into a pad where it meets a thin shell, so the joint is
// a disc rather than a pin.
export function flaredStem(radius, height, padRadius, padHeight, options = {}) {
  const flareStart = Math.max(0, height - padHeight);
  return lathe(
    [
      [0, 0],
      [radius, 0],
      [radius, flareStart],
      [padRadius, height],
      [0, height],
    ],
    options.segments ?? 48,
    options.at
  );
}

// A torus standing upright in the XY plane (a hanging loop).
export function torus(
  major,
  minor,
  { at = [0, 0, 0], radial = 48, tubular = 16 } = {}
) {
  const positions = [];
  for (let i = 0; i < radial; i += 1) {
    const u = (i / radial) * Math.PI * 2;
    for (let j = 0; j < tubular; j += 1) {
      const v = (j / tubular) * Math.PI * 2;
      const ring = major + minor * Math.cos(v);
      positions.push(
        at[0] + ring * Math.cos(u),
        at[1] + ring * Math.sin(u),
        at[2] + minor * Math.sin(v)
      );
    }
  }
  const indices = [];
  for (let i = 0; i < radial; i += 1) {
    const i1 = (i + 1) % radial;
    for (let j = 0; j < tubular; j += 1) {
      const j1 = (j + 1) % tubular;
      const a = i * tubular + j;
      const b = i1 * tubular + j;
      const c = i1 * tubular + j1;
      const d = i * tubular + j1;
      indices.push(a, b, c, a, c, d);
    }
  }
  return {
    indices: Uint32Array.from(indices),
    positions: Float64Array.from(positions),
  };
}
