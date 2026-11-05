import {
  Fn,
  attribute,
  cross,
  float,
  min,
  mix,
  normalLocal,
  normalView,
  normalWorld,
  mx_noise_float as perlin,
  positionGeometry,
  positionViewDirection,
  select,
  smoothstep,
  step,
  varyingProperty,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { RBOX_RADIUS, RBOX_SHARE } from '@modules/controlPanel';

import { RBOX_TEMPLATE } from './geometry';

const rotate = (q, v) => {
  const t = cross(q.xyz, v).mul(2);
  return v.add(t.mul(q.w)).add(cross(q.xyz, t));
};

// Per instance: aP = centre + metalness, aQ = orientation, aS = half
// extents + roughness, aC = albedo, aE = emission. Normals of a scaled
// primitive follow the inverse scale before they turn.
export default function createPartMaterial({
  doubleSided = false,
  glow: spill = false,
  lens = false,
  round = false,
  rounded = false,
  torus = false,
} = {}) {
  const p = attribute('aP', 'vec4');
  const q = attribute('aQ', 'vec4');
  const s = attribute('aS', 'vec4');
  const glow = attribute('aE', 'vec4');
  // aE.w: a part's own bevel; set only on module plates, whose painted
  // edges also chip.
  const bevel = glow.w;
  // Where a fragment sits on its own part, so surface detail turns and slides
  // with the part instead of swimming as it moves.
  const surface = varyingProperty('vec3', 'vPartSurface');
  const material = new THREE.MeshStandardNodeMaterial({
    side: doubleSided || lens ? THREE.DoubleSide : THREE.FrontSide,
  });
  material.positionNode = Fn(() => {
    let local;
    let normal;
    if (torus) {
      const ring = attribute('aRing', 'vec4');
      local = vec3(ring.xy.mul(s.x.add(s.z.mul(ring.z))), s.z.mul(ring.w));
      normal = vec3(ring.xy.mul(ring.z), ring.w);
    } else if (rounded) {
      // Each template vertex is corner + normal * RBOX_TEMPLATE; keep the
      // corner, swap in a radius fixed in panel units (the parts.js rule).
      const corner = positionGeometry
        .sub(normalLocal.mul(RBOX_TEMPLATE))
        .div(1 - RBOX_TEMPLATE);
      const flat = select(
        bevel.greaterThan(0),
        bevel,
        min(RBOX_RADIUS, min(s.x, s.y).mul(RBOX_SHARE))
      );
      const radius = vec3(flat, flat, min(flat, s.z.mul(0.9)));
      local = corner
        .mul(s.xyz.sub(radius))
        .add(normalLocal.mul(radius))
        .toVar();
      normal = normalLocal.div(radius.max(1e-4)).normalize();
    } else {
      local = positionGeometry.mul(s.xyz);
      normal = normalLocal.div(s.xyz.max(1e-4)).normalize();
    }
    surface.assign(local);
    normalLocal.assign(rotate(q, normal));
    return rotate(q, local).add(p.xyz);
  })();
  const albedo = attribute('aC', 'vec4');
  // A per-part offset from what never changes while it moves (its colour
  // and size), so identical parts do not share one pattern.
  const seed = vec3(
    albedo.r.mul(91.7).add(s.x.mul(13.1)),
    albedo.g.mul(57.3).add(s.y.mul(7.9)),
    albedo.b.mul(33.1).add(s.z.mul(5.3))
  );
  const at = surface.add(seed);
  const metal = p.w;
  const glass = smoothstep(0.2, 0.08, s.w).mul(metal.oneMinus());

  // Paint and plastic: broad mottle and fine orange-peel.
  const broad = perlin(at.mul(2.5));
  const fine = perlin(at.mul(70));
  // Metal: brushing along the part, or spun round it on round parts.
  const grain = round
    ? vec3(surface.xy.length().mul(60), surface.z.mul(4), seed.x)
    : at.mul(vec3(2, 45, 45));
  const brushed = perlin(grain);
  // Hairline scratches: the thin zero-crossings of a stretched noise,
  // kept to patches.
  const line = perlin(at.mul(vec3(7, 2.2, 7))).abs();
  const scratch = smoothstep(0.012, 0, line).mul(
    smoothstep(0.15, 0.5, perlin(at.mul(1.3)))
  );
  // Glass: fingerprints and smears, swirled, mostly in the roughness.
  const swirl = perlin(at.mul(5).add(perlin(at.mul(13)).mul(0.7)));
  const smudge = smoothstep(0.05, 0.55, swirl);

  const shade = mix(
    broad.mul(0.07).add(fine.mul(0.025)),
    brushed.mul(0.035),
    metal
  ).add(scratch.mul(mix(0.03, 0.09, metal)));
  const rough = mix(
    broad.mul(0.08).add(fine.mul(0.05)),
    brushed.mul(0.07),
    metal
  )
    .add(scratch.mul(mix(0.08, 0.18, metal)))
    .add(smudge.mul(glass).mul(0.22));

  // Where hands touch (aC.w), the middle of a part's top rubs glossy and a
  // little paler: a worn spot centred on the part, ragged at its edge.
  const across = surface.xy.div(s.xy.max(1e-4)).length();
  const worn = albedo.w
    .mul(smoothstep(0.55, 0.95, normalWorld.z))
    .mul(smoothstep(0.85, 0.25, across.add(perlin(at.mul(40)).mul(0.18))));
  // Painted plates chip along their bevels down to bare aluminium.
  const plate = step(1e-4, bevel);
  const edge = smoothstep(0.97, 0.7, normalWorld.z);
  const chip = plate
    .mul(edge)
    .mul(
      smoothstep(0.35, 0.6, perlin(at.mul(16).add(perlin(at.mul(5)).mul(0.6))))
    )
    .mul(smoothstep(0.1, 0.45, perlin(at.mul(0.9))));
  // Grime gathers where a part meets what it stands on, and in patches
  // across plates.
  const foot = smoothstep(0.035, 0, surface.z.add(s.z));
  const dirt = mix(
    foot.mul(plate.oneMinus()),
    smoothstep(0.25, 0.85, perlin(at.mul(1.1))).mul(0.4),
    plate
  ).mul(perlin(at.mul(22)).mul(0.35).add(0.65));

  const painted = mix(
    albedo.rgb.mul(shade.add(1)),
    albedo.rgb.mul(1.15).add(0.02),
    worn.mul(0.6)
  ).mul(dirt.mul(-0.38).add(1));
  material.colorNode = mix(painted, vec3(0.56, 0.57, 0.6), chip);
  material.emissiveNode = glow.rgb;
  material.roughnessNode = mix(
    s.w.add(rough).sub(worn.mul(0.3)).add(dirt.mul(0.15)),
    0.35,
    chip
  ).clamp(0.03, 1);
  material.metalnessNode = mix(p.w, 0.9, chip);
  if (lens) {
    // Glass: clear head-on, reflective toward grazing angles.
    material.transparent = true;
    material.depthWrite = false;
    const facing = normalView.dot(positionViewDirection).abs();
    material.opacityNode = mix(0.04, 0.55, facing.oneMinus().pow(3));
  }
  if (spill) {
    // Light thrown on a surface: added over it, fading from the centre.
    material.transparent = true;
    material.depthWrite = false;
    material.blending = THREE.AdditiveBlending;
    material.colorNode = vec3(0);
    material.roughnessNode = float(1);
    material.metalnessNode = float(0);
    const fade = positionGeometry.xy.length().oneMinus().max(0).pow(2);
    material.emissiveNode = glow.rgb.mul(fade);
  }
  return material;
}
