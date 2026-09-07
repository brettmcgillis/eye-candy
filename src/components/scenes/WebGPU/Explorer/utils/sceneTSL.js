import {
  Fn,
  If,
  cameraPosition,
  cameraProjectionMatrix,
  cameraViewMatrix,
  cameraWorldMatrix,
  float,
  mix,
  positionGeometry,
  struct,
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
} from '@modules/sdf';

const AO_SAMPLES = 5;

const CavernResult = struct(
  { color: 'vec4', depth: 'float' },
  'ExplorerCavern'
);

export function createUniforms() {
  return {
    albedo: uniform(new THREE.Color(0.55, 0.5, 0.46)),
    ambientColor: uniform(new THREE.Color(0.06, 0.08, 0.13)),
    ambientStrength: uniform(0.35),
    aoStep: uniform(0.24),
    aoFloor: uniform(0.125),
    aoStrength: uniform(1),
    confine: uniform(0),
    creviceDarkening: uniform(0),
    epsilon: uniform(0.004),
    escapeDistance: uniform(140),
    exposure: uniform(1),
    fogColor: uniform(new THREE.Color(0, 0, 0)),
    fogDensity: uniform(0.02),
    folds: uniform(7, 'int'),
    lightColor: uniform(new THREE.Color(1, 0.72, 0.36)),
    lightFalloff: uniform(0.05),
    lightIntensity: uniform(6),
    lightPos: uniform(new THREE.Vector3()),
    maxSteps: uniform(160, 'int'),
    maxStepsF: uniform(160),
    normalEpsilon: uniform(0.02),
    periodXZ: uniform(2),
    periodY: uniform(2),
    pivot: uniform(new THREE.Vector3(0, 0.95, 1)),
    postGamma: uniform(0.85),
    resolution: uniform(new THREE.Vector2(1, 1)),
    saturation: uniform(0),
    scaleBase: uniform(1.3),
    scaleGain: uniform(0.95),
    shadowBias: uniform(0.16),
    shadowHardness: uniform(10),
    shadowSteps: uniform(40, 'int'),
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

function post(u, colorIn) {
  const col = colorIn.mul(u.exposure).clamp(0, 1).pow(u.postGamma).toVar();
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

  const marched = Fn(() => {
    const ndc = uv().mul(2).sub(1).toVar();
    ndc.x.mulAssign(u.resolution.x.div(u.resolution.y));

    const ro = cameraPosition;
    const rd = cameraWorldMatrix
      .mul(vec4(ndc.x.mul(u.tanHalfFov), ndc.y.mul(u.tanHalfFov), -1, 0))
      .xyz.normalize();

    const col = vec3(u.fogColor).toVar();
    const depth = float(1).toVar();

    const { hit, iter, t } = marchSDF(df, ro, rd, {
      epsilon: u.epsilon,
      maxDist: u.escapeDistance,
      maxSteps: u.maxSteps,
      maxTrace: u.escapeDistance,
      stepScale: u.stepSafety,
      tStart: 0.01,
    });

    If(hit.greaterThan(0.5), () => {
      const p = ro.add(rd.mul(t));
      const n = sdfNormal(df, p, u.normalEpsilon);

      const toLight = u.lightPos.sub(p).toVar();
      const distance = toLight.length().toVar();
      const lightDir = toLight.div(distance);

      // The sphere is the only light in the scene, so its inverse-square
      // falloff is what carves the chambers out of the dark.
      const falloff = u.lightIntensity.div(
        float(1).add(distance.mul(distance).mul(u.lightFalloff))
      );

      // A surface facing away from the sphere is already unlit, so marching a
      // shadow ray for it buys nothing — and this is the single most expensive
      // thing in the shader, skipped here on roughly half of all hits.
      const lambert = n.dot(lightDir).max(0).toVar();
      const shadow = float(0).toVar();
      If(lambert.greaterThan(0), () => {
        shadow.assign(
          softShadow(df, p.add(n.mul(u.shadowBias)), lightDir, {
            hardness: u.shadowHardness,
            maxDist: distance,
            stepScale: u.stepSafety,
            steps: u.shadowSteps,
            tStart: u.shadowBias,
          })
        );
      });

      // mrange's fake ambient: rays that grind through many steps are the
      // ones deep in a crevice. It assumes most rays escape early, which is
      // true of the reference's boxed sculpture and false of this unbounded
      // lattice, where every ray exhausts its budget and the term collapses
      // to exp(-9). Off by default; the real point light does this job now.
      const grind = iter.div(u.maxStepsF);
      const crevice = mix(
        float(1),
        grind.mul(grind).mul(-9).exp(),
        u.creviceDarkening
      );

      // Floors at aoFloor, as the reference does — occlusion saturates in a
      // lattice this dense, and bottoming out at zero makes the frame black.
      const cavity = mix(
        float(1),
        u.aoFloor,
        sdfAO(df, p, n, {
          samples: AO_SAMPLES,
          stepSize: u.aoStep,
          strength: u.aoStrength,
        }).pow(3)
      );

      const direct = u.lightColor.mul(falloff).mul(lambert).mul(shadow);
      const ambient = vec3(u.ambientColor).mul(u.ambientStrength);

      col.assign(
        vec3(u.albedo).mul(direct.add(ambient)).mul(cavity).mul(crevice)
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
