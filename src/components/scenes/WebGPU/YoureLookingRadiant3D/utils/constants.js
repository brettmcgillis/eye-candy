// World units are field units: height 1, width the window's aspect, centred on
// the origin, so every size control means exactly what it means in the flat
// scene.

export const MAX_BODIES = 48;

// The air fills well past the farthest the orbit camera can pull back, so the
// camera always starts and stays inside it rather than looking at a hazy box.
export const MAX_CAMERA_DISTANCE = 8;
export const AIR_HALF_EXTENT = MAX_CAMERA_DISTANCE * 1.5;

// One octahedral shadow tile per light, row-major.
export const ATLAS_COLS = 8;
export const ATLAS_ROWS = 6;

// The flat scene's shadow map is one ring of `shadowRays` texels per light; a
// sphere's worth of directions at about the same angular spacing.
export function tileSizeFor(shadowRays) {
  return Math.max(8, Math.round(shadowRays / 16));
}

export function fieldToWorld(out, x, y, z, swarm) {
  return out.set(x - swarm.getAspect() * 0.5, 0.5 - y, z - swarm.depth * 0.5);
}

export function worldToField(out, world, swarm) {
  const { depth } = swarm;
  return out.set(
    world.x + swarm.getAspect() * 0.5,
    0.5 - world.y,
    world.z + depth * 0.5
  );
}
