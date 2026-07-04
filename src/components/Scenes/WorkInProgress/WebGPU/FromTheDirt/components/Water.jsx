/* eslint-disable camelcase */
import {
  mix,
  mx_noise_float,
  positionWorld,
  smoothstep,
  texture,
  time,
  transformNormalToView,
  uniform,
  uv,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

const FOAM_COLOR = new THREE.Color('#e3efe9');

// One flat water table under the whole terrain. The meadow floor is always
// above it, so water is only visible inside the carved letters — taller
// strata walls under hills, shallower under dips, all sharing one level.
// The water samples the shared heightfield for true depth: shallow edges get
// an animated foam ring, deep letter floors shade darker.
function Water({ cloudShade, config, heightField }) {
  const uniforms = useMemo(
    () => ({
      color: uniform(new THREE.Color(config.waterColor)),
      opacity: uniform(config.waterOpacity),
      rippleScale: uniform(config.rippleScale),
      rippleSpeed: uniform(config.rippleSpeed),
      rippleStrength: uniform(config.rippleStrength),
      waterLine: uniform(config.waterLevel),
    }),
    []
  );

  useEffect(() => {
    uniforms.color.value.set(config.waterColor);
    uniforms.opacity.value = config.waterOpacity;
    uniforms.rippleScale.value = config.rippleScale;
    uniforms.rippleSpeed.value = config.rippleSpeed;
    uniforms.rippleStrength.value = config.rippleStrength;
    uniforms.waterLine.value = config.waterLevel;
  }, [
    config.rippleScale,
    config.rippleSpeed,
    config.rippleStrength,
    config.waterColor,
    config.waterLevel,
    config.waterOpacity,
    uniforms,
  ]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardNodeMaterial({
      metalness: 0,
      roughness: 0.12,
      transparent: true,
    });

    // Ripple normals from finite differences of a drifting noise field.
    const p = vec3(
      positionWorld.x.mul(uniforms.rippleScale),
      positionWorld.z.mul(uniforms.rippleScale),
      time.mul(uniforms.rippleSpeed)
    );
    const e = 0.12;
    const dx = mx_noise_float(p.add(vec3(e, 0, 0))).sub(
      mx_noise_float(p.sub(vec3(e, 0, 0)))
    );
    const dz = mx_noise_float(p.add(vec3(0, e, 0))).sub(
      mx_noise_float(p.sub(vec3(0, e, 0)))
    );
    mat.normalNode = transformNormalToView(
      vec3(
        dx.mul(uniforms.rippleStrength).negate(),
        dz.mul(uniforms.rippleStrength).negate(),
        1
      ).normalize()
    );

    // True water depth from the shared heightfield (plane uvs match the
    // terrain's world mapping, so field.r is the carved bed height here).
    const bed = texture(heightField.texture, uv()).r;
    const depth = uniforms.waterLine.sub(bed).max(0);

    // Deep letter floors darken toward a sunken version of the water color.
    const depthShade = smoothstep(0.05, 0.9, depth);
    const deepColor = uniforms.color.mul(vec3(0.35, 0.45, 0.5));
    const body = mix(uniforms.color, deepColor, depthShade);

    // Foam ring where the bed nears the surface: a noisy lapping edge plus a
    // fainter second band pulsing just outside it.
    const foamWobble = mx_noise_float(
      vec3(positionWorld.x.mul(5), positionWorld.z.mul(5), time.mul(0.45))
    ).mul(0.06);
    const shore = depth.add(foamWobble);
    const foamEdge = smoothstep(0.16, 0.02, shore);
    const lap = time.mul(1.4).add(positionWorld.x.mul(2.1)).sin().mul(0.02);
    const foamBand = smoothstep(0.3, 0.22, shore.add(lap)).mul(
      smoothstep(0.16, 0.24, shore)
    );
    const foam = foamEdge.add(foamBand.mul(0.35)).clamp(0, 1);

    const foamed = mix(
      body,
      vec3(FOAM_COLOR.r, FOAM_COLOR.g, FOAM_COLOR.b),
      foam.mul(0.85)
    );
    mat.colorNode = foamed.mul(cloudShade(positionWorld.xz));

    // Foam reads more solid; deep water slightly more opaque too.
    mat.opacityNode = uniforms.opacity
      .add(foam.mul(0.3))
      .add(depthShade.mul(0.1))
      .min(1);

    return mat;
  }, [cloudShade, heightField.texture, uniforms]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      material={material}
      position-y={config.waterLevel}
      receiveShadow
      rotation-x={-Math.PI / 2}
    >
      <planeGeometry
        args={[heightField.worldSize * 0.999, heightField.worldSize * 0.999]}
      />
    </mesh>
  );
}

export default memo(Water);
