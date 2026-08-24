/* eslint-disable camelcase */
import {
  Loop,
  cameraPosition,
  clamp,
  cross,
  float,
  instancedBufferAttribute,
  mix,
  mx_noise_float,
  positionGeometry,
  positionWorld,
  select,
  smoothstep,
  time,
  transformNormalToView,
  uniform,
  uniformArray,
  uv,
  varying,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MAX_GRASS_DISTURBERS } from './sceneLayout';

const TWO_PI = 6.28318;

// Instanced blades adapted from GhostStories' QuickGrass port: cubic Bézier
// spine, a traveling wind gust whose direction itself swirls, per-blade
// flutter, and a fake sun translucency. The ghost-touch bend is generalized
// into a Loop over a uniform array of rock impactors — every landed rock bends
// the blades around it out of the way.
export default function createBladeMaterial({
  offsetAttribute,
  dataAttribute,
}) {
  const u = {
    bladeHeight: uniform(1.4),
    bladeWidth: uniform(0.06),
    bladeBend: uniform(0.7),
    windAngle: uniform(0.35),
    windStrength: uniform(0.55),
    windSpeed: uniform(1.0),
    windScale: uniform(0.12),
    windTravel: uniform(new THREE.Vector2(0.6, 0.4)),
    rootColor: uniform(new THREE.Color('#33421b')),
    tipColor: uniform(new THREE.Color('#9bc24a')),
    translucency: uniform(0.6),
    sunDir: uniform(new THREE.Vector3(0.5, 1, 0.4).normalize()),
    disturbCount: uniform(0, 'int'),
    disturbers: uniformArray(
      Array.from({ length: MAX_GRASS_DISTURBERS }, () => new THREE.Vector4()),
      'vec4'
    ),
  };

  const mat = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });

  const offset = instancedBufferAttribute(offsetAttribute);
  const data = instancedBufferAttribute(dataAttribute);

  const worldX = offset.x;
  const worldZ = offset.z;
  const t = uv().y;
  const s = positionGeometry.x.mul(2);
  const bladeSeed = data.z;
  const phase = data.w.mul(TWO_PI);
  const scale = data.y;

  const height = u.bladeHeight.mul(scale);
  const width = u.bladeWidth.mul(scale);
  const widthFactor = t.add(0.35).mul(float(1).sub(t).pow(1.2));

  const bendZ = u.bladeBend.mul(height);
  const p1 = vec3(0, height.mul(0.4), bendZ.mul(0.25));
  const p2 = vec3(0, height.mul(0.75), bendZ.mul(0.55));
  const p3 = vec3(0, height, bendZ);

  // Wind — direction swirls slowly in space; lean is a traveling gust front.
  const windTime = time.mul(u.windSpeed);
  const swirl = mx_noise_float(
    vec3(worldX.mul(0.05), worldZ.mul(0.05), windTime.mul(0.12))
  );
  const windAngle = u.windAngle.add(swirl.mul(0.7));
  const windDir = vec3(windAngle.cos(), 0, windAngle.sin());
  const crossDir = vec3(windAngle.sin().negate(), 0, windAngle.cos());

  const leanSample = mx_noise_float(
    vec3(
      worldX.mul(u.windScale).add(windTime.mul(u.windTravel.x)),
      worldZ.mul(u.windScale).add(windTime.mul(u.windTravel.y)),
      bladeSeed.mul(3.1)
    )
  );
  const gust = leanSample.mul(0.5).add(0.5);
  const leanRemap = gust.mul(0.75).add(0.25);
  const lean = leanRemap.mul(leanRemap).mul(1.25).mul(u.windStrength);

  const freq = mix(float(1.6), float(3.2), bladeSeed);
  const flutter = time
    .mul(freq.mul(3))
    .add(phase)
    .add(worldX.mul(windDir.x).add(worldZ.mul(windDir.z)).mul(0.8))
    .sin()
    .mul(0.12);

  const push = lean.add(flutter.mul(u.windStrength)).mul(height);
  const swayDir = windDir.add(crossDir.mul(flutter.mul(2.5))).normalize();

  // Rock disturbance — sum outward leans from every active impactor.
  const disturbLean = vec3(0, 0, 0).toVar();
  Loop({ start: 0, end: MAX_GRASS_DISTURBERS, type: 'int' }, ({ i }) => {
    const alive = i.lessThan(u.disturbCount);
    const d = u.disturbers.element(i);
    const delta = vec3(worldX.sub(d.x), 0, worldZ.sub(d.y));
    const dist = delta.length().max(1e-3);
    const falloff = clamp(float(1).sub(dist.div(d.z.max(1e-3))), 0, 1).pow(2);
    const contrib = delta.div(dist).mul(falloff).mul(d.w).mul(height);
    disturbLean.assign(disturbLean.add(select(alive, contrib, vec3(0, 0, 0))));
  });

  const q1 = p1.add(swayDir.mul(push.mul(0.1))).add(disturbLean.mul(0.2));
  const q2 = p2.add(swayDir.mul(push.mul(0.28))).add(disturbLean.mul(0.55));
  const q3 = p3.add(swayDir.mul(push.mul(0.55))).add(disturbLean);

  const uu = float(1).sub(t);
  const spine = q1
    .mul(uu.mul(uu).mul(t).mul(3))
    .add(q2.mul(uu.mul(t).mul(t).mul(3)))
    .add(q3.mul(t.mul(t).mul(t)));
  const tangent = q1
    .mul(uu.mul(uu).mul(3))
    .add(q2.sub(q1).mul(uu.mul(t).mul(6)))
    .add(q3.sub(q2).mul(t.mul(t).mul(3)))
    .normalize();

  const cosA = data.x.cos();
  const sinA = data.x.sin();
  const rotateY = (v) =>
    vec3(
      v.x.mul(cosA).add(v.z.mul(sinA)),
      v.y,
      v.z.mul(cosA).sub(v.x.mul(sinA))
    );

  const sideLocal = vec3(1, 0, 0);
  const localPos = spine.add(sideLocal.mul(s.mul(width).mul(widthFactor)));
  mat.positionNode = rotateY(localPos).add(offset);

  const side = varying(rotateY(sideLocal));
  const geoNormal = varying(rotateY(cross(sideLocal, tangent).normalize()));
  const gustVary = varying(gust);

  const across = uv().x.mul(2).sub(1);
  const shaped = geoNormal.add(side.mul(across.mul(0.35))).normalize();
  mat.normalNode = transformNormalToView(shaped);

  const gradient = mix(u.rootColor, u.tipColor, t.pow(2));
  const gustGlow = float(1).add(gustVary.mul(t).mul(0.35));
  const ao = mix(float(0.4), float(1.0), clamp(t.pow(2.2), 0, 1));

  const viewDir = cameraPosition.sub(positionWorld).normalize();
  const backNdL = clamp(shaped.negate().dot(u.sunDir), 0, 1);
  const grazing = smoothstep(0, 0.6, float(1).sub(geoNormal.dot(viewDir)));
  const thickness = float(1).sub(t).pow(1.3);
  const backlight = u.tipColor
    .mul(backNdL.mul(grazing).mul(thickness))
    .mul(u.translucency);

  mat.colorNode = gradient.mul(ao).mul(gustGlow).add(backlight);

  return { material: mat, uniforms: u };
}
