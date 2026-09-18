import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createRng } from '@modules/flora';
import { GROW_KEYS } from '@modules/fungi';

import {
  capGeometry,
  capSurfacePoint,
  gillGeometry,
  sheetGeometry,
  stipeGeometry,
} from './geometry';
import {
  beadMaterial,
  capMaterial,
  createMemberUniforms,
  feltMaterial,
  gillMaterial,
  hairMaterial,
  indusiumMaterial,
  myceliumMaterial,
  sheetMaterial,
  soilMaterial,
  sporeMaterial,
  stipeMaterial,
  syncMemberUniforms,
  wartMaterial,
} from './materials';

const UP = new THREE.Vector3(0, 1, 0);
const TAU = Math.PI * 2;
const FRAMES = GROW_KEYS.length + 1;
const HAIRINESS = {
  amanita: 0,
  bolete: 0.1,
  chanterelle: 0.1,
  hedgehog: 0.2,
  inkcap: 0.8,
  morel: 0.1,
  mycena: 1,
  parasol: 0.6,
  puffball: 0.3,
};
const SPORES = 160;
const MAX_SCALE = 3;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth01 = (v) => {
  const t = clamp(v, 0, 1);
  return t * t * (3 - 2 * t);
};

// Weights over [growth keyframes..., rot frame]: the two keyframes either side
// of `grow`, then the whole blend eased toward the rotted frame.
function frameWeights(grow, rot) {
  const weights = new Array(FRAMES).fill(0);
  let k = GROW_KEYS.length - 2;
  for (let i = 0; i < GROW_KEYS.length - 1; i += 1) {
    if (grow <= GROW_KEYS[i + 1]) {
      k = i;
      break;
    }
  }
  const f = clamp(
    (grow - GROW_KEYS[k]) / (GROW_KEYS[k + 1] - GROW_KEYS[k]),
    0,
    1
  );
  weights[k] = (1 - f) * (1 - rot);
  weights[k + 1] = f * (1 - rot);
  weights[FRAMES - 1] = rot;
  return weights;
}

function blendArray(frames, weights, key) {
  const out = new Float32Array(frames[0][key].length);
  weights.forEach((w, f) => {
    if (w === 0) return;
    const source = frames[f][key];
    for (let i = 0; i < out.length; i += 1) out[i] += source[i] * w;
  });
  return out;
}

function blendProfile(frames, weights) {
  const scalar = (read) =>
    weights.reduce((sum, w, f) => sum + w * read(frames[f]), 0);
  return {
    capOrigin: [scalar((p) => p.capOrigin[0]), scalar((p) => p.capOrigin[1])],
    capTilt: scalar((p) => p.capTilt),
    edge: blendArray(frames, weights, 'edge'),
    stipe: blendArray(frames, weights, 'stipe'),
    top: blendArray(frames, weights, 'top'),
    under: blendArray(frames, weights, 'under'),
  };
}

// One geometry per keyframe, the first kept as the base and the rest folded
// in as absolute morph targets, so the GPU blends between stages.
function morphGeometry(frames, build) {
  const geometries = frames.map(build);
  const [base] = geometries;
  base.morphAttributes.position = geometries
    .slice(1)
    .map((g) => g.getAttribute('position'));
  base.morphAttributes.normal = geometries
    .slice(1)
    .map((g) => g.getAttribute('normal'));
  base.morphTargetsRelative = false;
  return base;
}

// Instanced layers grow from an empty live count. three binds instanceMatrix
// as a uniform when the LIVE count fits 64KB but binds the whole capacity, so
// any layer allocated past 1024 fails; storage is chosen regardless of count.
function storageMatrices(mesh) {
  // eslint-disable-next-line no-param-reassign
  mesh.instanceMatrix = new THREE.StorageInstancedBufferAttribute(
    mesh.instanceMatrix.array,
    16
  );
  return mesh;
}

