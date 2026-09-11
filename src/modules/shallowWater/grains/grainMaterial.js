import {
  float,
  hash,
  mat3,
  mix,
  normalLocal,
  positionLocal,
  select,
  smoothstep,
  transformNormalToView,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { grainCycleFade } from './grainCycle';

function rotationMatrix(euler) {
  const a = euler.x.cos();
  const b = euler.x.sin();
  const c = euler.y.cos();
  const d = euler.y.sin();
  const e = euler.z.cos();
  const f = euler.z.sin();

  return mat3(
    vec3(
      c.mul(e),
      a.mul(f).add(b.mul(e).mul(d)),
      b.mul(f).sub(a.mul(e).mul(d))
    ),
    vec3(
      c.mul(f).negate(),
      a.mul(e).sub(b.mul(f).mul(d)),
      b.mul(e).add(a.mul(f).mul(d))
    ),
    vec3(d, b.negate().mul(c), a.mul(c))
  );
}

// Rodrigues rotation about an arbitrary axis, columns first for mat3().
function axisAngleMatrix(axis, angle) {
  const c = angle.cos();
  const s = angle.sin();
  const t = c.oneMinus();
  const { x, y, z } = axis;

  return mat3(
    vec3(
      t.mul(x).mul(x).add(c),
      t.mul(x).mul(y).add(s.mul(z)),
      t.mul(x).mul(z).sub(s.mul(y))
    ),
    vec3(
      t.mul(x).mul(y).sub(s.mul(z)),
      t.mul(y).mul(y).add(c),
      t.mul(y).mul(z).add(s.mul(x))
    ),
    vec3(
      t.mul(x).mul(z).add(s.mul(y)),
      t.mul(y).mul(z).sub(s.mul(x)),
      t.mul(z).mul(z).add(c)
    )
  );
}

// Every per-grain quantity was resolved in the compute pass, so this stage
// samples nothing: it reads four instance attributes and shades. Grains are
// cubes, as in PetriDish and TheSpeedOfLightning -- a box is what gives a
// speck a facet to catch the key light with, and from straight overhead that
// facet is the only thing separating sand from a flat dot.
export default function createGrainMaterial({ buffers, uniforms }) {
  const home = buffers.home.toAttribute();
  const state = buffers.state.toAttribute();
  const motion = buffers.motion.toAttribute();
  const look = buffers.look.toAttribute();
  const skin = buffers.skin.toAttribute();

  const seed = home.z;
  const isRock = home.w.greaterThan(0.75);
  // Shore sand and rock are the same material, so they are the same size.
  const isShore = home.w.greaterThan(0.25);
  const depth = state.w;
  const foam = motion.z;
  const aeration = motion.w;
  const bed = look.x;
  // Rock facet noise for a rock grain; foam freshness for a water one.
  const shade = look.y;
  const tip = look.zw;

  const spin = vec3(
    hash(seed.mul(104729).add(1.7)),
    hash(seed.mul(66569).add(9.3)),
    hash(seed.mul(271441).add(4.1))
  ).mul(Math.PI * 2);

  // Perpendicular to the tip direction, so rotating about it leans the grain
  // the way the water is running (or, over rock, the way the bed falls).
  const lean = tip.length().max(1e-5);
  const leanAxis = vec3(tip.y, 0, tip.x.negate()).div(lean);
  const rotation = axisAngleMatrix(leanAxis, lean.min(uniforms.tipLimit)).mul(
    rotationMatrix(spin)
  );

  const sizeSeed = hash(seed.mul(65536).add(17));
  const jitter = mix(uniforms.grainSizeMin, uniforms.grainSizeMax, sizeSeed);
  // Two different questions, both resolved in the compute pass. `wet` is
  // whether there is water on this grain, smoothed so it cannot flicker across
  // the threshold; it decides how big the grain is and whether it reads as
  // water or as sand. `wetness` is whether it has been under water lately,
  // which is what darkens the shore behind a wave that has already gone.
  const wet = skin.y.toVar('wet');
  const wetness = skin.x.toVar('wetness');

  // The per-grain break-up goes into the foam threshold rather than onto the
  // colour, so the edge of a foam sheet dissolves into individual grains
  // instead of being a smooth mask with speckle painted over it.
  const foamMask = smoothstep(
    uniforms.foamThreshold,
    uniforms.foamThreshold.add(uniforms.foamSoftness),
    foam.mul(
      mix(
        uniforms.foamBreakup.oneMinus(),
        uniforms.foamBreakup.add(1),
        hash(seed.mul(48271).add(23))
      )
    )
  ).toVar('foamMask');

  // Size is a property of what the grain is made of, decided once at layout,
  // never of how wet it is at this instant. Driving it from wetness swung a
  // grain 68% in size every time the water crossed the threshold under it.
  const waterSize = select(
    isShore,
    uniforms.rockGrainSize,
    uniforms.waterGrainSize
  )
    .mul(mix(float(1), uniforms.foamSwell, foamMask))
    // The recycle fade is unconditional. It used to be switched off for dry
    // grains, on the reasoning that beached sand is not being carried anywhere
    // so fading it is pure shimmer -- but that gate is exactly the popping:
    // a grain caught mid-fade, invisible, that dried out had its fade removed
    // and jumped straight to full size. Shimmer is the cheaper problem.
    .mul(grainCycleFade(seed, uniforms));

  const scale = select(isRock, uniforms.rockGrainSize, waterSize).mul(jitter);

  const material = new THREE.MeshStandardNodeMaterial({ metalness: 0 });

  material.positionNode = rotation.mul(positionLocal.mul(scale)).add(state.xyz);
  material.normalNode = transformNormalToView(
    rotation.mul(normalLocal).normalize()
  );

  // One drying colour, shared by both populations, so the band a wave leaves
  // behind runs continuously across the waterline instead of stopping where
  // rock grains give way to sand ones.
  const dryTone = mix(
    uniforms.rockDryColor,
    uniforms.rockWetColor,
    wetness
  ).toVar('dryTone');
  const rockTone = dryTone.mul(
    mix(uniforms.rockMottle.oneMinus(), uniforms.rockMottle.add(1), shade)
  );

  // Beer-Lambert on depth alone: from overhead the only thing between the eye
  // and the bed is the water column, so absorption is the whole of the colour
  // before anything aerates.
  const clarity = depth.mul(uniforms.absorption).negate().exp();
  const body = mix(uniforms.deepColor, uniforms.shallowColor, clarity);
  // Submerged reef read through the water, which is what breaks the open sea
  // up into the dark blotches the reference has offshore of the rock.
  const reef = smoothstep(uniforms.reefDepth.negate(), 0, bed).mul(
    uniforms.reefStrength
  );
  const churned = mix(
    mix(body, uniforms.reefColor, reef),
    uniforms.aeratedColor,
    aeration.mul(uniforms.aerationTint).clamp(0, 1)
  );
  const surf = mix(
    churned,
    mix(uniforms.foamOldColor, uniforms.foamColor, shade),
    foamMask
  );
  // The other half of closing that seam: a grain under a millimetre of water
  // is wet stone, not shallow sea, so the survivors read as the waterline
  // rather than as teal specks scattered over the rock.
  const waterTone = mix(dryTone, surf, wet);

  // Foam runs over the rock as well as over the water. The waterline is a
  // dithered band of both populations, so leaving rock out of the foam left
  // black specks scattered through any sheet that washed across it -- wet
  // stone at its darkest, sitting in the middle of the whitewater. Rock takes
  // fresh foam rather than the aged blend, because the freshness channel
  // carries its facet noise instead.
  const rockSurf = mix(rockTone, uniforms.foamColor, foamMask);

  material.colorNode = select(isRock, rockSurf, waterTone).mul(
    mix(uniforms.grainVariance.oneMinus(), uniforms.grainVariance.add(1), seed)
  );
  material.roughnessNode = select(
    isRock,
    // Wet stone takes the water's roughness, which is the sheen a wave leaves
    // on it, and foam over it is rough again. No new controls: both are
    // glossiness values the water already has.
    mix(
      mix(uniforms.rockRoughness, uniforms.waterRoughness, wetness),
      uniforms.foamRoughness,
      foamMask
    ),
    mix(uniforms.waterRoughness, uniforms.foamRoughness, foamMask)
  );

  return material;
}
