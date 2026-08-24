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
  select,
  smoothstep,
  texture,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MAX_WINDOWS } from './radianceConstants';

const WALL_COLOR = vec3(1.0, 0.5, 0.1);
const FLOOR_COLOR = vec3(0.4, 0.4, 0.4);
const FALLOFF_Z = 0.1; // reference's length(vec3(uv-o, 0.1)) singularity guard
const EDGE_AA_PX = 1.5;

const fillMask = (d) => clamp(d.negate(), 0, 1);

// The image pass from radianceCascades2.glsl: shade the scene albedo
// (FLOOR/WALL by the SDF) times the summed radiance of every light. Each
// light's contribution is inverse-square falloff × the radial shadow lookup.
// `worldPos` is reconstructed from the quad's local position so it lands in
// the same absolute-desktop-pixel space the shadow map was marched in,
// independent of DesktopStage's eased world transform.
export default function buildRadianceComposeMaterial({
  ambient,
  decorColor,
  decorFn,
  exposure,
  lightColor,
  lightData,
  origin,
  sceneFn,
  shadowTexture,
  size,
  softness,
  windowCount,
}) {
  const material = new THREE.MeshBasicNodeMaterial({
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  material.colorNode = Fn(() => {
    const worldPos = origin.add(positionLocal.xy.mul(size));
    const dist = sceneFn(worldPos);
    // Decor gets its own albedo, so it has to be told apart from the walls and
    // occluders sceneFn already min'd it together with — hence the second
    // evaluation rather than a flag smuggled out of the first.
    const isDecor = decorFn(worldPos).sub(dist).lessThan(0.5);
    const solid = select(isDecor, decorColor, WALL_COLOR);
    const albedo = mix(FLOOR_COLOR, solid, smoothstep(EDGE_AA_PX, 0, dist));

    const invH = float(1).div(size.y);
    const softPx = softness.mul(size.y);
    const light = vec3(ambient).toVar();

    Loop({ end: MAX_WINDOWS, start: 0, type: 'int' }, ({ i }) => {
      const ld = lightData.element(i);
      const lc = lightColor.element(i);
      const hasLight = and(
        i.lessThan(windowCount),
        and(ld.w.greaterThan(0), ld.z.greaterThan(0))
      );

      If(hasLight, () => {
        const local = worldPos.sub(ld.xy);
        const r = local.length();
        const angle = atan(local.y, local.x);
        const u = fract(angle.div(Math.PI * 2));
        // The shadow-map pass writes light i's row via geometry uv().y, which
        // the WebGPU render-target Y-flip lands at texture-v = 1 - uv().y — so
        // the read has to flip back, or every lookup hits an empty row and
        // nothing casts a shadow.
        const v = float(1).sub(float(i).add(0.5).div(MAX_WINDOWS));

        const occluderDist = texture(shadowTexture, vec2(u, v)).x;
        const lit = float(1).sub(
          smoothstep(occluderDist, occluderDist.add(softPx), r)
        );

        const normR = r.mul(invH);
        const falloff = exposure
          .mul(0.01)
          .div(normR.mul(normR).add(FALLOFF_Z * FALLOFF_Z));
        const source = fillMask(r.sub(ld.z));

        light.addAssign(lc.mul(ld.w).mul(lit.mul(falloff).add(source)));
      });
    });

    return clamp(albedo.mul(light), 0, 1);
  })();

  return material;
}
