import {
  Fn,
  If,
  abs,
  cameraPosition,
  cameraProjectionMatrix,
  clamp,
  cos,
  cross,
  dot,
  exp,
  float,
  floor,
  instanceIndex,
  max,
  min,
  mix,
  normalize,
  positionGeometry,
  pow,
  screenSize,
  sin,
  smoothstep,
  sqrt,
  step,
  uint,
  varyingProperty,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { simplex3d } from './simplex3d';
import { surfaceLift } from './waveField';

const TAU = Math.PI * 2;

function worldPerPixel(p) {
  const distance = p.sub(cameraPosition).length();

  return distance.mul(2).div(cameraProjectionMatrix[1][1].mul(screenSize.y));
}

function splineSample(read, pointsPerStrand, along) {
  const fs = along.mul(pointsPerStrand - 1);
  const i1 = min(floor(fs), pointsPerStrand - 2);
  const f = fs.sub(i1);

  const p0 = read(max(i1.sub(1), 0));
  const p1 = read(i1);
  const p2 = read(i1.add(1));
  const p3 = read(min(i1.add(2), pointsPerStrand - 1));

  const a = p2.sub(p0).mul(0.5);
  const b = p0.mul(2).sub(p1.mul(5)).add(p2.mul(4)).sub(p3).mul(0.5);
  const c = p0.negate().add(p1.mul(3)).sub(p2.mul(3)).add(p3).mul(0.5);

  return {
    point: p1
      .add(a.mul(f))
      .add(b.mul(f.mul(f)))
      .add(c.mul(f.mul(f).mul(f))),
    tangent: a.add(b.mul(f).mul(2)).add(c.mul(f.mul(f)).mul(3)),
  };
}

// Frizz is evaluated per rendered sample, so a lock carries detail far finer
// than its segments. It is gated on crest strength: the flat stretches, which
// are most of the field, take the branch that costs nothing, and their static
// wander is already baked into the rest pose.
function crestFrizz(strandA, strandB, along, tangent, crest, u) {
  const offset = vec3(0).toVar();

  If(crest.greaterThan(0.01), () => {
    const seed = strandA.w.mul(11.3).add(strandB.y.mul(5.7));
    const coord = along.mul(u.frizzScale);
    const side = normalize(cross(tangent, vec3(0, 1, 0.0001)));
    const up = cross(side, tangent);
    const flyaway = step(u.flyawayShare.oneMinus(), strandB.y).mul(4).add(1);

    offset.assign(
      side
        .mul(simplex3d(vec3(coord, seed, 1.7)))
        .add(
          up.mul(
            simplex3d(vec3(coord, seed, 6.3))
              .mul(0.6)
              .add(0.25)
          )
        )
        .mul(u.frizz)
        .mul(flyaway)
        .mul(crest.mul(crest))
    );
  });

  return offset;
}

// Spun thread is plied, not a smooth cylinder: the twist runs down its length
// and catches the light in a repeating beat. This modulates both the drawn
// width and the highlight, which is the difference between reading as thread
// and reading as a drawn line.
function plyTwist(strandA, strandB, along, u) {
  return sin(
    along
      .mul(u.plyFrequency)
      .mul(TAU)
      .add(strandB.y.mul(TAU))
      .add(strandA.w.mul(3.1))
  );
}

// A fibre's highlight is not one clean band: neighbouring fibres in a bundle
// are at slightly different angles, so the specular breaks into glints along
// the length. Cheap stand-in for a specular-jitter lookup.
function glint(strandA, strandB, along, u) {
  return sin(
    along.mul(u.glintScale).add(strandA.w.mul(19.7)).add(strandB.y.mul(31.3))
  )
    .mul(0.5)
    .add(0.5)
    .mul(u.glint)
    .add(u.glint.oneMinus());
}

// Kajiya-Kay with the Marschner-style tilt: shifting the shading tangent along
// the fibre's normal splits the primary (white, shifted one way) from the
// secondary (pigment-tinted, shifted the other), which is what puts the two
// offset sheen bands on real thread.
function shiftedSpecular(T, N, H, shift, sharpness) {
  const shifted = normalize(T.add(N.mul(shift)));
  const TdotH = dot(shifted, H);

  return pow(sqrt(max(TdotH.mul(TdotH).oneMinus(), 0)), sharpness);
}

// Threads lying under a lock are in its shadow. The lock's height is analytic,
// so marching the field's own surface toward the light gives a real cast
// shadow rather than a per-thread constant.
function selfShadow(mode, point, strandA, u) {
  const L = u.lightDirection;
  const shade = float(1).toVar();

  If(u.shadowStrength.greaterThan(0.001), () => {
    const tap = (distance) => {
      const at = point.add(L.mul(distance));
      const top = u.fieldDepth.add(surfaceLift(mode, at, strandA, u));

      return max(top.sub(point.y), 0);
    };
    const buried = tap(u.shadowStep)
      .add(tap(u.shadowStep.mul(2.5)))
      .mul(0.5);

    shade.assign(exp(buried.mul(u.shadowStrength).negate()));
  });

  return shade;
}

// A continuous ramp rather than four hard bands: neighbouring threads sit
// close together on it, so the field reads as drifting colour bands the way
// dyed thread does, instead of four stripes.
function threadColor(shade, u) {
  const t = clamp(shade, 0, 1).mul(3);
  const ab = mix(u.bandColorA, u.bandColorB, clamp(t, 0, 1));
  const abc = mix(ab, u.bandColorC, clamp(t.sub(1), 0, 1));

  return mix(abc, u.bandColorD, clamp(t.sub(2), 0, 1));
}

function shadeThread(ctx, u) {
  const { along, crest, mode, ply, point, strandA, strandB, tangent } = ctx;

  return Fn(() => {
    const T = normalize(tangent);
    const V = normalize(cameraPosition.sub(point));
    const L = u.lightDirection;
    const H = normalize(L.add(V));
    // The fibre's normal is the part of "up out of the mat" perpendicular to
    // the fibre — the axis the specular lobes get tilted along.
    const N = normalize(vec3(0, 1, 0).sub(T.mul(T.y)));

    const depth = strandA.z.fract();
    const shadow = selfShadow(mode, point, strandA, u);
    const occlusion = mix(float(1), depth, u.occlusion)
      .mul(mix(float(1), u.crestShadow, crest))
      .mul(shadow);
    const variation = mix(0.78, 1.18, strandB.y);
    const pigment = threadColor(strandA.x, u).mul(variation);

    const TdotL = dot(T, L);
    const sinTL = sqrt(max(TdotL.mul(TdotL).oneMinus(), 0));

    const irid = cos(
      vec3(0, 0.33, 0.67)
        .add(dot(T, H).mul(u.iridescenceFrequency))
        .add(strandA.x.mul(2.5))
        .mul(TAU)
    )
      .mul(0.5)
      .add(0.5);
    // Sheen is strongest where the field lies flat, which is where the
    // reference goes iridescent; a lock of frizz stays matte.
    const sheen = mix(float(1), float(0.35), crest);
    const tinted = mix(
      pigment,
      irid.mul(pigment.length()),
      u.iridescence.mul(0.35).mul(sheen)
    );

    const lightColor = u.lightColor.mul(u.lightIntensity);
    const diffuse = mix(0.25, 1, sinTL).mul(u.diffuse);

    const plyGloss = ply.mul(u.plyGloss).add(1);
    const primary = shiftedSpecular(T, N, H, u.primaryShift, u.shininess)
      .mul(u.specular)
      .mul(sheen)
      .mul(plyGloss)
      .mul(glint(strandA, strandB, along, u));
    const secondary = shiftedSpecular(
      T,
      N,
      H,
      u.secondaryShift,
      u.shininess.mul(0.25)
    ).mul(u.secondarySpecular);

    // Forward scattering: a fibre lit from behind glows in its own colour,
    // and only the ones near the top of the mat get to.
    const transmission = pow(max(dot(V, L.negate()), 0), u.transmissionFocus)
      .mul(u.transmission)
      .mul(depth);

    const specTint = mix(vec3(1), irid, u.iridescence);
    const lit = tinted
      .mul(lightColor.mul(diffuse).add(u.ambient))
      .add(specTint.mul(primary).mul(lightColor).mul(occlusion))
      .add(tinted.mul(secondary).mul(lightColor).mul(occlusion))
      .add(tinted.mul(transmission).mul(lightColor))
      .mul(mix(float(1), occlusion, u.occlusionReach));

    const fog = exp(
      point.sub(cameraPosition).length().mul(u.depthFade).negate()
    ).oneMinus();

    return mix(lit, u.backgroundColor, fog);
  })();
}

function ribbonPosition(b, mode, pointsPerStrand, u, v) {
  return Fn(() => {
    const along = positionGeometry.x;
    const side = positionGeometry.y;
    const base = instanceIndex.mul(uint(pointsPerStrand));
    const read = (index) => b.pos.element(base.add(index.toUint())).xyz;

    const curve = splineSample(read, pointsPerStrand, along);
    const tangent = normalize(curve.tangent);
    const crest = b.prev.element(
      base.add(along.mul(pointsPerStrand - 1).toUint())
    ).w;

    const strandA = b.strandA.element(instanceIndex);
    const strandB = b.strandB.element(instanceIndex);
    const point = curve.point.add(
      crestFrizz(strandA, strandB, along, tangent, crest, u)
    );
    const across = normalize(
      cross(tangent, normalize(cameraPosition.sub(point)))
    );

    const ply = plyTwist(strandA, strandB, along, u);
    const width = u.fiberWidth.mul(strandA.y).mul(ply.mul(u.plyDepth).add(1));
    const drawn = max(width, worldPerPixel(point).mul(u.minPixels));

    v.color.assign(
      shadeThread(
        { along, crest, mode, ply, point, strandA, strandB, tangent },
        u
      )
    );
    v.coverage.assign(min(width.div(drawn), 1));
    v.edge.assign(side);

    return point.add(across.mul(drawn).mul(side).mul(0.5));
  })();
}

export default function createFiberMaterial(runtime, u, blend) {
  const v = {
    color: varyingProperty('vec3', 'vFiberColor'),
    coverage: varyingProperty('float', 'vFiberCoverage'),
    edge: varyingProperty('float', 'vFiberEdge'),
  };

  // Alpha blending, not alphaToCoverage: three only enables alphaToCoverage
  // when the target is multisampled, and several paths here are not (any post
  // chain's pass target, and the output target whenever the renderer needs its
  // own framebuffer). In those paths the opacity is discarded and every fiber
  // rasterizes as a hard-edged sliver. Blending antialiases in all of them.
  //
  // Depth write stays ON for the default blend: fibers then occlude each other
  // and early-z throws away most of the overdraw a fiber mass would otherwise
  // blend, which is the whole cost difference. 'haze' trades that for
  // order-independent softness.
  const blended = blend !== 'opaque';
  const material = new THREE.MeshBasicNodeMaterial({
    depthWrite: blend !== 'haze',
    side: THREE.DoubleSide,
    transparent: blended,
  });
  material.alphaToCoverage = !blended;
  material.positionNode = ribbonPosition(
    runtime.buffers,
    runtime.mode,
    runtime.pointsPerStrand,
    u,
    v
  );
  material.colorNode = vec4(v.color, 1);
  // A fiber is usually thinner than a pixel: it is drawn at a floor width and
  // faded by how much of that width it really covers, then feathered across
  // the ribbon so the silhouette resolves instead of stair-stepping.
  material.opacityNode = v.coverage.mul(
    smoothstep(u.edgeSoftness.oneMinus(), 1, abs(v.edge)).oneMinus()
  );

  return material;
}
