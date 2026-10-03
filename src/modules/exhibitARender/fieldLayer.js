/* eslint-disable no-param-reassign */
import {
  Break,
  Discard,
  Fn,
  If,
  Loop,
  cameraPosition,
  cameraProjectionMatrix,
  cameraViewMatrix,
  cameraWorldMatrix,
  float,
  int,
  max,
  mix,
  positionWorld,
  pow,
  reflect,
  select,
  smoothstep,
  sqrt,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { sdfAO } from '@modules/apollonian';

import { createExhibitFieldNode } from './fields';
import { surfaceLook, tonemap } from './look';
import { skyColor, studioIrradiance } from './stage';

const STEP_SAFETY = { algebraic: 0.55, default: 0.9 };

export function createMarchUniforms() {
  return {
    aoSamples: int(8),
    boundRadius: uniform(1),
    hitEpsilon: uniform(0.0004),
    marchSteps: int(160),
    objectSize: uniform(1),
    shadowSteps: int(40),
    toObject: uniform(new THREE.Matrix3()),
  };
}

// Quilez's penumbra estimate; a ray that runs past `maxDist` escaped and is
// lit.
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

const lobe = (dir, lightDir, rough) =>
  pow(max(dir.dot(lightDir), 0), mix(float(900), float(5), rough)).mul(
    mix(float(1.2), float(0.15), rough)
  );

// The field exhibit, ray-marched inside a box that bounds it. The hit is
// written as depth, so the proxy sorts against the plinth like any mesh and
// — because the shadow pass reuses `depthNode` and `maskShadowNode` from the
// light's camera — casts a real shadow-map shadow onto the plinth and floor.
// Zero, but reading every uniform in `groups`: see rig.js `named`.
function anchor(groups) {
  let sum = float(0);
  groups.forEach((group) =>
    Object.values(group).forEach((node) => {
      if (!node?.isUniformNode) return;
      const { value } = node;
      let scalar;
      if (typeof value === 'number') scalar = node.toFloat();
      else if (value?.isMatrix3 || value?.isMatrix4) scalar = node.element(0).x;
      else scalar = node.x;
      sum = sum.add(scalar);
    })
  );
  return sum.mul(0);
}

export function buildFieldMaterial({
  anchors,
  family,
  field,
  guest,
  id,
  look,
  march,
  material: materialName,
  stage,
}) {
  const node = createExhibitFieldNode(id, field, guest);
  const toObject = (p) => march.toObject.mul(p).div(march.objectSize);
  const objectD = Fn(([p]) =>
    node.distance(toObject(p)).mul(march.objectSize)
  ).setLayout({
    inputs: [{ name: 'p', type: 'vec3' }],
    name: 'exhibitDistance',
    type: 'float',
  });
  const safety = STEP_SAFETY[family] ?? STEP_SAFETY.default;

  const hit = Fn(() => {
    const perspective = cameraProjectionMatrix
      .element(2)
      .w.abs()
      .greaterThan(0.5);
    const forward = cameraWorldMatrix.element(2).xyz.normalize().negate();
    const rd = select(
      perspective,
      positionWorld.sub(cameraPosition).normalize(),
      forward
    );
    const R = march.boundRadius;
    const ro = select(
      perspective,
      cameraPosition,
      positionWorld.sub(rd.mul(R.mul(4)))
    );
    const b = ro.dot(rd);
    const h = b.mul(b).sub(ro.dot(ro)).add(R.mul(R));
    const result = vec4(0).toVar();
    If(h.greaterThan(0), () => {
      const root = sqrt(h);
      const t = max(b.negate().sub(root), 0).toVar();
      const tEnd = b.negate().add(root);
      const size = march.objectSize;
      const eps = march.hitEpsilon;
      Loop({ end: march.marchSteps, start: 0, type: 'int' }, () => {
        const d = objectD(ro.add(rd.mul(t)));
        If(d.lessThan(eps.mul(t).max(size.mul(1e-5))), () => {
          result.assign(vec4(ro.add(rd.mul(t)), 1));
          Break();
        });
        If(t.greaterThan(tEnd), () => {
          Break();
        });
        t.addAssign(max(d.mul(safety), eps.mul(t)));
      });
    });
    return result;
  })().toVar('fieldHit');

  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
  const clip = cameraProjectionMatrix
    .mul(cameraViewMatrix)
    .mul(vec4(hit.xyz, 1));
  material.depthNode = clip.z.div(clip.w).add(anchor(anchors));
  material.maskShadowNode = hit.w.greaterThan(0.5);

  material.fragmentNode = Fn(() => {
    Discard(hit.w.lessThan(0.5));
    const p = hit.xyz;
    const size = march.objectSize;
    const view = cameraPosition.sub(p).normalize();
    const n = tetraNormal(
      objectD,
      p,
      size.mul(0.0006).max(p.sub(cameraPosition).length().mul(march.hitEpsilon))
    );
    const objectPoint = toObject(p);
    const info = node.info(objectPoint);
    const surface = surfaceLook(look, objectPoint, n, info.y, materialName);
    const L = stage.lightDir;
    const nl = max(n.dot(L), 0);
    const shadow = softShadow(objectD, p.add(n.mul(size.mul(0.004))), L, {
      hardness: stage.shadowHardness,
      maxDist: march.boundRadius.mul(2),
      steps: march.shadowSteps,
      tStart: size.mul(0.01),
    });
    const ao = float(1).sub(
      sdfAO(objectD, p, n, {
        samples: march.aoSamples,
        stepSize: size.mul(0.012),
        strength: float(1).div(size),
      })
    );
    const r = reflect(view.negate(), n);
    const fres = pow(float(1).sub(max(n.dot(view), 0)), 5);
    const f0 = mix(vec3(0.04), surface.albedo, surface.metal);
    const specColor = mix(f0, vec3(1), fres);
    const sky = (dir) => skyColor(stage, dir).mul(stage.ambient);
    const rimLight = stage.rimColor.mul(max(n.dot(stage.rimDir), 0));
    const diffuse = surface.albedo
      .mul(float(1).sub(surface.metal))
      .mul(
        stage.lightColor
          .mul(nl)
          .mul(shadow)
          .add(rimLight)
          .add(studioIrradiance(stage, n).mul(stage.ambient).mul(ao))
      );
    const reflection = sky(r)
      .mul(ao)
      .add(stage.lightColor.mul(lobe(r, L, surface.rough)).mul(shadow))
      .add(stage.rimColor.mul(lobe(r, stage.rimDir, surface.rough)))
      .mul(specColor)
      .mul(mix(float(0.35), float(1), surface.metal.max(fres)));
    const coat = sky(r)
      .mul(ao)
      .add(stage.lightColor.mul(lobe(r, L, float(0.05))).mul(shadow))
      .mul(fres.mul(0.96).add(0.04))
      .mul(surface.clearcoat);
    const lit = diffuse.add(reflection).add(coat);
    return vec4(tonemap(lit.mul(stage.exposure)), 1);
  })();

  return material;
}

// A box round the bound; the material decides per pixel whether the ray
// meets the solid.
export function createFieldProxy() {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  return mesh;
}
