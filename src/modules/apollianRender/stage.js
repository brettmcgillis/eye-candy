import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  cameraPosition,
  cameraProjectionMatrix,
  cameraProjectionMatrixInverse,
  cameraWorldMatrix,
  exp,
  float,
  length,
  max,
  min,
  mix,
  positionGeometry,
  pow,
  reflect,
  refract,
  select,
  smoothstep,
  sqrt,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { sdfAO } from '@modules/apollonian';

import createObjectField from './fields';
import { paletteColor, paletteCoordinate } from './palette';

const STEP_SAFETY = 0.9;

// Quilez's penumbra estimate. Unlike @modules/apollonian's softShadow, a ray
// that runs past `maxDist` escaped and is lit — that helper darkens it,
// which is right for Explorer's lantern and turned this stage black.
function softShadow(df, origin, dir, { hardness, maxDist, steps, tStart }) {
  const t = float(tStart).toVar();
  const shade = float(1).toVar();
  Loop({ end: steps, start: 0, type: 'int' }, () => {
    const d = df(origin.add(dir.mul(t)));
    shade.assign(shade.min(d.mul(hardness).div(t)));
    If(d.lessThan(t.mul(1e-4)).or(t.greaterThan(maxDist)), () => {
      Break();
    });
    t.addAssign(d.clamp(float(tStart).mul(0.5), maxDist.mul(0.25)));
  });
  return smoothstep(0, 1, shade.clamp(0, 1));
}

// Four taps on a tetrahedron instead of six on the axes: every field call
// here inlines a full fold loop, and Metal's compiler gives up long before
// WGSL's limits do.
const tetraNormal = (df, p, e) => {
  const k1 = vec3(1, -1, -1);
  const k2 = vec3(-1, -1, 1);
  const k3 = vec3(-1, 1, -1);
  const k4 = vec3(1, 1, 1);
  return k1
    .mul(df(p.add(k1.mul(e))))
    .add(k2.mul(df(p.add(k2.mul(e)))))
    .add(k3.mul(df(p.add(k3.mul(e)))))
    .add(k4.mul(df(p.add(k4.mul(e)))))
    .normalize();
};
const GLASS_STEPS = 48;

// Narkowicz's ACES fit: the frame is lit in HDR, the backdrop is not.
const tonemap = (c) =>
  c
    .mul(c.mul(2.51).add(0.03))
    .div(c.mul(c.mul(2.43).add(0.59)).add(0.14))
    .clamp(0, 1);

function plinthDistance(u, p) {
  const half = u.plinthHeight.mul(0.5);
  const y = p.y.sub(u.plinthTop.sub(half));
  const round = u.plinthWidth.mul(0.03);
  const column = vec2(
    vec2(p.x, p.z).length().sub(u.plinthWidth).add(round),
    abs(y).sub(half).add(round)
  );
  const columnD = min(max(column.x, column.y), 0)
    .add(column.max(0).length())
    .sub(round);
  const q = abs(vec3(p.x, y, p.z))
    .sub(vec3(u.plinthWidth, half, u.plinthWidth))
    .add(round);
  const blockD = q
    .max(0)
    .length()
    .add(min(max(q.x, max(q.y, q.z)), 0))
    .sub(round);
  return select(
    u.plinthKind.equal(0),
    columnD,
    select(u.plinthKind.equal(1), blockD, float(1e9))
  );
}

// A sky gradient, the floor below the horizon and the key light as a lobe
// that widens with roughness: an analytic studio, identical in the scene and
// in a headless frame.
function createEnvironment(u) {
  return Fn(([dir, rough]) => {
    const sky = mix(u.skyHorizon, u.skyZenith, smoothstep(0, 0.7, dir.y));
    const ground = u.background.mul(0.6);
    const base = mix(ground, sky, smoothstep(-0.12, 0.04, dir.y)).mul(
      u.ambient
    );
    const sharp = mix(float(900), float(5), rough);
    const lobe = pow(max(dir.dot(u.lightDir), 0), sharp).mul(
      mix(float(1.2), float(0.15), rough)
    );
    return base.add(u.lightColor.mul(lobe));
  });
}

