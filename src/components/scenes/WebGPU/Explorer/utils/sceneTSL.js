import {
  Fn,
  If,
  acesFilmicToneMapping,
  cameraPosition,
  cameraProjectionMatrix,
  cameraViewMatrix,
  cameraWorldMatrix,
  cos,
  float,
  mix,
  positionGeometry,
  struct,
  texture3D,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  apollianTree,
  marchSDF,
  sdBox,
  sdfAO,
  sdfNormal,
  softShadow,
} from '@modules/apollonian';

import { airlight, createSteamUniforms, marchSteam } from './steamTSL';

const AO_SAMPLES = 5;

const CavernResult = struct(
  { color: 'vec4', depth: 'float' },
  'ExplorerCavern'
);

export function createUniforms() {
  return {
    albedo: uniform(new THREE.Color(1, 1, 1)),
    ambientColor: uniform(new THREE.Color(0.06, 0.08, 0.13)),
    ambientStrength: uniform(0),
    aoStep: uniform(0.24),
    aoFloor: uniform(0.125),
    aoStrength: uniform(0),
    confine: uniform(0),
    creviceDarkening: uniform(0),
    epsilon: uniform(0.004),
    escapeDistance: uniform(140),
    exposure: uniform(1),
    fogColor: uniform(new THREE.Color(0, 0, 0)),
    fogDensity: uniform(0),
    folds: uniform(7, 'int'),
    glowRate: uniform(0.4),
    lightColor: uniform(new THREE.Color(1, 1, 1)),
    lightFacing: uniform(0.4),
    lightIntensity: uniform(1),
    lightPos: uniform(new THREE.Vector3()),
    maxSteps: uniform(160, 'int'),
    maxStepsF: uniform(160),
    normalEpsilon: uniform(0.02),
    paletteAmp: uniform(1),
    paletteBias: uniform(1),
    paletteFreq: uniform(1),
    palettePhase: uniform(new THREE.Vector3(0, 0.55 / 3, 1.1 / 3)),
    paletteRate: uniform(0.027),
    paletteSpan: uniform(2),
    periodXZ: uniform(2),
    periodY: uniform(2),
    pivot: uniform(new THREE.Vector3(0, 0.95, 1)),
    postGamma: uniform(1),
    resolution: uniform(new THREE.Vector2(1, 1)),
    filmic: uniform(1),
    gloss: uniform(24),
    lightWrap: uniform(0.5),
    rockNoiseScale: uniform(1),
    rockVariation: uniform(0.5),
    specular: uniform(0.25),
    waterAbsorb: uniform(new THREE.Vector3(0.3, 0.125, 0.09)),
    saturation: uniform(0),
    scaleBase: uniform(1.3),
    scaleGain: uniform(0.95),
    shadowBias: uniform(0.16),
    shadowDepth: uniform(0.08),
    shadowHardness: uniform(10),
    shadowSteps: uniform(40, 'int'),
    sphereCore: uniform(new THREE.Color(1, 0.85, 0.6)),
    sphereEdge: uniform(new THREE.Color(1, 0.45, 0.15)),
    sphereGlow: uniform(2.5),
    steam: createSteamUniforms(),
    stepSafety: uniform(2),
    tanHalfFov: uniform(Math.tan(THREE.MathUtils.degToRad(60) / 2)),
    twist: uniform(Math.PI / 5.5),
    vignette: uniform(0.6),
    worldScale: uniform(20),
  };
}

// Same domain rescale Apollian uses: the marcher keeps working at the
// fractal's own scale and the result is converted back to world units, so
// inflating the caverns to room size costs no precision. `worldScale` above 1
// magnifies — the fractal's chambers top out around 0.22 across in its own
// units, which is unflyable until it is blown up by roughly this much.
//
// Every length control the scene exposes is authored in *fractal* units and
// multiplied up by worldScale when it is synced, so changing the scale does
// not silently break the surface epsilon, AO reach, or shadow bias.
export function createDistanceField(u) {
  return (p) => {
    const q = u.pivot.add(p.div(u.worldScale));
    const tree = apollianTree(
      q,
      u.scaleBase,
      u.scaleGain,
      u.twist,
      u.periodY,
      u.periodXZ,
      u.folds
    );
    const sculpture = tree
      .max(sdBox(q.sub(vec3(0, 0.5, 0)), vec3(0.75, 1, 0.75)).sub(0.5))
      .min(q.y);

    return mix(tree, sculpture, u.confine).mul(u.worldScale);
  };
}

