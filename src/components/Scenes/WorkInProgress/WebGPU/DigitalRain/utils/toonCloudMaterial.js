import {
  Fn,
  dot,
  normalWorld,
  normalize,
  screenCoordinate,
  select,
  uniform,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// TSL port of ~/dev/examples/clouds's shaders/CloudShader.ts: a 3-tone toon
// shade (base / shade1 / shade2) driven by a single dot(normal, light)
// term, with a dithered screen-space checker pattern breaking up the
// shade1<->shade2 transition instead of a smooth gradient — the reference's
// distinctive "hatched" cloud look. Shadow-map occlusion darkening is
// dropped (no shadow-casting light rig here); everything else is faithful.
export default function createToonCloudMaterial({
  baseColor,
  shadeColor1,
  shadeColor2,
  lightDirection,
}) {
  const uniforms = {
    baseColor: uniform(new THREE.Color(baseColor)),
    shadeColor1: uniform(new THREE.Color(shadeColor1)),
    shadeColor2: uniform(new THREE.Color(shadeColor2)),
    lightDirection: uniform(
      new THREE.Vector3().copy(lightDirection).normalize()
    ),
  };

  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = Fn(() => {
    const weighting = dot(normalize(normalWorld), uniforms.lightDirection).max(
      0
    );

    const ditherOn = screenCoordinate.x
      .add(2)
      .mod(4.0001)
      .add(screenCoordinate.y.add(2).mod(4))
      .greaterThan(6);

    const dithered = select(
      ditherOn,
      uniforms.shadeColor2,
      uniforms.shadeColor1
    );
    const belowMid = select(
      weighting.lessThan(0.75),
      dithered,
      uniforms.shadeColor1
    );
    return select(weighting.lessThan(1.0), belowMid, uniforms.baseColor);
  })();

  return { material, uniforms };
}