// Morphing and per-frame instance matrices move geometry far from the bounds
// three would cull against.
function prepare(object) {
  Object.assign(object, {
    castShadow: true,
    frustumCulled: false,
    receiveShadow: true,
  });
  return object;
}

function stipeAt(stipe, v) {
  const n = stipe.length / 3;
  const t = clamp(v, 0, 1) * (n - 1);
  const k = Math.min(n - 2, Math.floor(t));
  const f = t - k;
  const at = (o) =>
    stipe[k * 3 + o] + (stipe[k * 3 + 3 + o] - stipe[k * 3 + o]) * f;
  return { r: at(0), x: at(2), y: at(1) };
}

function edgeAt(edge, along) {
  const n = edge.length / 2;
  const t = (1 - clamp(along, 0, 1)) * (n - 1);
  const k = Math.min(n - 2, Math.floor(t));
  const f = t - k;
  return [
    edge[k * 2] + (edge[k * 2 + 2] - edge[k * 2]) * f,
    edge[k * 2 + 1] + (edge[k * 2 + 3] - edge[k * 2 + 1]) * f,
  ];
}

function poreCurve(p) {
  const pores = new Float32Array(p.edge.length + 2);
  pores.set(p.under.subarray(0, 2));
  pores.set(p.edge, 2);
  return pores;
}

