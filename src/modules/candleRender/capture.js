import * as THREE from 'three/webgpu';

const vertex = new THREE.Vector3();

// The wax mesh in world space with the world → candle matrix its slices
// are cut in.
export function readWax(solids) {
  let wax = null;
  solids.updateWorldMatrix(true, true);
  solids.traverse((object) => {
    if (object.userData.wax) wax = object;
  });
  if (!wax) return null;
  const { position } = wax.geometry.attributes;
  const world = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i).applyMatrix4(wax.matrixWorld);
    world[i * 3] = vertex.x;
    world[i * 3 + 1] = vertex.y;
    world[i * 3 + 2] = vertex.z;
  }
  return {
    index: Uint32Array.from(wax.geometry.index.array),
    inverse: Array.from(wax.matrixWorld.clone().invert().elements),
    position: world,
  };
}

// Every candle mesh (wax, wicks, carbon), for a depth pass with no flame,
// smoke or floor in it.
export function candleMeshes(solids) {
  const found = [];
  solids?.traverseVisible((object) => {
    if (object.isMesh) found.push(object);
  });
  return found;
}

// The sim's dye field once per flame copy, with each box's local ↔ world
// matrices, for the plot's isotherms.
export async function readFlameFields(effects) {
  if (!effects?.sim) return [];
  const field = await effects.sim.read();
  return effects.sim.boxes.map(({ centre, mirrored }) => {
    const matrix = new THREE.Matrix4()
      .makeRotationZ(mirrored ? Math.PI : 0)
      .setPosition(...centre);
    return {
      field,
      inverse: Array.from(matrix.clone().invert().elements),
      matrix: Array.from(matrix.elements),
    };
  });
}

// Live smoke particles in world space with their opacity, for the stipple.
export async function readSmokeDots(effects) {
  return effects?.smoke ? effects.smoke.read() : [];
}

// A stylised look's smoke (cartoon puffs, clay balls) as world centres and
// radii, for the plot's circles.
export async function readSmokeBalls(effects) {
  return effects?.smoke?.readBalls ? effects.smoke.readBalls() : [];
}

// Hides or shows everything tagged as an effect (flames and smoke), for the
// with / without renders a legacy plot contours. The drawables beneath a tag
// are toggled, not the tagged group: the legacy flames set their group's
// visibility every frame.
export function showEffects(scene, kind, shown) {
  scene.traverse((object) => {
    const { effect } = object.userData;
    if (effect === kind || (kind === 'all' && effect)) {
      object.traverse((part) => {
        if (part.isMesh || part.isSprite || part.isPoints || part.isLine) {
          // eslint-disable-next-line no-param-reassign
          part.visible = shown;
        }
      });
    }
  });
}

// Per-pixel brightness gained when `kind` is shown, 0–1, from two renders.
export function effectGlow(withIt, without) {
  const { data, height, width } = withIt;
  const out = new Float32Array(width * height);
  for (let i = 0; i < out.length; i += 1) {
    const lum = (d) =>
      (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
    out[i] = Math.max(0, lum(data) - lum(without.data));
  }
  return { data: out, height, width };
}
