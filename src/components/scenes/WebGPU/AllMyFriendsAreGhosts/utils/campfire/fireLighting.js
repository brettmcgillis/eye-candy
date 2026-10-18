import * as THREE from 'three';

// CPU mirror of commonWgsl's lighting in campfire space. LOG_LIFE_OFFSET feeds the shader
// too: GPUs disagree on the original's per-log hash (FMA), so both must read one value.
const f = Math.fround;
const kPI = Math.PI;
const kGoldenRatio = 1.618;
const FIRE_LIGHT = new THREE.Vector3(1.0, 0.18, 0.035).multiplyScalar(
  0.5 / (0.2 * 0.2 * 0.5)
);
const SKY = new THREE.Vector3(0.2, 0.5, 1.0).multiplyScalar(0.005);
const CAMPFIRE_CENTER = new THREE.Vector3(0.05, 0.0, 0.02);
const COALS_CENTER = CAMPFIRE_CENTER.clone().add(new THREE.Vector3(0, -0.1, 0));
const COALS_COLOUR = new THREE.Vector3(1.0, 0.075, 0.01);
const GROUND_ALBEDO = new THREE.Vector3(0.2, 0.15, 0.05);
const COALS_DISK_RADIUS = 0.73;

export const LOGS = [
  [0.2, 0.1, 0.0, kGoldenRatio * kPI, 0.5 * kPI, 0.1, 0.4],
  [0.0, 0.23, 0.0, 2.0 * kGoldenRatio * kPI, 0.41 * kPI, 0.08, 0.6],
  [0.25, 0.21, 0.1, -kGoldenRatio * kPI, 0.28 * kPI, 0.07, 0.25],
  [0.0, 0.33, -0.1, -4.05 * kGoldenRatio * kPI, 0.325 * kPI, 0.06, 0.55],
  [0.23, 0.43, 0.12, 0.0, 0.2 * kPI, 0.06, 0.5],
  [0.19, 0.43, 0.35, 0.5 * kPI, 0.2 * kPI, 0.08, 0.49],
  [-0.05, 0.55, 0.26, 0.8 * kPI, 0.15 * kPI, 0.05, 0.61],
].map(([x, y, z, rotY, rotZ, radius, length]) => {
  const pR = (a, b, angle) => [
    Math.cos(angle) * a + Math.sin(angle) * b,
    Math.cos(angle) * b - Math.sin(angle) * a,
  ];
  const [bx, by] = pR(0, 1, -rotZ);
  const [bx2, bz] = pR(bx, 0, -rotY);
  return {
    burnDir: new THREE.Vector3(bx2, by, bz),
    center: new THREE.Vector3(x, y, z),
    length,
    radius,
    rotY,
    rotZ,
  };
});