function buildMember(member, index, disposables, crowd) {
  const { genome } = member;
  const seed = index * 17.3 + 1;
  const rng = createRng(`member-look-${index}`);
  const frames = [...member.keyframes.grow, member.keyframes.rot];
  const u = createMemberUniforms();
  syncMemberUniforms(u, genome);
  const mats = {
    cap: capMaterial(u),
    flake: sheetMaterial(u.accent),
    gill: gillMaterial(u),
    hair: hairMaterial(u),
    sheet: sheetMaterial(u.accent),
    spore: sporeMaterial(u),
    stipe: stipeMaterial(u),
    wart: wartMaterial(u),
    bead: beadMaterial(u),
    felt: feltMaterial(u),
    indusium: indusiumMaterial(u),
  };
  disposables.push(...Object.values(mats));

  const root = new THREE.Group();
  const morphs = [];
  const addMorph = (parent, build, material) => {
    const geometry = morphGeometry(frames, build);
    disposables.push(geometry);
    const mesh = prepare(new THREE.Mesh(geometry, material));
    parent.add(mesh);
    morphs.push(mesh);
  };
  const instanced = (geometry, material, count) => {
    disposables.push(geometry);
    const mesh = prepare(
      storageMatrices(
        new THREE.InstancedMesh(geometry, material, Math.max(1, count))
      )
    );
    mesh.count = 0;
    return mesh;
  };

  const tiny = genome.plan === 'sporangium';
  const capSegments = tiny
    ? 28
    : Math.max(24, Math.round(96 * genome.arc * (crowd ? 0.7 : 1)));
  addMorph(root, (p) => stipeGeometry(p, tiny ? 12 : 64), mats.stipe);
  if (genome.indusium > 0) {
    addMorph(root, (p) => sheetGeometry(p.indusium, 1, 128), mats.indusium);
  }
  if (genome.ring > 0) {
    addMorph(root, (p) => sheetGeometry(p.veil), mats.sheet);
  }
  if (genome.volva > 0) {
    addMorph(root, (p) => sheetGeometry(p.volva), mats.sheet);
  }

  const caps = [{ scale: 1, v: 1 }, ...frames[0].tiers].map((tier) => {
    const group = new THREE.Group();
    group.scale.setScalar(tier.scale);
    addMorph(group, (p) => capGeometry(p, genome, seed, capSegments), mats.cap);
    if (['gills', 'ridges', 'teeth'].includes(genome.hymenium)) {
      addMorph(group, (p) => gillGeometry(p, genome, seed), mats.gill);
    } else if (genome.hymenium === 'pores') {
      addMorph(
        group,
        (p) => sheetGeometry(poreCurve(p), genome.arc),
        mats.gill
      );
    }
    root.add(group);
    return { group, tier };
  });

  const wartCount = member.warts.length / 3;
  const warts =
    wartCount > 0
      ? instanced(new THREE.IcosahedronGeometry(1, 2), mats.wart, wartCount)
      : null;

  const flakeCount = Math.round(genome.scales * 320);
  const flakeParams = Array.from({ length: flakeCount }, () => ({
    along: rng.range(0.12, 0.97) ** 0.7,
    size: rng.range(0.035, 0.07),
    theta: rng() * TAU,
  }));
  let flakes = null;
  if (flakeCount >= 10) {
    const flake = new THREE.CircleGeometry(1, 6);
    flake.scale(1, 1.4, 1);
    flake.translate(0, -0.9, 0);
    flakes = instanced(flake, mats.flake, flakeCount);
  }

  const hairBase = tiny
    ? 0
    : Math.round(
        ((HAIRINESS[genome.archetype] ?? 0.3) + genome.alien * 0.6) * 700
      );
  const hairParams = Array.from(
    { length: hairBase >= 20 ? hairBase * MAX_SCALE : 0 },
    () => ({
      dir: [rng.signed() * 0.4, rng.range(-0.7, 0.3), rng.signed() * 0.4],
      len: rng.range(0.25, 1),
      theta: rng() * TAU,
      v: rng.range(0.08, 0.92) ** 0.8,
    })
  );
  let hairs = null;
  if (hairParams.length > 0) {
    const hair = new THREE.CylinderGeometry(0.0008, 0.0018, 1, 3, 1);
    hair.translate(0, 0.5, 0);
    hairs = instanced(hair, mats.hair, hairParams.length);
    root.add(hairs);
  }

  const beadCount = Math.round(genome.beads * (tiny ? 90 : 420));
  const beadParams = Array.from({ length: beadCount }, () => ({
    along: tiny ? rng.range(0.02, 0.98) : Math.sqrt(rng()) * 0.97,
    size: genome.beadSize * rng.range(0.55, 1.3),
    squash: rng.range(0.55, 0.9),
    theta: rng() * TAU,
  }));
  const beads =
    beadCount > 0
      ? instanced(new THREE.IcosahedronGeometry(1, 2), mats.bead, beadCount)
      : null;

  const fibreCount = Math.round(genome.capillitium * (tiny ? 70 : 260));
  const fibreParams = Array.from({ length: fibreCount }, () => ({
    along: rng.range(0.05, 0.98),
    dir: [rng.signed(), rng.signed(), rng.signed()],
    len: rng.range(0.4, 1.6),
    theta: rng() * TAU,
  }));
  let fibres = null;
  if (fibreCount > 0) {
    const fibre = new THREE.CylinderGeometry(0.0006, 0.0012, 1, 3, 1);
    fibre.translate(0, 0.5, 0);
    fibres = instanced(fibre, mats.hair, fibreCount);
  }

  const feltCount = tiny ? 0 : Math.round(genome.basal * 360);
  const feltParams = Array.from({ length: feltCount }, () => ({
    dir: [rng.signed() * 0.5, rng.range(-0.9, 0.1), rng.signed() * 0.5],
    len: rng.range(0.4, 1.8),
    theta: rng() * TAU,
    v: rng() ** 1.6 * 0.14,
  }));
  let felt = null;
  if (feltCount > 0) {
    const strand = new THREE.CylinderGeometry(0.0008, 0.0016, 1, 3, 1);
    strand.translate(0, 0.5, 0);
    felt = instanced(strand, mats.felt, feltCount);
    root.add(felt);
  }

  const sporeParams = Array.from({ length: SPORES * MAX_SCALE }, () => ({
    along: rng.range(0.25, 1),
    drift: [rng.signed(), rng.signed()],
    fall: rng.range(0.6, 1.4),
    phase: rng.range(0, 0.65),
    theta: rng() * TAU,
  }));
  const spores = instanced(
    new THREE.IcosahedronGeometry(1, 0),
    mats.spore,
    sporeParams.length
  );
  [warts, flakes, spores, beads, fibres]
    .filter(Boolean)
    .forEach((mesh) => caps[0].group.add(mesh));

  const up = new THREE.Vector3(...member.up).normalize();
  root.quaternion
    .setFromUnitVectors(UP, up)
    .multiply(new THREE.Quaternion().setFromAxisAngle(UP, member.yaw));
  root.position.set(...member.position);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const turn = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const look = new THREE.Matrix4();
  const origin = new THREE.Vector3();
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const point = { normal: new THREE.Vector3(), position: new THREE.Vector3() };
  let latest = null;
  const surface = (along, theta, shapeSeed = seed) =>
    capSurfacePoint(latest, genome, shapeSeed, along, theta, point);
  let last = null;
  let lastCoarse = null;

  function placeWarts(p, grow) {
    for (let i = 0; i < wartCount; i += 1) {
      const along = member.warts[i * 3];
      const theta = member.warts[i * 3 + 1];
      const size = member.warts[i * 3 + 2] * genome.capR * grow;
      const { normal, position } = surface(along, theta);
      q.setFromUnitVectors(UP, normal).multiply(
        turn.setFromAxisAngle(UP, theta * 7.1)
      );
      const squash = 0.25 + ((i * 0.618) % 1) * 0.25;
      m.compose(
        position.addScaledVector(normal, -size * 0.05),
        q,
        s.set(size * 0.8, size * squash, size * 0.6)
      );
      warts.setMatrixAt(i, m);
    }
    warts.count = wartCount;
    warts.instanceMatrix.needsUpdate = true;
  }

  function placeFlakes(p, grow) {
    flakeParams.forEach(({ along, size, theta }, i) => {
      const { normal, position } = surface(along, theta, 0);
      va.set(Math.cos(theta), 0, Math.sin(theta));
      vb.copy(normal)
        .lerp(va, 0.1 + along * 0.15)
        .normalize();
      vc.set(Math.cos(theta), -1, Math.sin(theta)).normalize();
      look.lookAt(origin, vb, vc);
      q.setFromRotationMatrix(look);
      const r = genome.capR * size * (1.1 - along * 0.5) * grow;
      m.compose(position.addScaledVector(normal, r * 0.1), q, s.set(r, r, r));
      flakes.setMatrixAt(i, m);
    });
    flakes.count = flakeCount;
    flakes.instanceMatrix.needsUpdate = true;
  }

  function placeHairs(p, grow, amount) {
    const count = Math.min(hairParams.length, Math.round(hairBase * amount));
    const length = genome.capR * 0.2 * grow;
    for (let i = 0; i < count; i += 1) {
      const h = hairParams[i];
      const at = stipeAt(p.stipe, h.v);
      va.set(Math.cos(h.theta), 0, Math.sin(h.theta));
      vb.copy(va)
        .multiplyScalar(0.8)
        .add(vc.set(h.dir[0], h.dir[1], h.dir[2]))
        .normalize();
      q.setFromUnitVectors(UP, vb);
      m.compose(
        vc.set(at.x + va.x * at.r * 0.95, at.y, va.z * at.r * 0.95),
        q,
        s.set(1, length * h.len * (1 - h.v * 0.5), 1)
      );
      hairs.setMatrixAt(i, m);
    }
    hairs.count = count;
    hairs.instanceMatrix.needsUpdate = true;
  }

  function placeBeads(p, grow) {
    beadParams.forEach((b, i) => {
      const { normal, position } = surface(b.along, b.theta);
      const r = genome.capR * b.size * grow;
      q.setFromUnitVectors(UP, normal);
      m.compose(
        position.addScaledVector(normal, r * 0.25),
        q,
        s.set(r, r * b.squash, r)
      );
      beads.setMatrixAt(i, m);
    });
    beads.count = beadCount;
    beads.instanceMatrix.needsUpdate = true;
  }

  // The capillitium: a burst of fine threads off the head, the way an
  // Arcyria's net springs out of its peridium once it ripens.
  function placeFibres(p, grow) {
    const reach = smooth01((grow - 0.6) / 0.4);
    fibreParams.forEach((f, i) => {
      const { normal, position } = surface(f.along, f.theta);
      vb.copy(normal)
        .add(va.set(f.dir[0], f.dir[1], f.dir[2]).multiplyScalar(0.7))
        .normalize();
      q.setFromUnitVectors(UP, vb);
      m.compose(
        position,
        q,
        s.set(1, genome.capR * f.len * genome.capillitium * reach, 1)
      );
      fibres.setMatrixAt(i, m);
    });
    fibres.count = reach > 0 ? fibreCount : 0;
    fibres.instanceMatrix.needsUpdate = true;
  }

  // Mycelial felt where the stipe leaves the ground, so the fruiting body
  // and its threads read as one tissue.
  function placeFelt(p, grow) {
    const length = genome.stipeR * grow;
    feltParams.forEach((f, i) => {
      const at = stipeAt(p.stipe, f.v);
      va.set(Math.cos(f.theta), 0, Math.sin(f.theta));
      vb.copy(va)
        .add(vc.set(f.dir[0], f.dir[1], f.dir[2]))
        .normalize();
      q.setFromUnitVectors(UP, vb);
      m.compose(
        vc.set(at.x + va.x * at.r, at.y, va.z * at.r),
        q,
        s.set(1, length * f.len, 1)
      );
      felt.setMatrixAt(i, m);
    });
    felt.count = feltCount;
    felt.instanceMatrix.needsUpdate = true;
  }

  // Spores fall from the hymenium in a staggered puff and shrink as they go.
  function placeSpores(p, spore, amount) {
    const count =
      spore > 0 && spore < 1
        ? Math.min(sporeParams.length, Math.round(SPORES * amount))
        : 0;
    const drop = genome.capR * 2.2;
    for (let i = 0; i < count; i += 1) {
      const sp = sporeParams[i];
      const tau = clamp((spore - sp.phase) / 0.35, 0, 1);
      const [r, y] = edgeAt(p.edge, sp.along);
      const size =
        tau > 0 && tau < 1 ? genome.capR * 0.012 * (1 - tau * 0.6) : 0;
      m.compose(
        s.set(
          Math.cos(sp.theta) * r + sp.drift[0] * drop * 0.35 * tau,
          y - drop * sp.fall * tau * tau,
          Math.sin(sp.theta) * r + sp.drift[1] * drop * 0.35 * tau
        ),
        q.identity(),
        va.set(size, size, size)
      );
      spores.setMatrixAt(i, m);
    }
    spores.count = count;
    spores.instanceMatrix.needsUpdate = true;
  }

  function update(levels, config) {
    const spore = levels.spore ?? 0;
    const key = [
      levels.grow.toFixed(4),
      levels.rot.toFixed(4),
      spore.toFixed(4),
      config.hairAmount,
      config.sporeAmount,
    ].join('|');
    if (key === last) return;
    last = key;

    const weights = frameWeights(levels.grow, levels.rot);
    morphs.forEach((mesh) => {
      weights.slice(1).forEach((w, i) => {
        // eslint-disable-next-line no-param-reassign
        mesh.morphTargetInfluences[i] = w;
      });
    });
    const p = blendProfile(frames, weights);
    latest = p;
    const n = p.stipe.length / 3;
    caps.forEach((cap) => {
      const { group, tier } = cap;
      if (tier.v === 1) {
        group.position.set(p.capOrigin[0], p.capOrigin[1], 0);
      } else {
        const k = Math.round(tier.v * (n - 1)) * 3;
        group.position.set(p.stipe[k + 2], p.stipe[k + 1], 0);
      }
      group.rotation.z = -p.capTilt;
    });

    // Morphs and spores move every frame; the surface extras only need to
    // follow the flesh closely enough not to float, so they step.
    const coarse = [
      Math.round(levels.grow * 90),
      Math.round(levels.rot * 60),
      config.hairAmount,
    ].join('|');
    if (coarse !== lastCoarse) {
      lastCoarse = coarse;
      if (warts) placeWarts(p, levels.grow);
      if (flakes) placeFlakes(p, levels.grow);
      if (hairs) placeHairs(p, levels.grow, config.hairAmount);
      if (beads) placeBeads(p, levels.grow);
      if (fibres) placeFibres(p, levels.grow);
      if (felt) placeFelt(p, levels.grow);
    }
    placeSpores(p, spore, config.sporeAmount);
  }

  return { root, update };
}

