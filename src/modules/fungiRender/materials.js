/* eslint-disable camelcase */
import {
  Fn,
  atan,
  attribute,
  color,
  cos,
  float,
  mix,
  mx_fractal_noise_float,
  mx_worley_noise_float,
  mx_worley_noise_vec3,
  normalView,
  positionLocal,
  positionView,
  positionWorld,
  sin,
  smoothstep,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Mikkelsen's surface-gradient bump, fed a procedural height instead of a
// texture (three's bumpMap only samples textures).
export const bumpNormal = Fn(([height, strength]) => {
  const dHdxy = vec2(height.dFdx(), height.dFdy()).mul(strength);
  const sigmaX = positionView.dFdx().normalize();
  const sigmaY = positionView.dFdy().normalize();
  const r1 = sigmaY.cross(normalView);
  const r2 = normalView.cross(sigmaX);
  const det = sigmaX.dot(r1);
  const grad = det.sign().mul(dHdxy.x.mul(r1).add(dHdxy.y.mul(r2)));
  return det.abs().mul(normalView).sub(grad).normalize();
});

function translucent(material, tint, scale) {
  Object.assign(material, {
    thicknessAmbientNode: float(0.05),
    thicknessAttenuationNode: float(0.9),
    thicknessColorNode: tint,
    thicknessDistortionNode: float(0.15),
    thicknessPowerNode: float(4),
    thicknessScaleNode: scale.isNode ? scale : float(scale),
  });
  return material;
}

// Everything a member's materials read. Values change per generation and per
// member; the node graphs never do, so every specimen reuses the same
// compiled pipelines.
export function createMemberUniforms() {
  return {
    accent: uniform(new THREE.Color()),
    cap: uniform(new THREE.Color()),
    capR: uniform(1),
    gillCount: uniform(24),
    glow: uniform(0),
    glowColor: uniform(new THREE.Color()),
    hymenium: uniform(new THREE.Color()),
    spore: uniform(new THREE.Color()),
    stipe: uniform(new THREE.Color()),
    striate: uniform(0),
    basal: uniform(0),
    gloss: uniform(0),
    jelly: uniform(0),
    lattice: uniform(0),
    latticeCells: uniform(10),
    latticeWidth: uniform(0.2),
    maze: uniform(0),
    mazeScale: uniform(10),
    threads: uniform(new THREE.Color()),
    zone: uniform(new THREE.Color()),
    zoneCount: uniform(6),
    zonation: uniform(0),
  };
}

/* eslint-disable no-param-reassign */
export function syncMemberUniforms(u, genome) {
  const { palette } = genome;
  u.accent.value.set(palette.accent);
  u.cap.value.set(palette.cap);
  u.glowColor.value.set(palette.glow);
  u.hymenium.value.set(palette.hymenium);
  u.spore.value.set(palette.spore);
  u.stipe.value.set(palette.stipe);
  u.capR.value = genome.capR;
  u.gillCount.value = Math.max(24, genome.gillCount);
  u.glow.value = genome.glow;
  u.striate.value = genome.striate;
  u.threads.value.set(palette.mycelium);
  u.zone.value.set(palette.zone);
  [
    'basal',
    'gloss',
    'jelly',
    'lattice',
    'latticeCells',
    'latticeWidth',
    'maze',
    'mazeScale',
    'zoneCount',
    'zonation',
  ].forEach((key) => {
    u[key].value = genome[key];
  });
}

// A point on the cap in coordinates that ride with the flesh through every
// morph: the lathe's own angle and its apex-to-margin fraction.
function surfaceCoords() {
  const along = attribute('along', 'float');
  const theta = attribute('theta', 'float');
  return {
    along,
    disc: vec2(cos(theta), sin(theta)).mul(along.pow(0.8)),
    theta,
  };
}

// Voronoi openwork: struts where F2 - F1 is small, holes elsewhere, only in
// the band `amount` reaches in from the margin. Returns the keep mask.
export function latticeMask(cells, width, amount, { along, disc }) {
  const f = mx_worley_noise_vec3(vec3(disc.mul(cells), 0.37), 1, 0);
  const hole = f.y.sub(f.x).greaterThan(width);
  const inBand = along
    .greaterThan(float(1).sub(amount))
    .and(along.greaterThan(0.05))
    .and(amount.greaterThan(0.01));
  return hole.and(inBand).not();
}

// Labyrinth relief: contour lines of warped fbm, which is what a settled
// reaction-diffusion pattern looks like at a glance.
function mazeRidges(u, { along, disc }) {
  const q = vec3(disc.mul(u.mazeScale), along.mul(2));
  const warp = mx_fractal_noise_float(q.mul(0.5), 2, 2, 0.5, 1);
  const n = mx_fractal_noise_float(q.add(warp), 3, 2, 0.5, 1);
  return smoothstep(0.55, 0.85, sin(n.mul(22)).abs());
}

function zoneBands(u, { along, disc }) {
  const wobble = mx_fractal_noise_float(vec3(disc.mul(3), 0.5), 3, 2, 0.5, 1);
  const z = along.mul(u.zoneCount).add(wobble.mul(0.9));
  return {
    band: smoothstep(-0.35, 0.35, sin(z.mul(Math.PI))),
    line: smoothstep(0.93, 1, cos(z.mul(Math.PI)).abs()),
  };
}
/* eslint-enable no-param-reassign */

// Cap flesh: centre-to-margin gradient, mottling, radial striations at the
// margin, fine grain in the bump, a wet coat, and light scattering through the
// thin margin.
export function capMaterial(u) {
  const coords = surfaceCoords();
  const { along } = coords;
  const side = attribute('side', 'float');
  const thin = attribute('thin', 'float');
  const p = positionLocal.div(u.capR);
  const angle = atan(p.z, p.x);
  const mottle = mx_fractal_noise_float(p.mul(3.5), 4, 2, 0.5, 1);
  const grain = mx_fractal_noise_float(p.mul(28), 3, 2, 0.5, 1);
  const center = u.cap.mul(0.55);
  const margin = mix(u.cap, u.accent, 0.25);
  const striae = sin(angle.mul(u.gillCount))
    .mul(0.5)
    .add(0.5)
    .mul(smoothstep(0.55, 1, along))
    .mul(u.striate);
  const { band, line } = zoneBands(u, coords);
  const ridges = mazeRidges(u, coords);
  let top = mix(center, u.cap, smoothstep(0, 0.45, along));
  top = mix(top, margin, smoothstep(0.75, 1, along));
  top = mix(
    top,
    mix(u.cap, u.zone, band).mul(line.mul(-0.45).add(1)),
    u.zonation
  );
  top = top.mul(ridges.mul(u.maze).mul(-0.5).add(1));
  top = top.mul(mottle.mul(0.25).add(0.95)).mul(striae.mul(-0.25).add(1));
  const underside = u.hymenium
    .mul(0.85)
    .mul(ridges.mul(u.maze).mul(-0.4).add(1));

  const material = new THREE.MeshSSSNodeMaterial({ side: THREE.DoubleSide });
  material.colorNode = mix(top, underside, side).mul(0.92);
  material.roughnessNode = float(0.5)
    .add(grain.mul(0.15))
    .mul(u.gloss.mul(-0.65).add(1))
    .mul(u.jelly.mul(-0.4).add(1));
  material.clearcoatNode = u.gloss.max(0.15);
  material.clearcoatRoughnessNode = u.gloss.mul(-0.35).add(0.45);
  material.normalNode = bumpNormal(
    grain
      .mul(0.4)
      .add(mottle.mul(0.6))
      .add(striae.mul(0.3))
      .add(ridges.mul(u.maze).mul(1.2))
      .add(line.mul(u.zonation).mul(0.6)),
    float(0.012)
  );
  material.maskNode = latticeMask(
    u.latticeCells,
    u.latticeWidth,
    u.lattice,
    coords
  );
  material.emissiveNode = u.glowColor
    .mul(u.glow.mul(0.6))
    .mul(side.mul(0.8).add(thin.mul(0.2)));
  // Pale flesh already sits near white; transmitted light is what pushes it
  // past, so it scales with how dark the cap is.
  const darkness = float(1).sub(u.cap.r.max(u.cap.g).max(u.cap.b).mul(0.7));
  return translucent(
    material,
    u.cap.mul(thin.mul(0.7).add(0.05)).mul(darkness),
    u.jelly.mul(10).add(2.5)
  );
}

// The stinkhorn's net skirt: always openwork, finer than any cap lattice.
export function indusiumMaterial(u) {
  const coords = surfaceCoords();
  const material = new THREE.MeshSSSNodeMaterial({ side: THREE.DoubleSide });
  material.colorNode = u.accent;
  material.roughness = 0.6;
  material.maskNode = latticeMask(
    u.latticeCells.mul(1.8),
    float(0.16),
    float(1.2),
    coords
  );
  return translucent(material, u.accent, float(6));
}

export function gillMaterial(u) {
  const along = attribute('along', 'float');
  const streak = mx_fractal_noise_float(positionLocal.mul(40), 2, 2, 0.5, 1);
  const material = new THREE.MeshSSSNodeMaterial({ side: THREE.DoubleSide });
  const ridges = mazeRidges(u, surfaceCoords());
  material.colorNode = u.hymenium
    .mul(streak.mul(0.12).add(0.95))
    .mul(smoothstep(0, 0.25, along).mul(0.25).add(0.75))
    .mul(ridges.mul(u.maze).mul(-0.45).add(1));
  material.roughness = 0.7;
  material.normalNode = bumpNormal(ridges.mul(u.maze), float(0.02));
  material.emissiveNode = u.glowColor.mul(u.glow.mul(1.4));
  return translucent(material, u.hymenium.mul(0.9), 4);
}

// Stipe: long fibrils running its length, a paler apex, and a soil-stained
// base where it leaves the ground.
export function stipeMaterial(u) {
  const along = attribute('along', 'float');
  const p = positionLocal.div(u.capR);
  const fibres = mx_fractal_noise_float(
    vec3(p.x.mul(40), p.y.mul(1.5), p.z.mul(40)),
    3,
    2,
    0.5,
    1
  );
  const tone = mix(
    u.threads,
    u.stipe,
    smoothstep(0, u.basal.mul(0.18).add(0.04), along)
  ).mul(fibres.mul(0.18).add(0.95));
  const material = new THREE.MeshSSSNodeMaterial();
  material.colorNode = mix(tone, u.stipe.mul(1.08), smoothstep(0.8, 1, along));
  material.roughnessNode = float(0.55).add(fibres.mul(0.1));
  material.normalNode = bumpNormal(fibres, float(0.02));
  return translucent(material, u.stipe.mul(0.8), 2);
}

export function sheetMaterial(tint) {
  const material = new THREE.MeshSSSNodeMaterial({ side: THREE.DoubleSide });
  const n = mx_fractal_noise_float(positionLocal.mul(18), 3, 2, 0.5, 1);
  material.colorNode = tint.mul(n.mul(0.15).add(0.92));
  material.roughness = 0.75;
  material.normalNode = bumpNormal(n, float(0.02));
  return translucent(material, tint, 8);
}

export function wartMaterial(u) {
  const material = new THREE.MeshSSSNodeMaterial();
  const n = mx_fractal_noise_float(positionWorld.mul(30), 3, 2, 0.5, 1);
  material.colorNode = u.accent.mul(n.mul(0.2).add(0.9));
  material.roughness = 0.85;
  material.normalNode = bumpNormal(n, float(0.03));
  return translucent(material, u.accent.mul(0.6), 3);
}

export function beadMaterial(u) {
  const material = new THREE.MeshSSSNodeMaterial();
  const n = mx_fractal_noise_float(positionWorld.mul(60), 2, 2, 0.5, 1);
  material.colorNode = u.accent.mul(n.mul(0.15).add(0.92));
  material.roughnessNode = u.gloss.mul(-0.5).add(0.55);
  material.clearcoatNode = u.gloss;
  return translucent(material, u.accent, u.jelly.mul(8).add(4));
}

export function feltMaterial(u) {
  const material = new THREE.MeshSSSNodeMaterial();
  material.colorNode = u.threads;
  material.roughness = 0.5;
  return translucent(material, u.threads, 3);
}

export function hairMaterial(u) {
  const base = mix(u.stipe, color(1, 1, 1), 0.7);
  const material = new THREE.MeshSSSNodeMaterial();
  material.colorNode = base;
  material.roughness = 0.3;
  return translucent(material, base, 3);
}

export function sporeMaterial(u) {
  const material = new THREE.MeshStandardNodeMaterial();
  material.colorNode = u.spore;
  material.emissiveNode = u.spore.mul(0.25).add(u.glowColor.mul(u.glow));
  material.roughness = 0.6;
  return material;
}

export function soilMaterial() {
  const material = new THREE.MeshStandardNodeMaterial();
  const n = mx_fractal_noise_float(positionWorld.mul(3), 5, 2, 0.5, 1);
  const pebbles = mx_worley_noise_float(positionWorld.mul(9));
  material.colorNode = color(0.23, 0.16, 0.1).mul(n.mul(0.35).add(0.9));
  material.roughness = 0.95;
  material.normalNode = bumpNormal(
    n.add(smoothstep(0.25, 0, pebbles).mul(0.6)),
    float(0.05)
  );
  return material;
}

// Hyphae and rhizomorph cords: pale threads that glow where the rim light
// passes through them, with a faint fibrous streak along each strand.
export function myceliumMaterial(tint) {
  const n = mx_fractal_noise_float(positionWorld.mul(22), 2, 2, 0.5, 1);
  const material = new THREE.MeshSSSNodeMaterial();
  material.colorNode = tint.mul(n.mul(0.2).add(0.9));
  material.roughness = 0.6;
  return translucent(material, tint.mul(0.6), 1.5);
}