// The reference's light: an exponential halo around the emitter, coloured by
// an iq cosine palette indexed on that same distance — hot beside the sphere,
// cooling as it reaches into the cavern. No inverse square and no N·L, which
// is what lets the whole chamber glow instead of just the walls facing it.
// The steam is lit by this too, so wall and vapour agree on colour.
export function createPalette(u) {
  return (distance) => {
    const t = u.paletteSpan.mul(u.paletteRate.mul(distance).negate().exp());
    return vec3(u.paletteBias)
      .add(
        vec3(u.paletteAmp).mul(
          cos(
            vec3(t.mul(u.paletteFreq))
              .add(u.palettePhase)
              .mul(Math.PI * 2)
          )
        )
      )
      .mul(u.lightColor)
      .mul(u.lightIntensity);
  };
}

export function createGlow(u) {
  const palette = createPalette(u);
  return (distance) =>
    palette(distance).mul(u.glowRate.mul(distance).negate().exp());
}

// The sphere is hit analytically inside the same pass rather than drawn as a
// mesh on top, so steam in front of it occludes it. Unlit, rim brightened —
// a shaded ball reads as an object being lit, not the thing doing the lighting.
function hitSphere(u, ro, rd) {
  const oc = ro.sub(u.lightPos);
  const b = oc.dot(rd);
  const r = u.steam.sphereRadius;
  const disc = b.mul(b).sub(oc.dot(oc)).add(r.mul(r));
  const t = b.negate().sub(disc.max(0).sqrt());
  return { hit: disc.greaterThan(0).and(t.greaterThan(0)), t };
}

// Filmic blends the reference's hard clamp toward ACES: a clamp flattens
// every face that runs past 1 into one value, which reads as cel shading.
function post(u, colorIn) {
  const exposed = colorIn.mul(u.exposure);
  const col = mix(
    exposed.clamp(0, 1),
    acesFilmicToneMapping(exposed, float(1)),
    u.filmic
  )
    .pow(u.postGamma)
    .toVar();
  col.assign(mix(col, vec3(col.dot(vec3(0.33))), u.saturation));

  const q = uv();
  const vig = q.x
    .mul(q.y)
    .mul(q.x.oneMinus())
    .mul(q.y.oneMinus())
    .mul(19)
    .max(0)
    .pow(0.7)
    .mul(0.5)
    .add(0.5);

  return col.mul(mix(float(1), vig, u.vignette));
}