function buildMycelium(mycelium, pads, tint, disposables) {
  const { count, crumbs, end, start, time } = mycelium;
  const order = Array.from({ length: count }, (_, i) => i).sort(
    (a, b) => time[a * 2] - time[b * 2]
  );
  const threadGeometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  threadGeometry.translate(0, 0.5, 0);
  const threadMaterial = myceliumMaterial(tint);
  const threads = prepare(
    storageMatrices(
      new THREE.InstancedMesh(
        threadGeometry,
        threadMaterial,
        Math.max(1, count)
      )
    )
  );
  threads.count = 0;

  const crumbCount = crumbs.length / 5;
  const crumbOrder = Array.from({ length: crumbCount }, (_, i) => i).sort(
    (a, b) => crumbs[a * 5 + 4] - crumbs[b * 5 + 4]
  );
  const crumbGeometry = new THREE.IcosahedronGeometry(1, 1);
  const crumbMaterial = soilMaterial();
  const crumbMesh = prepare(
    storageMatrices(
      new THREE.InstancedMesh(
        crumbGeometry,
        crumbMaterial,
        Math.max(1, crumbCount)
      )
    )
  );
  const rng = createRng('crumbs');
  const m = new THREE.Matrix4();
  const e = new THREE.Euler();
  const q = new THREE.Quaternion();
  crumbOrder.forEach((i, k) => {
    const size = crumbs[i * 5 + 3];
    e.set(rng() * 6, rng() * 6, rng() * 6);
    m.compose(
      new THREE.Vector3(crumbs[i * 5], crumbs[i * 5 + 1], crumbs[i * 5 + 2]),
      q.setFromEuler(e),
      new THREE.Vector3(
        size * rng.range(0.7, 1.3),
        size * rng.range(0.5, 1),
        size
      )
    );
    crumbMesh.setMatrixAt(k, m);
  });
  crumbMesh.count = 0;
  disposables.push(
    threadGeometry,
    threadMaterial,
    crumbGeometry,
    crumbMaterial
  );

  const group = new THREE.Group();
  group.add(threads, crumbMesh);

  // The mat under a clump or colony: a low felted dome the bases share.
  const padGeometry = new THREE.SphereGeometry(
    1,
    48,
    16,
    0,
    TAU,
    0,
    Math.PI / 2
  );
  disposables.push(padGeometry);
  const padMeshes = pads.map((pad) => {
    const mesh = prepare(new THREE.Mesh(padGeometry, threadMaterial));
    mesh.position.set(
      pad.center[0],
      pad.center[1] - pad.height * 0.3,
      pad.center[2]
    );
    group.add(mesh);
    return { mesh, pad };
  });
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const scale = new THREE.Vector3();
  let last = -1;

  function update(level) {
    if (Math.abs(level - last) < 1e-4) return;
    last = level;
    let live = 0;
    while (live < count && time[order[live] * 2] < level) live += 1;
    for (let k = 0; k < live; k += 1) {
      const i = order[k];
      a.set(start[i * 4], start[i * 4 + 1], start[i * 4 + 2]);
      b.set(end[i * 4], end[i * 4 + 1], end[i * 4 + 2]);
      const t0 = time[i * 2];
      const t1 = time[i * 2 + 1];
      const f = Math.min(1, (level - t0) / Math.max(t1 - t0, 1e-6));
      dir.subVectors(b, a);
      const len = dir.length() * f;
      q.setFromUnitVectors(UP, dir.normalize());
      const r = (start[i * 4 + 3] + end[i * 4 + 3]) * 0.5;
      m.compose(a, q, scale.set(r, len + r * 0.8, r));
      threads.setMatrixAt(k, m);
    }
    threads.count = live;
    threads.instanceMatrix.needsUpdate = true;
    let crumbsLive = 0;
    while (
      crumbsLive < crumbCount &&
      crumbs[crumbOrder[crumbsLive] * 5 + 4] < level
    ) {
      crumbsLive += 1;
    }
    crumbMesh.count = crumbsLive;
    const spread = Math.min(1, level * 1.6);
    padMeshes.forEach(({ mesh, pad }) => {
      mesh.scale.set(
        pad.radius * spread,
        pad.height * spread,
        pad.radius * spread
      );
      // eslint-disable-next-line no-param-reassign
      mesh.visible = spread > 0.01;
    });
  }

  return { group, update };
}

