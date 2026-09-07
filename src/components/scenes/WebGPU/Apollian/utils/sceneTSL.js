import {
  Fn,
  If,
  float,
  mix,
  positionGeometry,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  apollian4,
  marchSDF,
  rot2,
  sdBox,
  sdfAO,
  sdfNormal,
} from '@modules/sdf';

const ESCAPE_DISTANCE = 20;
const AO_SAMPLES = 12;
const AO_STEP = 0.012;
const FOCAL = 3;

export function createUniforms() {
  return {
    aoStrength: uniform(1),
    bone: uniform(new THREE.Color(0.89, 0.855, 0.788)),
    camForward: uniform(new THREE.Vector3(0, 0, -1)),
    camPos: uniform(new THREE.Vector3()),
    camRight: uniform(new THREE.Vector3(1, 0, 0)),
    camUp: uniform(new THREE.Vector3(0, 1, 0)),
    epsilon: uniform(0.0003),
    fogAmount: uniform(0.001),
    foldScale: uniform(1 / 0.75),
    folds: uniform(7, 'int'),
    lensShift: uniform(0.225),
    maxSteps: uniform(130, 'int'),
    maxStepsF: uniform(130),
    orbitPeriod: uniform(120),
    pivot: uniform(new THREE.Vector3()),
    postGamma: uniform(0.65),
    resolution: uniform(new THREE.Vector2(1, 1)),
    saturation: uniform(-0.5),
    sliceRot: uniform(new THREE.Vector3()),
    sliceW: uniform(0.125),
    tanHalfFov: uniform(Math.tan(THREE.MathUtils.degToRad(37) / 2)),
    time: uniform(0),
    useCamera: uniform(0),
    vignette: uniform(1),
    zoom: uniform(1),
  };
}

// The 3D point is lifted to 4D at a fixed w, then the three w-planes are
// rotated — that rotation is what moves the slice through the gasket.
function sliceDistance(u, p) {
  const p4 = vec4(p, u.sliceW).toVar();

  const xw = rot2(vec2(p4.x, p4.w), u.sliceRot.x);
  p4.x.assign(xw.x);
  p4.w.assign(xw.y);

  const yw = rot2(vec2(p4.y, p4.w), u.sliceRot.y);
  p4.y.assign(yw.x);
  p4.w.assign(yw.y);

  const zw = rot2(vec2(p4.z, p4.w), u.sliceRot.z);
  p4.z.assign(zw.x);
  p4.w.assign(zw.y);

  const gasket = apollian4(p4, u.foldScale, u.folds);
  const bounds = sdBox(p.sub(vec3(0, 0.5, 0)), vec3(1.5)).sub(0.5);
  return gasket.max(bounds);
}

// Zoom rescales the domain about a pivot instead of flying the camera in: the
// marcher keeps working at its original scale, so float precision stays where
// the camera is looking however deep the zoom goes.
export function createDistanceField(u) {
  return (p) => sliceDistance(u, u.pivot.add(p.div(u.zoom))).mul(u.zoom);
}

function post(u, colorIn, q) {
  const col = colorIn.clamp(0, 1).pow(u.postGamma).toVar();
  col.assign(
    col.mul(0.6).add(
      col
        .mul(col)
        .mul(vec3(3).sub(col.mul(2)))
        .mul(0.4)
    )
  );
  col.assign(mix(col, vec3(col.dot(vec3(0.33))), u.saturation));

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

export function buildFractalMaterial(u) {
  const df = createDistanceField(u);

  const color = Fn(() => {
    const q = uv();
    const shaderView = u.useCamera.lessThan(0.5);

    const ndc = q.mul(2).sub(1).toVar();
    If(shaderView, () => {
      ndc.y.addAssign(u.lensShift);
    });
    ndc.x.mulAssign(u.resolution.x.div(u.resolution.y));

    const ro = vec3(0).toVar();
    const rd = vec3(0).toVar();

    If(shaderView, () => {
      const origin = vec3(-4, 1, 0).toVar();
      const spun = rot2(
        vec2(origin.x, origin.z),
        u.time.mul(2 * Math.PI).div(u.orbitPeriod)
      );
      origin.x.assign(spun.x);
      origin.z.assign(spun.y);

      const forward = origin.negate().normalize();
      const side = forward.cross(vec3(0, 1, 0)).normalize();
      const up = side.cross(forward).normalize();

      ro.assign(origin);
      rd.assign(
        side.mul(ndc.x).add(up.mul(ndc.y)).add(forward.mul(FOCAL)).normalize()
      );
    }).Else(() => {
      ro.assign(u.camPos);
      rd.assign(
        u.camRight
          .mul(ndc.x.mul(u.tanHalfFov))
          .add(u.camUp.mul(ndc.y.mul(u.tanHalfFov)))
          .add(u.camForward)
          .normalize()
      );
    });

    const bg = mix(u.bone.mul(0.5), u.bone, smoothstep(-1, 1, ndc.y)).toVar();
    const col = bg.toVar();

    const { hit, iter, t } = marchSDF(df, ro, rd, {
      epsilon: u.epsilon,
      maxDist: ESCAPE_DISTANCE,
      maxSteps: u.maxSteps,
      maxTrace: ESCAPE_DISTANCE,
      tStart: 0.2,
    });

    If(hit.greaterThan(0.5), () => {
      const p = ro.add(rd.mul(t));
      const n = sdfNormal(df, p);

      const grind = iter.div(u.maxStepsF);
      const cheapAmbient = grind.mul(grind).mul(-9).exp();
      const occlusion = sdfAO(df, p, n, {
        samples: AO_SAMPLES,
        stepSize: AO_STEP,
        strength: u.aoStrength,
      });

      const lit = mix(float(1), float(0.125), occlusion.pow(3))
        .mul(cheapAmbient)
        .mul(u.bone);

      const fog = t.mul(t).mul(u.fogAmount).negate().exp().oneMinus();
      col.assign(mix(lit, bg, fog));
    });

    return vec4(post(u, col, q), 1);
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