export default function buildStageMaterial(family, surface, u, buffers) {
  const field = createObjectField(family, u, buffers);
  const toObject = (p) => u.toObject.mul(p).div(u.objectSize);
  const objectD = (p) => field.distance(toObject(p)).mul(u.objectSize);
  const sceneD = Fn(([p]) => min(objectD(p), plinthDistance(u, p))).setLayout({
    inputs: [{ name: 'p', type: 'vec3' }],
    name: 'sceneDistance',
    type: 'float',
  });
  const sceneDistance = (p) => sceneD(p);
  const env = createEnvironment(u);

  const color = Fn(() => {
    const ndc = uv().mul(2).sub(1);
    const unproject = (z) => {
      const view = cameraProjectionMatrixInverse.mul(vec4(ndc, z, 1));
      return cameraWorldMatrix.mul(vec4(view.xyz.div(view.w), 1)).xyz;
    };
    const near = unproject(float(0.25));
    const rd = unproject(float(0.75)).sub(near).normalize();
    const perspective = cameraProjectionMatrix
      .element(2)
      .w.abs()
      .greaterThan(0.5);
    const planeT = cameraPosition.sub(near).dot(rd);
    const ro = select(perspective, cameraPosition, near.add(rd.mul(planeT)));

    const size = u.objectSize;
    const eps = u.hitEpsilon;
    const lit = vec3(0).toVar();
    const coverage = float(0).toVar();
    const travelled = float(0).toVar();

    const oc = ro.sub(u.stageCentre);
    const b = oc.dot(rd);
    const h = b.mul(b).sub(oc.dot(oc)).add(u.stageRadius.mul(u.stageRadius));
    const floorT = select(
      rd.y.lessThan(-1e-4).and(u.floorOn.greaterThan(0.5)),
      u.floorY.sub(ro.y).div(rd.y),
      float(1e9)
    );
    const hitObject = float(0).toVar();
    const floorShade = float(1).toVar();
    const t = float(0).toVar();

    If(h.greaterThan(0), () => {
      const root = sqrt(h);
      t.assign(max(b.negate().sub(root), 0));
      const tEnd = min(b.negate().add(root), floorT);
      Loop({ end: u.marchSteps, start: 0, type: 'int' }, () => {
        const d = sceneDistance(ro.add(rd.mul(t)));
        If(d.lessThan(eps.mul(t).max(size.mul(1e-5))), () => {
          hitObject.assign(1);
          Break();
        });
        If(t.greaterThan(tEnd), () => {
          Break();
        });
        t.addAssign(max(d.mul(STEP_SAFETY), eps.mul(t)));
      });
    });

    const shadowFrom = (p, n) =>
      softShadow(sceneDistance, p.add(n.mul(size.mul(0.004))), u.lightDir, {
        hardness: u.shadowHardness,
        maxDist: u.stageRadius.mul(2),
        steps: u.shadowSteps,
        tStart: size.mul(0.01),
      });

    If(hitObject.greaterThan(0.5), () => {
      const p = ro.add(rd.mul(t));
      const n = tetraNormal(sceneDistance, p, size.mul(0.0006).max(t.mul(eps)));
      const v = rd.negate();
      const r = reflect(rd, n);
      const nl = max(n.dot(u.lightDir), 0);
      const fres = pow(float(1).sub(max(n.dot(v), 0)), 5);
      const shadow = shadowFrom(p, n);
      const ao = float(1).sub(
        sdfAO(sceneDistance, p, n, {
          samples: u.aoSamples,
          stepSize: size.mul(0.012),
          strength: u.aoStrength.div(size),
        })
      );
      travelled.assign(t);
      coverage.assign(1);

      If(objectD(p).lessThanEqual(plinthDistance(u, p)), () => {
        const info = field.info(toObject(p));
        const coord = paletteCoordinate(info.y, u);
        const albedo = paletteColor(coord, u);
        const rough = u.roughness;
        const spec = u.lightColor
          .mul(pow(max(r.dot(u.lightDir), 0), mix(float(256), float(8), rough)))
          .mul(shadow);
        const diffuse = albedo.mul(
          u.lightColor
            .mul(nl)
            .mul(shadow)
            .add(env(n, float(1)).mul(ao))
        );
        const coat = env(r, float(0.12))
          .mul(mix(float(0.04), float(1), fres))
          .mul(ao)
          .add(spec.mul(0.5))
          .mul(u.clearcoat);

        // Reference 3's folded reflection bands, its palette lookups moved
        // onto the gradient.
        const bands = () => {
          const absR = abs(r);
          const absN = abs(n);
          const n1 = absR.sub(absN).mul(0.8);
          const mx2 = exp(length(absR.sub(abs(n1))).mul(-5));
          const r2 = absR.sub(absN).mul(4);
          const n2 = abs(r2).sub(absN).mul(4);
          const mx = exp(length(abs(r2).sub(abs(n2))).mul(-3));
          const dif = n.dot(u.lightDir).mul(0.5).add(0.5);
          const cl = dif
            .mul(0.25)
            .add(0.5)
            .add(max(fres.mul(0.5), max(mx, mx2)));
          const col2 = paletteColor(
            paletteCoordinate(info.y.add(mx.mul(0.75).mul(u.iridescence)), u),
            u
          );
          const col3 = paletteColor(
            paletteCoordinate(info.y.add(mx2.mul(1.5).mul(u.iridescence)), u),
            u
          );
          return col2.mul(col3).mul(cl).mul(2);
        };

        const out = vec3(0).toVar();
        if (surface === 'matte') {
          out.assign(diffuse.add(coat));
        } else if (surface === 'iridescent') {
          out.assign(
            bands()
              .mul(shadow.mul(0.65).add(0.35))
              .mul(ao)
              .add(n.y.mul(0.08).mul(albedo))
              .add(coat)
          );
        } else if (surface === 'metal') {
          out.assign(
            albedo
              .mul(env(r, rough).mul(ao).add(spec))
              .add(diffuse.mul(0.06))
              .add(coat)
          );
        } else {
          const inside = refract(rd, n, float(1).div(u.ior));
          const start = p.sub(n.mul(size.mul(0.01)));
          const dIn = float(size.mul(0.01)).toVar();
          Loop({ end: GLASS_STEPS, start: 0, type: 'int' }, () => {
            const d = objectD(start.add(inside.mul(dIn))).negate();
            If(d.lessThan(size.mul(0.002)), () => {
              Break();
            });
            dIn.addAssign(d.max(size.mul(0.002)));
          });
          const exitP = start.add(inside.mul(dIn));
          const exitN = tetraNormal(objectD, exitP, size.mul(0.001)).negate();
          const bent = refract(inside, exitN, u.ior);
          const outDir = select(
            bent.dot(bent).lessThan(0.5),
            reflect(inside, exitN),
            bent
          );
          const tint = mix(
            albedo,
            vec3(1),
            exp(dIn.div(size).mul(u.absorption).negate())
          );
          const transmitted = env(outDir, float(0.15))
            .mul(tint)
            .mul(mix(vec3(1), bands(), u.iridescence.mul(0.35)));
          out.assign(
            mix(transmitted, env(r, float(0.02)), fres.mul(0.9).add(0.04)).add(
              spec
            )
          );
        }

        If(info.z.greaterThan(0.5), () => {
          out.assign(
            albedo
              .mul(
                u.lightColor
                  .mul(nl)
                  .mul(shadow)
                  .add(env(n, float(1)).mul(ao))
              )
              .add(albedo.mul(u.cutGlow))
          );
        });
        lit.assign(out);
      }).Else(() => {
        const albedo = u.plinthColor;
        const spec = u.lightColor
          .mul(
            pow(
              max(r.dot(u.lightDir), 0),
              mix(float(128), float(4), u.plinthRoughness)
            )
          )
          .mul(float(1).sub(u.plinthRoughness))
          .mul(shadow);
        lit.assign(
          albedo
            .mul(
              u.lightColor
                .mul(nl)
                .mul(shadow)
                .add(env(n, float(1)).mul(ao))
            )
            .add(spec.mul(0.3))
        );
      });
    }).ElseIf(floorT.lessThan(1e8), () => {
      const p = ro.add(rd.mul(floorT));
      const up = vec3(0, 1, 0);
      // A directional key throws the plinth's shadow to the horizon; it is
      // faded out a few plinth-widths away, softened as it goes, and not
      // marched at all past the fade.
      const reach = vec2(p.x, p.z).length().div(u.stageRadius);
      const fade = float(1).sub(smoothstep(0.9, 3.2, reach));
      const shadow = float(1).toVar();
      If(fade.greaterThan(0), () => {
        shadow.assign(
          softShadow(
            sceneDistance,
            p.add(up.mul(size.mul(0.004))),
            u.lightDir,
            {
              hardness: u.shadowHardness.mul(0.6),
              maxDist: u.stageRadius.mul(4),
              steps: u.shadowSteps,
              tStart: size.mul(0.01),
            }
          )
        );
      });
      const ao = float(1).sub(
        sdfAO(sceneDistance, p, up, {
          samples: u.aoSamples,
          stepSize: size.mul(0.03),
          strength: u.aoStrength.mul(0.5).div(size),
        })
      );
      floorShade.assign(
        float(1).sub(float(1).sub(shadow.mul(ao)).mul(u.floorShadow).mul(fade))
      );
    });

    // The floor is a shadow catcher: unshadowed, it is the backdrop itself,
    // so the stage reads as one sweep of paper with no edge to it.
    const backdrop = mix(u.floorColor, u.background, floorShade);
    const centreT = u.stageCentre.sub(ro).dot(rd);
    const beyond = max(travelled.sub(centreT), 0).div(size);
    const fogged = coverage.mul(exp(u.fog.mul(beyond).mul(beyond).negate()));
    return vec4(mix(backdrop, tonemap(lit.mul(u.exposure)), fogged), 1);
  })();

  const material = new THREE.MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  material.vertexNode = vec4(positionGeometry.xy, 0, 1);
  material.colorNode = color;
  return material;
}