export function buildCavernsMaterial(u) {
  const df = createDistanceField(u);
  const glow = createGlow(u);
  const palette = createPalette(u);

  const marched = Fn(() => {
    const ndc = uv().mul(2).sub(1).toVar();
    ndc.x.mulAssign(u.resolution.x.div(u.resolution.y));

    const ro = cameraPosition;
    const rd = cameraWorldMatrix
      .mul(vec4(ndc.x.mul(u.tanHalfFov), ndc.y.mul(u.tanHalfFov), -1, 0))
      .xyz.normalize();

    const col = vec3(u.fogColor).toVar();
    const depth = float(1).toVar();

    const sphere = hitSphere(u, ro, rd);
    const traceEnd = u.escapeDistance.toVar();
    If(sphere.hit, () => {
      traceEnd.assign(traceEnd.min(sphere.t));
    });

    const { hit, iter, t } = marchSDF(df, ro, rd, {
      epsilon: u.epsilon,
      maxDist: u.escapeDistance,
      maxSteps: u.maxSteps,
      maxTrace: traceEnd,
      stepScale: u.stepSafety,
      tStart: 0.01,
    });

    If(hit.greaterThan(0.5), () => {
      const p = ro.add(rd.mul(t));
      const n = sdfNormal(df, p, u.normalEpsilon);

      const toLight = u.lightPos.sub(p).toVar();
      const distance = toLight.length().toVar();
      const lightDir = toLight.div(distance).toVar();

      // Facing 0 is the reference: every surface in reach glows, front or
      // back. Raise it to bring N·L back and recover the branches' form.
      // Wrap softens the terminator the way light scattered by the water
      // around a surface does — a hard N·L edge on every bubble reads as cel
      // shading.
      const wrapped = n
        .dot(lightDir)
        .add(u.lightWrap)
        .div(u.lightWrap.add(1))
        .clamp(0, 1);
      const facing = mix(float(1), wrapped, u.lightFacing);

      // The reference's shadow only takes 8% off an occluded point. Skipped
      // when it would change nothing, since it is the costliest march here.
      const occlusion = float(1).toVar();
      If(u.shadowDepth.greaterThan(0).and(facing.greaterThan(0)), () => {
        occlusion.assign(
          mix(
            float(1),
            softShadow(df, p.add(n.mul(u.shadowBias)), lightDir, {
              hardness: u.shadowHardness,
              maxDist: distance,
              stepScale: u.stepSafety,
              steps: u.shadowSteps,
              tStart: u.shadowBias,
            }),
            u.shadowDepth
          )
        );
      });

      // mrange's fake ambient: rays that grind through many steps are the
      // ones deep in a crevice. It assumes most rays escape early, which is
      // true of the reference's boxed sculpture and false of this unbounded
      // lattice, where every ray exhausts its budget and the term collapses
      // to exp(-9). Off by default.
      const grind = iter.div(u.maxStepsF);
      const crevice = mix(
        float(1),
        grind.mul(grind).mul(-9).exp(),
        u.creviceDarkening
      );

      // Floors at aoFloor — occlusion saturates in a lattice this dense, and
      // bottoming out at zero makes the frame black. Off in the reference
      // look, and skipped entirely while it is.
      const cavity = float(1).toVar();
      If(u.aoStrength.greaterThan(0), () => {
        cavity.assign(
          mix(
            float(1),
            u.aoFloor,
            sdfAO(df, p, n, {
              samples: AO_SAMPLES,
              stepSize: u.aoStep,
              strength: u.aoStrength,
            }).pow(3)
          )
        );
      });

      // Seawater eats red first, so light that has crossed more water —
      // sphere to rock here, rock to eye below — drifts toward blue-green.
      const lightPath = u.waterAbsorb.mul(distance).negate().exp();
      const direct = glow(distance)
        .mul(facing)
        .mul(occlusion)
        .mul(lightPath)
        .toVar();
      const ambient = vec3(u.ambientColor).mul(u.ambientStrength);

      // Mottled stone instead of one flat albedo, from the steam's baked
      // noise at two octaves — flat fills are half of what reads as toon.
      const rockQ = p.div(u.worldScale).mul(u.rockNoiseScale);
      const mottle = texture3D(u.steam.noise, rockQ)
        .level(0)
        .r.mul(0.6)
        .add(texture3D(u.steam.noise, rockQ.mul(4.3)).level(0).r.mul(0.4));
      const albedo = vec3(u.albedo).mul(
        mix(float(1), mottle.mul(1.6).add(0.2), u.rockVariation)
      );

      // A faint wet sheen: Blinn-Phong off the one light.
      const halfway = lightDir.sub(rd).normalize();
      const sheen = n
        .dot(halfway)
        .max(0)
        .pow(u.gloss)
        .mul(u.specular)
        .mul(occlusion);

      col.assign(
        albedo
          .mul(direct.add(ambient))
          .mul(cavity)
          .mul(crevice)
          .add(direct.mul(sheen))
      );
      const viewPath = u.waterAbsorb.mul(t).negate().exp();
      col.assign(
        col.mul(viewPath).add(vec3(u.fogColor).mul(viewPath.oneMinus()))
      );
      col.assign(
        mix(
          col,
          vec3(u.fogColor),
          t.mul(u.fogDensity).negate().exp().oneMinus()
        )
      );

      const clip = cameraProjectionMatrix.mul(cameraViewMatrix.mul(vec4(p, 1)));
      depth.assign(clip.z.div(clip.w));
    });

    const tEnd = traceEnd.toVar();

    If(hit.greaterThan(0.5), () => {
      tEnd.assign(t);
    }).ElseIf(sphere.hit, () => {
      const p = ro.add(rd.mul(sphere.t));
      const rim = p.sub(u.lightPos).normalize().dot(rd).abs().oneMinus();
      col.assign(
        mix(vec3(u.sphereCore), vec3(u.sphereEdge), rim.pow(1.5)).mul(
          u.sphereGlow
        )
      );
      const clip = cameraProjectionMatrix.mul(cameraViewMatrix.mul(vec4(p, 1)));
      depth.assign(clip.z.div(clip.w));
    });

    const steam = marchSteam(u.steam, glow, u.lightPos, ro, rd, tEnd);
    col.assign(
      col
        .mul(steam.transmittance)
        .add(steam.scattered)
        .add(airlight(u.steam, palette, u.glowRate, u.lightPos, ro, rd, tEnd))
    );

    return CavernResult(vec4(post(u, col), 1), depth);
  })();

  const material = new THREE.MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: true,
    toneMapped: false,
  });
  material.vertexNode = vec4(positionGeometry.xy, 0, 1);
  material.colorNode = marched.get('color');
  material.depthNode = marched.get('depth');

  return material;
}
