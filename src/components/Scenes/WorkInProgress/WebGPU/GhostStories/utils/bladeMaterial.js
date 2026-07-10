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
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Night-meadow blades with QuickGrass-style wind (dev/examples/Quick_Grass,
// grass-lighting-model-vsh.glsl):
// - the wind *direction* is itself a slow spatial noise swirl around the
//   base heading, so neighboring patches lean differently
// - the lean amount is a traveling noise field remapped so every blade
//   always leans a little and gust fronts sweep across the meadow
// - gusts also brighten the tips (bent blades catch the moonlight)
// Plus: cubic Bézier spine, clump-domed normals, moonlight translucency,
// a ghost-touch bend (blades part around the player), and a distance fade
// that shrinks blades to zero before the grass ring ends — chunk streaming
// happens beyond the fade, so grass never visibly pops.

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

  // Distance fade: blades shrink smoothly to nothing approaching the edge
  // of the loaded grass ring (fadeStart/fadeEnd track the ghost).
  const ghostDelta = vec2(
    worldX.sub(uniforms.ghostPosition.x),
    worldZ.sub(uniforms.ghostPosition.z)
  );
  const fade = smoothstep(
    uniforms.fadeEnd,
    uniforms.fadeStart,
    ghostDelta.length()
  );

  const scale = data.y;
  const height = uniforms.bladeHeight.mul(scale).mul(fade);
  const width = uniforms.bladeWidth.mul(scale);

  // Leaf-shaped taper: fuller in the middle, needle at the tip.
  const widthFactor = t.add(0.35).mul(float(1).sub(t).pow(1.2));

  // Bézier control points, bending along local +Z before yaw.
  const bend = uniforms.bladeBend.mul(clumpData.w.mul(0.8).add(0.4));
  const bendZ = bend.mul(height);
  const p1 = vec3(0, height.mul(0.4), bendZ.mul(0.25));
  const p2 = vec3(0, height.mul(0.75), bendZ.mul(0.55));
  const p3 = vec3(0, height, bendZ);

  // ── QuickGrass wind ──
  const windTime = time.mul(uniforms.windSpeed);

  // Direction: slow spatial swirl (±~40°) around the base wind heading.
  const swirl = mx_noise_float(
    vec3(worldX.mul(0.05), worldZ.mul(0.05), windTime.mul(0.12))
  );
  const windAngle = uniforms.windAngle.add(swirl.mul(0.7));
  const windDir = vec3(windAngle.cos(), 0, windAngle.sin());
  const crossDir = vec3(windAngle.sin().negate(), 0, windAngle.cos());

  // Lean amount: noise field traveling along the wind. Remap to 0.25..1
  // (every blade always leans some) then ease-in — gust fronts read as
  // sweeping waves of strongly-bent grass.
  const leanSample = mx_noise_float(
    vec3(
      worldX.mul(uniforms.windScale).add(windTime.mul(uniforms.windDir.x)),
      worldZ.mul(uniforms.windScale).add(windTime.mul(uniforms.windDir.y)),
      bladeSeed.mul(3.1)
    )
  );
  const gust = leanSample.mul(0.5).add(0.5); // 0..1 traveling gust mask
  const leanRemap = gust.mul(0.75).add(0.25);
  const lean = leanRemap.mul(leanRemap).mul(1.25).mul(uniforms.windStrength);

  // High-frequency per-blade flutter layered on the sweep.
  const freq = mix(float(1.6), float(3.2), bladeSeed);
  const flutter = time
    .mul(freq.mul(3))
    .add(phase)
    .add(worldX.mul(windDir.x).add(worldZ.mul(windDir.z)).mul(0.8))
    .sin()
    .mul(0.12);

  const push = lean.add(flutter.mul(uniforms.windStrength)).mul(height);
  const swayDir = windDir.add(crossDir.mul(flutter.mul(2.5))).normalize();

  // Ghost touch: blades within touchRadius of the ghost lean away from it,
  // falloff-weighted and tip-heavy like the wind bend.
  const touchDelta = vec3(ghostDelta.x, 0, ghostDelta.y);
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

  const q1 = p1.add(swayDir.mul(push.mul(0.1))).add(touchLean.mul(0.2));
  const q2 = p2.add(swayDir.mul(push.mul(0.28))).add(touchLean.mul(0.55));
  const q3 = p3.add(swayDir.mul(push.mul(0.55))).add(touchLean);

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
  const gustVary = varying(gust);

  // Fragment normal: midrib/rim shaping across the width, then blended
  // toward the clump dome normal near the roots so clumps read as tufts.
  const across = uv().x.mul(2).sub(1);
  const shaped = geoNormal.add(side.mul(across.mul(0.35))).normalize();
  const clumpNormal = vec3(clumpVary.x, 0.7, clumpVary.y).normalize();
  const domeBlend = float(1).sub(t).pow(0.7).mul(0.3);
  const lightingNormal = mix(shaped, clumpNormal, domeBlend).normalize();
  mat.normalNode = transformNormalToView(lightingNormal);

  // Color: root->tip gradient (ease-in like QuickGrass so tips pop), clump
  // tint layers, cool night jitter, and a gust glow — bent blades catch
  // the moonlight as the wave rolls over them.
  const gradient = mix(uniforms.rootColor, uniforms.tipColor, t.pow(2));
  const layered = gradient
    .mul(mix(float(0.95), float(1.05), clumpVary.z))
    .mul(mix(float(0.95), float(1.05), clumpVary.w));
  const cooled = mix(
    layered,
    layered.mul(vec3(0.85, 0.95, 1.1)),
    clumpVary.w.mul(0.35)
  );
  const gustGlow = float(1).add(gustVary.mul(t).mul(0.35));

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

  mat.colorNode = cooled.mul(ao).mul(gustGlow).add(translucency);

  return mat;
}
