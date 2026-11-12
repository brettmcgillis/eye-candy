import {
  exp,
  float,
  materialColor,
  materialOpacity,
  materialRoughness,
  max,
  mix,
  mx_fractal_noise_float as mxFractal,
  mx_noise_float as mxNoise,
  positionWorld,
  sin,
  smoothstep,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { OPENINGS } from './cruiser';

const VENTS = OPENINGS.flatMap(({ vents }) => vents.map(({ at }) => at));
const BELT = 0.98;

export function createCharUniforms() {
  return {
    amount: uniform(1),
    color: uniform(new THREE.Color('#1a1714')),
    drip: uniform(0.45),
    emberGlow: uniform(2),
    glowColor: uniform(new THREE.Color('#ff6a1a')),
    interiorGlow: uniform(3),
    reach: uniform(0.75),
    time: uniform(0),
  };
}

// How much soot a point of the body carries, from where the fire breaks
// out: heavy round each opening, over the roof and pillars, and in streaks
// run down the doors below each window, broken up so it reads as burnt
// paint, not a gradient. `heat` is the nearest vent's closeness, for the
// blistered paint that still glows.
function sootAt(u) {
  const p = positionWorld;
  let heat = float(0);
  let below = float(0);
  VENTS.forEach(([x, y, z]) => {
    const d = p.sub(vec3(x, y, z));
    heat = max(heat, exp(d.dot(d).div(u.reach.mul(u.reach)).negate()));
    const side = d.x.mul(d.x).add(d.z.mul(d.z).mul(0.3));
    below = max(below, exp(side.div(u.reach.mul(u.reach).mul(0.5)).negate()));
  });
  const mottle = mxFractal(p.mul(2.6), 4).mul(0.5).add(0.5);
  const roof = smoothstep(BELT - 0.05, BELT + 0.35, p.y);
  const streaks = mxNoise(vec3(p.x.mul(11), p.y.mul(0.9), p.z.mul(11)))
    .mul(0.5)
    .add(0.5);
  const runs = smoothstep(BELT - 0.05, BELT, p.y)
    .oneMinus()
    .mul(
      smoothstep(
        float(BELT).sub(u.drip.mul(streaks.mul(1.6))),
        float(BELT),
        p.y
      )
    )
    .mul(below)
    .mul(smoothstep(0.45, 0.75, streaks));
  const soot = heat
    .mul(1.4)
    .add(roof.mul(0.55).mul(below.add(0.35)))
    .add(runs)
    .mul(mottle.mul(0.9).add(0.35))
    .mul(u.amount)
    .clamp(0, 1);
  return { heat, mottle, soot };
}

const flickerAt = (u, p) =>
  sin(u.time.mul(9).add(p.x.mul(3)))
    .mul(0.25)
    .add(sin(u.time.mul(15.7).add(p.z.mul(5))).mul(0.15))
    .add(mxNoise(p.mul(2).add(vec3(0, u.time.mul(-1.5), 0))).mul(0.4))
    .add(0.85);

// The node copy of a GLB material, so the renderer's own conversion is
// replaced by one we can extend.
function toNode(material, Kind) {
  const node = new Kind();
  Object.keys(material).forEach((key) => {
    if (key !== 'uuid') node[key] = material[key];
  });
  return node;
}

// Painted body, trim and badges: soot over the paint, rougher where burnt,
// and the hottest blisters glowing under the flames.
function charred(material, u) {
  const node = toNode(material, THREE.MeshStandardNodeMaterial);
  const { heat, mottle, soot } = sootAt(u);
  node.colorNode = mix(materialColor, u.color, soot);
  node.roughnessNode = mix(materialRoughness, float(0.95), soot);
  const blister = smoothstep(0.55, 0.95, heat.mul(mottle.add(0.3)));
  node.emissiveNode = vec3(u.glowColor)
    .mul(blister.mul(u.emberGlow).mul(flickerAt(u, positionWorld)))
    .mul(u.amount.min(1));
  return node;
}

// The cabin is burning: its trim glows with the fire inside.
function burning(material, u) {
  const node = toNode(material, THREE.MeshStandardNodeMaterial);
  const { soot } = sootAt(u);
  node.colorNode = mix(materialColor, u.color, soot.max(0.6));
  node.emissiveNode = vec3(u.glowColor).mul(
    u.interiorGlow.mul(flickerAt(u, positionWorld))
  );
  return node;
}

// Window glass is smoked over and lets the volume through: it no longer
// writes depth, so fire inside the cabin shows behind it.
function sooted(material, u) {
  const node = toNode(material, THREE.MeshStandardNodeMaterial);
  const { soot } = sootAt(u);
  node.depthWrite = false;
  node.colorNode = mix(materialColor, u.color, soot);
  node.opacityNode = mix(materialOpacity, float(0.92), soot.mul(0.6));
  return node;
}

const BUILDERS = {
  Carbadges_misc_U: charred,
  Fairheaven_LT80_Bodymat: charred,
  Numberplates_Misk_U: charred,
  UCB_BOTTOM_GT: charred,
  UCB_Interior_Trim: burning,
  UCB_Lights_and_Glass_Transperent: sooted,
};

// The charred stand-in for a cruiser material, or null to leave it be.
export default function charMaterial(material, u) {
  const build = BUILDERS[material.name];
  return build ? build(material, u) : null;
}
