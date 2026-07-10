/* eslint-disable camelcase */
import {
  cameraPosition,
  clamp,
  cross,
  float,
  instancedBufferAttribute,
  mix,
  mx_noise_float,
  positionGeometry,
  positionWorld,
  smoothstep,
  time,
  transformNormalToView,
  uv,
  varying,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Night-meadow blade shading, adapted from TouchGrass's Tsushima-style
// material: cubic Bézier spine, gusty directional wind, clump-domed
// normals, moonlight translucency. The cursor-touch bend becomes a
// ghost-touch bend — `uniforms.ghostPosition` tracks the player every
// frame, so grass parts around the ghost as it drifts through.

const TWO_PI = 6.28318;

export default function createBladeMaterial({
  chunkOffsetX = 0,
  chunkOffsetZ = 0,
  store,
  uniforms,
}) {
  const mat = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });

  const offset = instancedBufferAttribute(store.offsetAttribute);
  const data = instancedBufferAttribute(store.dataAttribute);
  const clumpData = instancedBufferAttribute(store.clumpAttribute);

  // Blade root in world space (offsets are chunk-local).
  const worldX = offset.x.add(float(chunkOffsetX));
  const worldZ = offset.z.add(float(chunkOffsetZ));

  const t = uv().y; // 0 root -> 1 tip
  const s = positionGeometry.x.mul(2); // -1..1 across the blade
  const bladeSeed = data.z;
  const phase = data.w.mul(TWO_PI);

  const scale = data.y;
  const height = uniforms.bladeHeight.mul(scale);
  const width = uniforms.bladeWidth.mul(scale);

  // Leaf-shaped taper: fuller in the middle, needle at the tip.
  const widthFactor = t.add(0.35).mul(float(1).sub(t).pow(1.2));

  // Bézier control points, bending along local +Z before yaw.
  const bend = uniforms.bladeBend.mul(clumpData.w.mul(0.8).add(0.4));
  const bendZ = bend.mul(height);
  const p1 = vec3(0, height.mul(0.4), bendZ.mul(0.25));
  const p2 = vec3(0, height.mul(0.75), bendZ.mul(0.55));
  const p3 = vec3(0, height, bendZ);

  // Wind: spatial gust field (rolling waves) × slow breathing envelope.
  const windDir = vec3(uniforms.windDir.x, 0, uniforms.windDir.y);
  const crossDir = vec3(uniforms.windDir.y.negate(), 0, uniforms.windDir.x);
  const drift = time.mul(uniforms.windSpeed);
  const gustField = mx_noise_float(
    vec3(
      worldX.mul(uniforms.windScale).add(drift),
      worldZ.mul(uniforms.windScale),
      drift.mul(0.6)
    )
  )
    .mul(0.5)
    .add(0.5);
  const breathe = time
    .mul(0.35)
    .add(bladeSeed.mul(TWO_PI))
    .sin()
    .mul(0.35)
    .add(0.65);
  const strength = uniforms.windStrength.mul(gustField).mul(breathe);

  // Traveling wave along the wind direction + per-blade frequency.
  const wave = worldX.mul(windDir.x).add(worldZ.mul(windDir.z)).mul(0.6);
  const freq = mix(float(1.2), float(2.6), bladeSeed);
  const low = time.mul(freq).add(phase).add(wave).sin();
  const high = time
    .mul(freq.mul(4))
    .add(phase.mul(1.7))
    .add(wave.mul(1.3))
    .sin();

  // Push (steady lean) + sway (oscillation, mostly wind, some cross-wind).
  const push = strength.mul(height);
  const swayDir = windDir.add(crossDir.mul(high.mul(0.35))).normalize();
  const sway = strength.mul(height).mul(0.5);

  // Ghost touch: blades within touchRadius of the ghost lean away from it,
  // falloff-weighted and tip-heavy like the wind bend.
  const touchDelta = vec3(
    worldX.sub(uniforms.ghostPosition.x),
    0,
    worldZ.sub(uniforms.ghostPosition.z)
  );
  const touchDist = touchDelta.length().max(1e-4);
  const touchFalloff = clamp(
    float(1).sub(touchDist.div(uniforms.touchRadius)),
    0,
    1
  ).pow(2);
  const touchLean = touchDelta
    .div(touchDist)
    .mul(touchFalloff)
    .mul(height)
    .mul(uniforms.touchStrength);

  const q1 = p1
    .add(windDir.mul(push.mul(0.08)))
    .add(swayDir.mul(low.mul(sway).mul(0.25)))
    .add(touchLean.mul(0.2));
  const q2 = p2
    .add(windDir.mul(push.mul(0.15)))
    .add(swayDir.mul(low.mul(sway).mul(0.55)))
    .add(touchLean.mul(0.55));
  const q3 = p3
    .add(windDir.mul(push.mul(0.25)))
    .add(swayDir.mul(low.mul(sway)))
    .add(swayDir.mul(high.mul(sway).mul(0.3)))
    .add(touchLean);

  // Cubic Bézier (p0 = origin) and its tangent.
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

  // Yaw rotation around Y per blade.
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
  const clumpVary = varying(
    vec4(clumpData.x, clumpData.y, clumpData.z, bladeSeed)
  );

  // Fragment normal: midrib/rim shaping across the width, then blended
  // toward the clump dome normal near the roots so clumps read as tufts.
  const across = uv().x.mul(2).sub(1);
  const shaped = geoNormal.add(side.mul(across.mul(0.35))).normalize();
  const clumpNormal = vec3(clumpVary.x, 0.7, clumpVary.y).normalize();
  const domeBlend = float(1).sub(t).pow(0.7).mul(0.3);
  const lightingNormal = mix(shaped, clumpNormal, domeBlend).normalize();
  mat.normalNode = transformNormalToView(lightingNormal);

  // Color: root->tip gradient, clump tint layers, cool night jitter.
  const gradient = mix(
    uniforms.rootColor,
    uniforms.tipColor,
    smoothstep(0, 1, t)
  );
  const layered = gradient
    .mul(mix(float(0.95), float(1.05), clumpVary.z))
    .mul(mix(float(0.95), float(1.05), clumpVary.w));
  const cooled = mix(
    layered,
    layered.mul(vec3(0.85, 0.95, 1.1)),
    clumpVary.w.mul(0.35)
  );

  // Height AO (power curve keeps roots in shadow).
  const ao = mix(float(0.35), float(1.0), clamp(t.pow(2.2), 0, 1));

  // Fake translucency: moonlight through the blade at grazing view angles.
  const viewDir = cameraPosition.sub(positionWorld).normalize();
  const backNdL = clamp(lightingNormal.negate().dot(uniforms.moonDir), 0, 1);
  const grazing = smoothstep(0, 0.6, float(1).sub(geoNormal.dot(viewDir)));
  const thickness = float(1).sub(t).pow(1.3);
  const backlight = backNdL.mul(grazing).mul(thickness);
  const translucency = uniforms.moonColor
    .mul(backlight)
    .mul(uniforms.backlightStrength);

  mat.colorNode = cooled.mul(ao).add(translucency);

  return mat;
}