const DEFAULT_CONFIG = { hairAmount: 1, showMycelium: true, sporeAmount: 1 };

// The specimen as one persistent, imperative object, shared by the scene and
// the CLI. `load` rebuilds it for a new generation and scales its box into
// `fit`;
// `setLevels` moves it through its lifecycle and skips members whose levels
// have not changed.
export default function createSpecimenRig({
  fit = { center: [0, 5.5, 0], radius: 5.2 },
} = {}) {
  const group = new THREE.Group();
  const threadTint = uniform(new THREE.Color());
  let members = [];
  let mycelium = null;
  let disposables = [];
  let config = DEFAULT_CONFIG;
  let size = [fit.radius * 2, fit.radius * 2, fit.radius * 2];

  function clear() {
    group.clear();
    disposables.forEach((item) => item.dispose());
    disposables = [];
    members = [];
    mycelium = null;
  }

  return {
    group,

    load(specimen) {
      clear();
      const content = new THREE.Group();
      members = specimen.members.map((member, index) => {
        const built = buildMember(
          member,
          index,
          disposables,
          specimen.members.length > 4
        );
        content.add(built.root);
        return built;
      });
      threadTint.value.set(specimen.genome.palette.mycelium);
      mycelium = buildMycelium(
        specimen.mycelium,
        specimen.pads ?? [],
        threadTint,
        disposables
      );
      mycelium.group.visible = config.showMycelium;
      content.add(mycelium.group);

      const { max, min } = specimen.bounds;
      const extent = max.map((v, a) => v - min[a]);
      const k =
        (fit.radius * 2) / Math.max(extent[1], extent[0], extent[2], 1e-3);
      const center = max.map((v, a) => (v + min[a]) / 2);
      content.scale.setScalar(k);
      content.position.set(
        fit.center[0] - center[0] * k,
        fit.center[1] - center[1] * k,
        fit.center[2] - center[2] * k
      );
      size = extent.map((v) => v * k);
      group.add(content);
    },

    setConfig(next) {
      config = { ...DEFAULT_CONFIG, ...next };
      if (mycelium) mycelium.group.visible = config.showMycelium;
    },

    setLevels(levels) {
      members.forEach((member, i) => member.update(levels.members[i], config));
      mycelium?.update(levels.mycelium);
    },

    // The fitted specimen's box: centred on `fit.center`, its largest side
    // 2 × `fit.radius`.
    bounds() {
      return { center: fit.center, radius: fit.radius, size };
    },

    dispose: clear,
  };
}
