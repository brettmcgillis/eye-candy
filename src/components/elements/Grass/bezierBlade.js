import {
  cameraPosition,
  clamp,
  cross,
  float,
  mix,
  positionGeometry,
  positionWorld,
  smoothstep,
  transformNormalToView,
  uv,
  varying,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { TWO_PI, WINDS } from './wind';

function touchLean({ height, uniforms, worldX, worldZ }) {
  const delta = vec3(
    worldX.sub(uniforms.touchPosition.x),
    0,
    worldZ.sub(uniforms.touchPosition.z)
  );
  const dist = delta.length().max(1e-4);
  const falloff = clamp(float(1).sub(dist.div(uniforms.touchRadius)), 0, 1).pow(
    2
  );
  return delta.div(dist).mul(falloff).mul(height).mul(uniforms.touchStrength);
}

function distanceFade({ uniforms, worldX, worldZ }) {
  const delta = vec2(
    worldX.sub(uniforms.fadeCenter.x),
    worldZ.sub(uniforms.fadeCenter.z)
  );
  return smoothstep(uniforms.fadeEnd, uniforms.fadeStart, delta.length());
}

function gradientCurve(gradient, t) {
  return gradient === 'smooth' ? smoothstep(0, 1, t) : t.pow(gradient);
}

export default function bezierBlade(frame, uniforms, options) {
  const { clump, data, offset, rotateY, t, worldX, worldZ } = frame;
  const {
    aoFloor = 0.4,
    fade = false,
    gradient = 'smooth',
    gustGlow = 0,
    jitterTint = [1.08, 1, 0.8],
    lift,
    shade,
    touch = false,
    wind = 'quick',
  } = options;

  const s = positionGeometry.x.mul(2);
  const bladeSeed = data.z;
  const phase = data.w.mul(TWO_PI);
  const scale = data.y;
  const baseHeight = uniforms.bladeHeight.mul(scale);
  const height = fade
    ? baseHeight.mul(distanceFade({ uniforms, worldX, worldZ }))
    : baseHeight;
  const width = uniforms.bladeWidth.mul(scale);
  const widthFactor = t.add(0.35).mul(float(1).sub(t).pow(1.2));

  const bend = uniforms.bladeBend.mul(clump.w.mul(0.8).add(0.4));
  const bendZ = bend.mul(height);
  const blow = WINDS[wind]({
    bladeSeed,
    height,
    offset,
    phase,
    uniforms,
    worldX,
    worldZ,
  });
  let q1 = vec3(0, height.mul(0.4), bendZ.mul(0.25)).add(blow.offsets[0]);
  let q2 = vec3(0, height.mul(0.75), bendZ.mul(0.55)).add(blow.offsets[1]);
  let q3 = vec3(0, height, bendZ).add(blow.offsets[2]);
  if (touch) {
    const lean = touchLean({ height, uniforms, worldX, worldZ });
    q1 = q1.add(lean.mul(0.2));
    q2 = q2.add(lean.mul(0.55));
    q3 = q3.add(lean);
  }

  const u = float(1).sub(t);
  const spine = q1
    .mul(u.mul(u).mul(t).mul(3))
    .add(q2.mul(u.mul(t).mul(t).mul(3)))
    .add(q3.mul(t.mul(t).mul(t)));
  const tangent = q1
    .mul(u.mul(u).mul(3))
    .add(q2.sub(q1).mul(u.mul(t).mul(6)))
    .add(q3.sub(q2).mul(t.mul(t).mul(3)))
    .normalize();

  const sideLocal = vec3(1, 0, 0);
  const localPos = spine.add(sideLocal.mul(s.mul(width).mul(widthFactor)));
  let positionNode = rotateY(localPos).add(offset);
  if (lift) {
    positionNode = positionNode.add(vec3(0, lift(frame), 0));
  }

  const side = varying(rotateY(sideLocal));
  const geoNormal = varying(rotateY(cross(sideLocal, tangent).normalize()));
  const clumpVary = varying(vec4(clump.x, clump.y, clump.z, bladeSeed));

  const across = uv().x.mul(2).sub(1);
  const shaped = geoNormal.add(side.mul(across.mul(0.35))).normalize();
  const clumpNormal = vec3(clumpVary.x, 0.7, clumpVary.y).normalize();
  const domeBlend = float(1).sub(t).pow(0.7).mul(0.3);
  const lightingNormal = mix(shaped, clumpNormal, domeBlend).normalize();

  const layered = mix(
    uniforms.rootColor,
    uniforms.tipColor,
    gradientCurve(gradient, t)
  )
    .mul(mix(float(0.95), float(1.05), clumpVary.z))
    .mul(mix(float(0.95), float(1.05), clumpVary.w));
  const jittered = mix(
    layered,
    layered.mul(vec3(...jitterTint)),
    clumpVary.w.mul(0.35)
  );
  const ao = mix(float(aoFloor), float(1.0), clamp(t.pow(2.2), 0, 1));
  let lit = jittered.mul(ao);
  if (gustGlow) {
    lit = lit.mul(float(1).add(varying(blow.gust).mul(t).mul(gustGlow)));
  }

  const viewDir = cameraPosition.sub(positionWorld).normalize();
  const backNdL = clamp(
    lightingNormal.negate().dot(uniforms.backlightDir),
    0,
    1
  );
  const grazing = smoothstep(0, 0.6, float(1).sub(geoNormal.dot(viewDir)));
  const thickness = float(1).sub(t).pow(1.3);
  const translucency = uniforms.backlightColor
    .mul(backNdL.mul(grazing).mul(thickness))
    .mul(uniforms.backlightStrength);

  const color = lit.add(translucency);

  return {
    colorNode: shade ? color.mul(shade(positionWorld)) : color,
    normalNode: transformNormalToView(lightingNormal),
    positionNode,
  };
}
