import {
  Fn,
  float,
  mix,
  positionLocal,
  texture,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { ballOffset, fresnelTerm, mirrorOffset, nearestGlass } from './glass';

// Glass, as a pass over the finished picture: the bend, the chromatic split,
// and the environment the surface reflects.
//
// Bending the position the LIGHTING is gathered from — so the rays and shadows
// bend too — was tried and pulled back out. It is the more correct thing and it
// did not look better.
//
// Rendered through a Y-down camera to match the compose pass, which means
// DoubleSide: the flipped projection reverses the quad's winding.
export default function buildRefractMaterial(u) {
  const material = new THREE.MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  material.colorNode = Fn(() => {
    const here = uv();
    const worldPos = positionLocal.xy.add(0.5).mul(u.fieldSize);
    const lens = nearestGlass(u, worldPos);
    const lit = texture(u.litTexture, here).xyz;

    // The whole bend happens here again, not in the compose: the compose is
    // back to lighting the scene where the scene actually is. Each channel gets
    // its own index of refraction, so the split falls out of the physics rather
    // than being a scaled vector — scaling the vector fetches red and blue from
    // opposite ends of the frame and paints the ball one flat colour.
    const offsetFor = (delta) =>
      ballOffset(lens, u.refractIor.add(delta), u.refractDepth).div(
        u.fieldSize
      );

    const red = texture(
      u.litTexture,
      here.add(offsetFor(u.refractDispersion.negate()))
    ).x;
    const green = texture(u.litTexture, here.add(offsetFor(float(0)))).y;
    const blue = texture(
      u.litTexture,
      here.add(offsetFor(u.refractDispersion))
    ).z;
    const bent = vec3(red, green, blue);

    const mirror = texture(
      u.litTexture,
      here.add(mirrorOffset(lens).div(u.fieldSize))
    ).xyz;
    const glass = mix(
      bent,
      mirror,
      fresnelTerm(lens, u.refractIor).mul(u.refractReflect)
    );

    return vec4(mix(lit, glass, lens.inside), 1);
  })();

  return material;
}
