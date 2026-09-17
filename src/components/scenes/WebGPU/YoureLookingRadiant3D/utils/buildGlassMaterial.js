import {
  Fn,
  If,
  Loop,
  float,
  mix,
  pow,
  reflect,
  refract,
  select,
  texture,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MISS, cameraRay, passUV, projectToScreen } from './rayTSL';

// The flat scene's glass pass with real spheres: bend the view ray through
// both surfaces, carry it Depth radii past the exit, and read the lit frame
// wherever that lands on screen. Also the upscale from the lit pass's size.
const MIRROR_REACH = 1.6;
const EDGE_PX = 1;

export default function buildGlassMaterial(u, litTexture) {
  const material = new THREE.MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });

  material.colorNode = Fn(() => {
    const here = passUV();
    const lit = texture(litTexture, here);
    const color = lit.rgb.toVar();
    const { dir, origin } = cameraRay(u);

    const nearestT = float(MISS).toVar();
    const centre = vec3(0).toVar();
    const radius = float(1).toVar();
    const coverage = float(0).toVar();

    Loop({ end: u.glassCount, start: 0, type: 'int' }, ({ i }) => {
      const data = u.glassData.element(i);
      const toCentre = data.xyz.sub(origin);
      const along = toCentre.dot(dir);
      const perp = toCentre.sub(dir.mul(along)).length();
      const footprint = along.max(1e-3).mul(u.pixelAngle).mul(EDGE_PX);
      const edge = data.w.sub(perp).div(footprint).add(0.5).clamp(0, 1);

      If(
        edge
          .greaterThan(0)
          .and(along.greaterThan(0))
          .and(along.lessThan(nearestT)),
        () => {
          nearestT.assign(along);
          centre.assign(data.xyz);
          radius.assign(data.w);
          coverage.assign(edge);
        }
      );
    });

    If(coverage.greaterThan(0).and(nearestT.lessThan(lit.a)), () => {
      const toCentre = centre.sub(origin);
      const along = toCentre.dot(dir);
      const offAxis = toCentre.sub(dir.mul(along));
      const perp = offAxis.length().min(radius.mul(0.999));
      const inside = radius.mul(radius).sub(perp.mul(perp)).sqrt();
      const point = origin.add(dir.mul(along.sub(inside)));
      const normal = point.sub(centre).div(radius);

      const bentThrough = (ior) => {
        const entry = refract(dir, normal, float(1).div(ior));
        const chord = centre.sub(point).dot(entry).mul(2);
        const exit = point.add(entry.mul(chord));
        const exitNormal = exit.sub(centre).div(radius);
        const leaving = refract(entry, exitNormal.negate(), ior);
        const escaped = leaving.dot(leaving).greaterThan(0.25);
        const onward = select(
          escaped,
          leaving,
          reflect(entry, exitNormal.negate())
        );
        return projectToScreen(
          u,
          exit.add(onward.mul(radius.mul(u.glassDepth)))
        );
      };

      const red = texture(
        litTexture,
        bentThrough(u.glassIor.sub(u.glassDispersion))
      ).r;
      const green = texture(litTexture, bentThrough(u.glassIor)).g;
      const blue = texture(
        litTexture,
        bentThrough(u.glassIor.add(u.glassDispersion))
      ).b;

      const mirrorAt = point.add(
        reflect(dir, normal).mul(radius.mul(MIRROR_REACH))
      );
      const mirror = texture(litTexture, projectToScreen(u, mirrorAt)).rgb;

      const f0 = u.glassIor.sub(1).div(u.glassIor.add(1));
      const r0 = f0.mul(f0);
      const cosine = normal.dot(dir.negate()).max(0);
      const fresnel = r0.add(float(1).sub(r0).mul(pow(cosine.oneMinus(), 5)));

      const glass = mix(
        vec3(red, green, blue),
        mirror,
        fresnel.mul(u.glassReflect)
      );
      color.assign(mix(color, glass, coverage));
    });

    return vec4(color, 1);
  })();

  return material;
}
