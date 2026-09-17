import {
  Fn,
  If,
  Loop,
  atan,
  clamp,
  float,
  int,
  mix,
  select,
  tan,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  MISS,
  boxRange,
  buildShadowLookup,
  cameraRay,
  pixelJitter,
  sphereHit,
} from './rayTSL';

// The flat scene's compose, integrated along a view ray instead of read at one
// point of a plane. Its falloff, exposure * 0.01 / (r² + 0.01), has a closed
// form along a line, so every halo is exact; shadows are the one thing
// sampled, at points spread evenly across that integral's angle so each
// sample carries equal weight.
const FALLOFF_EPS2 = 0.01;
const LAMBERT_FLOOR = 0;

export default function buildLitMaterial(u, atlas, tileSize) {
  const shadowAt = buildShadowLookup(u, atlas, tileSize);

  // Alpha carries the ray depth for the glass pass; an opaque material would
  // overwrite it with 1.
  const material = new THREE.MeshBasicNodeMaterial({
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    transparent: true,
  });

  material.colorNode = Fn(() => {
    const { dir, origin } = cameraRay(u);
    const { t0, t1 } = boxRange(u, origin, dir);
    const color = vec3(0).toVar();
    const depth = float(MISS).toVar();

    If(t1.greaterThan(t0), () => {
      const hitT = float(MISS).toVar();
      const hitIndex = int(-1).toVar();

      Loop({ end: u.solidCount, start: 0, type: 'int' }, ({ i }) => {
        const data = u.solidData.element(i);
        const t = sphereHit(origin, dir, data.xyz, data.w);

        If(t.lessThan(hitT), () => {
          hitT.assign(t);
          hitIndex.assign(i);
        });
      });

      const hit = hitIndex.greaterThanEqual(0).and(hitT.lessThan(t1));
      const tEnd = select(hit, hitT, t1);
      const jitter = pixelJitter();
      const samples = float(u.shaftSamples);
      const air = vec3(u.ambient.mul(tEnd.sub(t0).min(1))).toVar();

      Loop({ end: u.lightCount, start: 0, type: 'int' }, ({ i }) => {
        const ld = u.lightData.element(i);
        const toLight = ld.xyz.sub(origin);
        const along = toLight.dot(dir);
        const perp2 = toLight.dot(toLight).sub(along.mul(along)).max(0);
        const h = perp2.add(FALLOFF_EPS2).sqrt();
        const a = atan(t0.sub(along).div(h));
        const b = atan(tEnd.sub(along).div(h));
        const integral = b.sub(a).div(h).mul(u.exposure).mul(0.01);
        const lit = float(0).toVar();

        Loop(
          { end: u.shaftSamples, name: 'k', start: 0, type: 'int' },
          ({ k }) => {
            const angle = mix(a, b, float(k).add(jitter).div(samples));
            const t = along.add(h.mul(tan(angle)));
            lit.addAssign(shadowAt(origin.add(dir.mul(t)), i));
          }
        );

        air.addAssign(
          u.lightColor.element(i).mul(ld.w).mul(integral).mul(lit.div(samples))
        );
      });

      color.assign(u.fieldColor.mul(air).mul(u.density));
      depth.assign(tEnd);

      If(hit, () => {
        const data = u.solidData.element(hitIndex);
        const info = u.solidInfo.element(hitIndex);
        const tint = u.solidColor.element(hitIndex);
        const point = origin.add(dir.mul(hitT));
        const normal = point.sub(data.xyz).div(data.w);
        const surface = vec3(u.ambient).toVar();

        Loop({ end: u.lightCount, start: 0, type: 'int' }, ({ i }) => {
          const ld = u.lightData.element(i);
          const toLight = ld.xyz.sub(point);
          const r2 = toLight.dot(toLight);
          const facing = normal
            .dot(toLight.div(r2.sqrt().max(1e-6)))
            .max(LAMBERT_FLOOR);
          const falloff = u.exposure.mul(0.01).div(r2.add(FALLOFF_EPS2));

          surface.addAssign(
            u.lightColor
              .element(i)
              .mul(ld.w)
              .mul(falloff)
              .mul(facing)
              .mul(shadowAt(point, i))
          );
        });

        surface.addAssign(tint.mul(info.y).mul(u.lightStrength));
        const albedo = mix(u.bodyTint, tint, info.y);
        color.addAssign(albedo.mul(surface));
      });
    });

    return vec4(clamp(color, 0, 1), depth);
  })();

  return material;
}