const fract = (x) => f(x - Math.floor(x));
const saturate = (x) => Math.min(1, Math.max(0, x));
const linearstep = (a, b, x) => saturate((x - a) / (b - a));
const smoothstepg = (a, b, x) => {
  const t = saturate((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function hash11(input) {
  let p = fract(f(f(input) * f(0.1031)));
  p = f(p * f(p + f(33.33)));
  p = f(p * f(p + p));
  return fract(p);
}

const LOG_RAND = LOGS.map((_, i) => f(f(kGoldenRatio) * i));
export const LOG_LIFE_OFFSET = LOG_RAND.map(
  (rand) => hash11(f(rand * f(657.9759))) * 0.2
);

export const BURN_CYCLE = 'cycle';
export const BURN_HOLD = 'hold';
export const BURN_DOWN = 'burnDown';
export const EMBERS_LIFE = 1 - 80 / 60;

export function globalFireLife(time) {
  const normEnd = 80 / 60;
  const span = normEnd * 1.05;
  const t = time / 60;
  const normTime = t - span * Math.floor(t / span);
  return Math.min(1, 1 - normTime + Math.max(0, (normTime - normEnd) * 30));
}

// One fire level per frame, shared by the shader and the ghost's lights.
export function fireLifeAt({ burnSeconds, hold, mode, startTime, time }) {
  if (mode === BURN_HOLD) return hold;
  if (mode === BURN_DOWN) {
    const progress = Math.min(1, Math.max(0, (time - startTime) / burnSeconds));
    return 1 + (EMBERS_LIFE - 1) * progress;
  }
  return globalFireLife(time);
}

export function diskLight(coneDir, dirToLight, cosAngularRadius, roughness) {
  const vDotL = Math.min(1, Math.max(-1, coneDir.dot(dirToLight)));
  const angular = Math.acos(Math.min(1, Math.max(-1, cosAngularRadius)));
  const brdfDisk = 2 * kPI * (1 - Math.cos(angular + roughness * 0.5 * kPI));
  const disk = 2 * kPI * (1 - cosAngularRadius);
  const brightness = Math.max(0.00001, disk) / Math.max(0.00001, brdfDisk);
  let visibility =
    Math.max(
      0,
      linearstep(
        angular + 0.01 + roughness * kPI * 0.5,
        angular - 0.01 - roughness * kPI * 0.5,
        Math.acos(vDotL)
      )
    ) * 2;
  const power = 7 - 6 * roughness;
  visibility = visibility ** power / Math.max(0.00001, 1 / (power + 1));
  return Math.min(1, visibility * brightness);
}

const toSphere = new THREE.Vector3();
const dirToSphere = new THREE.Vector3();

function sphereVisibility(pos, coneDir, roughness, center, radius) {
  toSphere.subVectors(center, pos);
  const dist = toSphere.length();
  const sqDist = dist * dist;
  const sqRadius = radius * radius;
  const distToDisk =
    (1 / Math.max(0.001, dist)) * Math.max(0.001, sqDist - sqRadius);
  const diskRadius =
    (radius / dist) * Math.sqrt(Math.max(0.001, sqDist - sqRadius));
  const cosR = Math.min(
    1,
    Math.max(-1, distToDisk / Math.hypot(distToDisk, diskRadius))
  );
  dirToSphere.copy(toSphere).divideScalar(dist);
  let visibility = diskLight(coneDir, dirToSphere, cosR, roughness);
  if (dist < radius)
    visibility = THREE.MathUtils.lerp(1, visibility, dist / radius);
  return visibility;
}

const flameCenter = new THREE.Vector3();
const flameTop = new THREE.Vector3();
const startToEnd = new THREE.Vector3();
const scratch = new THREE.Vector3();

// The tube light for one log at the roughness-1 (diffuse) progress, which
// depends on the shaded point only: its centre, radius and brightness factor.
export function logLight(index, time, life, pos, out) {
  const log = LOGS[index];
  const rand = LOG_RAND[index];
  const fireLife = life - LOG_LIFE_OFFSET[index];
  flameCenter
    .copy(log.center)
    .addScaledVector(log.burnDir, (saturate(fireLife) * 2 - 1) * log.length);
  const sqrtLife = Math.sqrt(Math.max(0.0001, fireLife));
  const flameHeight = Math.max(0.15, 0.2 + fireLife * 1.2) * 0.65;
  const flameRadius = (0.1 + sqrtLife) * 0.2 * 0.75;
  flameCenter.y = Math.max(flameCenter.y, flameRadius + 0.05);
  const startRadius = Math.max(0.075, flameRadius);
  flameTop.copy(flameCenter).setY(flameCenter.y + flameHeight);
  startToEnd.subVectors(flameTop, flameCenter);
  const progress = saturate(
    scratch.subVectors(pos, flameCenter).dot(startToEnd) / startToEnd.lengthSq()
  );
  const light = out;
  light.center.lerpVectors(flameCenter, flameTop, progress);
  light.radius = THREE.MathUtils.lerp(startRadius, 0.01, progress);
  light.strength =
    Math.sqrt(saturate(fireLife + 0.1)) *
    (1 +
      Math.sin(rand * 2 - 10 * time) * 0.35 +
      Math.sin(rand * 4 - 15 * time) * 0.25);
  return light;
}

const coneDirScratch = new THREE.Vector3();
const groundHit = new THREE.Vector3();
const campfireToGround = new THREE.Vector3();
const farDiskPoint = new THREE.Vector3();
const toCoals = new THREE.Vector3();
const lightScratch = { center: new THREE.Vector3(), radius: 0, strength: 0 };

export function coalsTerm(pos, coneDir, roughness, life, out) {
  const coneY = coneDir.y === 0 ? 0.0001 : coneDir.y;
  groundHit
    .copy(pos)
    .addScaledVector(coneDir, -(pos.y - COALS_CENTER.y) / coneY);
  campfireToGround.subVectors(groundHit, COALS_CENTER);
  farDiskPoint
    .copy(campfireToGround)
    .normalize()
    .multiplyScalar(COALS_DISK_RADIUS)
    .add(COALS_CENTER);
  toCoals.subVectors(COALS_CENTER, pos).normalize();
  const cosR = scratch.subVectors(farDiskPoint, pos).normalize().dot(toCoals);
  const glow =
    0.1 *
    saturate(10 * (life * 0.75 + 0.25)) *
    diskLight(coneDir, toCoals, cosR, roughness);
  return out.copy(COALS_COLOUR).multiplyScalar(glow);
}

export function groundAndSky(pos, coneDir, roughness, life, out) {
  const coneY = coneDir.y === 0 ? 0.0001 : coneDir.y;
  groundHit
    .copy(pos)
    .addScaledVector(coneDir, -(pos.y - COALS_CENTER.y) / coneY);
  campfireToGround.subVectors(groundHit, COALS_CENTER);
  const sky = scratch.copy(SKY).divideScalar(1 + 0.03 * pos.lengthSq());
  const ground = out
    .copy(GROUND_ALBEDO)
    .multiply(FIRE_LIGHT)
    .multiplyScalar(
      (saturate(life + 0.05) * 0.05) /
        (roughness + 1 + campfireToGround.lengthSq())
    );
  const weight = smoothstepg(
    0.001 + roughness * 1.5,
    -0.001 - roughness * 1.5,
    coneDir.y
  );
  return ground.lerp(sky, 1 - weight);
}

const ambientScratch = new THREE.Vector3();

// computeLightingCone(pos, normal, normal, 1, 1, 1): the diffuse term the
// shader applies to albedo, used to check this mirror against the GPU.
export function diffuseLighting(pos, normal, time, out) {
  const life = globalFireLife(time);
  const coneDir = coneDirScratch.copy(normal).normalize();
  groundAndSky(pos, coneDir, 1, life, out);
  out.add(coalsTerm(pos, coneDir, 1, life, ambientScratch));
  for (let i = 0; i < LOGS.length; i += 1) {
    const light = logLight(i, time, life, pos, lightScratch);
    const visibility = sphereVisibility(
      pos,
      coneDir,
      1,
      light.center,
      light.radius
    );
    out.addScaledVector(FIRE_LIGHT, visibility * light.strength);
  }
  return out;
}

export const FIRE_LIGHT_COLOUR = FIRE_LIGHT;
export const LOG_COUNT = LOGS.length;
export { COALS_CENTER, sphereVisibility };
