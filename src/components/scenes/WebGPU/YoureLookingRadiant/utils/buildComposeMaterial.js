import {
  Fn,
  If,
  Loop,
  and,
  atan,
  clamp,
  float,
  fract,
  mix,
  positionLocal,
  smoothstep,
  texture,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const FALLOFF_Z = 0.1; // singularity guard, as in CrossTalk's compose
const EDGE_AA_PX = 1.5;

// CrossTalk's radiance shading pass, unchanged in shape: albedo times the
// summed radiance of every light, each contributing inverse-square falloff
// gated by the radial shadow lookup. What differs is only what the albedo is —
// no walls or floor here, just occluding bodies over a flat field.
//
// Deliberately no separate emissive term for emitters. An emitter's albedo is
// the field colour, so what you see where it sits is its own source term on
// that field — continuous with the halo around it. Painting a flat saturated
// disc on top instead makes the light read as a sticker over its glow rather
// than the middle of it, which is exactly what CrossTalk avoids.
// A missing input here does not throw — it lands in the generated WGSL as the
// literal `null` and the pass fails to compile, with a blank frame as the only
// symptom. Cheaper to catch it at construction.
const REQUIRED = [
  'ambient',
  'bodyFn',
  'exposure',
  'fieldColor',
  'lightColor',
  'lightCount',
  'lightData',
  'lightStrength',
  'maxLights',
  'origin',
  'shadowTexture',
  'size',
  'softness',
];

export default function buildComposeMaterial(inputs) {
  const missing = REQUIRED.filter((key) => inputs[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`buildComposeMaterial missing: ${missing.join(', ')}`);
  }

  const {
    ambient,
    bodyFn,
    exposure,
    fieldColor,
    lightColor,
    lightData,
    lightCount,
    lightStrength,
    maxLights,
    origin,
    shadowTexture,
    size,
    softness,
  } = inputs;

  const material = new THREE.MeshBasicNodeMaterial({
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  material.colorNode = Fn(() => {
    const worldPos = origin.add(positionLocal.xy.mul(size));
    const body = bodyFn(worldPos);
    // smoothstep is only defined for edge0 < edge1 in WGSL, so ramp up across
    // the AA band and flip rather than passing the edges reversed.
    const inBody = smoothstep(0, EDGE_AA_PX, body.dist).oneMinus();
    const albedo = mix(fieldColor, body.albedo, inBody);

    const invH = float(1).div(size.y);
    const softPx = softness.mul(size.y);
    const light = vec3(ambient).toVar();

    Loop({ end: lightCount, start: 0, type: 'int' }, ({ i }) => {
      const ld = lightData.element(i);
      const lc = lightColor.element(i);
      const hasLight = and(ld.w.greaterThan(0), ld.z.greaterThan(0));

      If(hasLight, () => {
        const local = worldPos.sub(ld.xy);
        const r = local.length();
        const angle = atan(local.y, local.x);
        const u = fract(angle.div(Math.PI * 2));
        // The shadow pass writes light i's row via geometry uv().y, which the
        // WebGPU render-target Y-flip lands at texture-v = 1 - uv().y, so the
        // read has to flip back or every lookup hits an empty row and nothing
        // casts a shadow. Straight from CrossTalk, and it is not obvious.
        const v = float(1).sub(float(i).add(0.5).div(maxLights));

        const occluderDist = texture(shadowTexture, vec2(u, v)).x;
        const lit = float(1).sub(
          smoothstep(occluderDist, occluderDist.add(softPx), r)
        );

        const normR = r.mul(invH);
        const falloff = exposure
          .mul(0.01)
          .div(normR.mul(normR).add(FALLOFF_Z * FALLOFF_Z));
        const source = clamp(ld.z.sub(r), 0, 1);

        light.addAssign(lc.mul(ld.w).mul(lit.mul(falloff).add(source)));
      });
    });

    // The emitting body itself, into the same accumulator as its halo. A long
    // arc lit only by the point lights along it glows in beads; this is what
    // makes the whole length of it read as a source.
    light.addAssign(body.glow.mul(inBody).mul(lightStrength));

    return clamp(albedo.mul(light), 0, 1);
  })();

  return material;
}
