import {
  Fn,
  abs,
  clamp,
  cos,
  dot,
  float,
  floor,
  fract,
  mix,
  positionLocal,
  pow,
  sin,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const DEFAULT_MOTION = {
  baseSpeed: 1.15,
  minSpeed: 0.28,
  slowFreq: 0.7,
  slowAmp: 0.55,
  fastFreq: 2.6,
  fastAmp: 0.25,
  microFreq: 5.7,
  microAmp: 0.08,
  swayX: 0.015,
  swayZ: 0.014,
  pulseFreq: 3.4,
  pulseAmp: 0.04,
  scaleX: 1,
  scaleY: 1,
};

const random2 = Fn(([stInput]) => {
  const st = vec2(stInput).toVar();
  return fract(sin(dot(st, vec2(12.9898, 78.233))).mul(43758.5453123));
}).setLayout({
  name: 'flameRandom2',
  type: 'float',
  inputs: [{ name: 'stInput', type: 'vec2' }],
});

const noise2 = Fn(([stInput]) => {
  const st = vec2(stInput).toVar();
  const cell = floor(st).toVar();
  const fractPart = fract(st).toVar();
  const a = random2(cell).toVar();
  const b = random2(cell.add(vec2(1.0, 0.0))).toVar();
  const c = random2(cell.add(vec2(0.0, 1.0))).toVar();
  const d = random2(cell.add(vec2(1.0, 1.0))).toVar();
  const u = fractPart
    .mul(fractPart)
    .mul(vec2(3.0, 3.0).sub(fractPart.mul(2.0)))
    .toVar();

  return mix(a, b, u.x)
    .add(c.sub(a).mul(u.y).mul(float(1.0).sub(u.x)))
    .add(d.sub(b).mul(u.x).mul(u.y));
}).setLayout({
  name: 'flameNoise2',
  type: 'float',
  inputs: [{ name: 'stInput', type: 'vec2' }],
});

function createFlameNodeMaterial(side) {
  const uniforms = {
    time: uniform(0),
  };

  const localPosition = positionLocal;
  const flameUv = uv();
  const hValue = localPosition.y;
  const baseScale = vec3(0.8, 2.0, 0.725);
  const basePosition = localPosition.mul(baseScale);
  const posXZLength = localPosition.xz.length();
  const verticalNoise = cos(posXZLength.add(0.25).mul(Math.PI))
    .mul(0.25)
    .add(noise2(vec2(0.0, uniforms.time)).mul(0.125))
    .add(
      noise2(
        vec2(
          localPosition.x.add(uniforms.time),
          localPosition.z.add(uniforms.time)
        )
      ).mul(0.5)
    );
  const posY = basePosition.y.mul(
    float(1.0).add(verticalNoise.mul(localPosition.y))
  );

  const signedNoiseX = noise2(
    vec2(uniforms.time.mul(2.0), localPosition.y.sub(uniforms.time).mul(4.0))
  )
    .mul(2.0)
    .sub(1.0);
  const signedNoiseZ = noise2(
    vec2(localPosition.y.sub(uniforms.time).mul(4.0), uniforms.time.mul(2.0))
  )
    .mul(2.0)
    .sub(1.0);
  const bendEnvelope = pow(clamp(hValue, 0.0, 1.0), 1.2);
  const scoopCycle = sin(uniforms.time.mul(0.48));
  const scoopCrossCycle = sin(uniforms.time.mul(0.36).add(1.8));
  const driftX = sin(uniforms.time.mul(0.72).add(hValue.mul(6.2))).mul(0.012);
  const driftZ = cos(uniforms.time.mul(0.58).add(hValue.mul(5.1)).add(1.2)).mul(
    0.01
  );
  const posX = basePosition.x.add(
    scoopCycle
      .mul(0.05)
      .add(signedNoiseX.mul(0.016))
      .add(driftX)
      .mul(bendEnvelope)
  );
  const posZ = basePosition.z.add(
    scoopCrossCycle
      .mul(0.026)
      .add(signedNoiseZ.mul(0.014))
      .add(driftZ)
      .mul(bendEnvelope)
  );

  const center = abs(flameUv.x.sub(0.5)).mul(2.0);
  const radialFalloff = float(1.0).sub(center);
  const heightMask = smoothstep(0.02, 0.16, hValue).mul(
    float(1.0).sub(smoothstep(0.93, 1.02, hValue))
  );
  const taperedWidth = mix(0.62, 0.12, smoothstep(0.02, 0.98, hValue));
  const edgeNoise = noise2(
    vec2(
      center.mul(5.0).add(uniforms.time.mul(0.35)),
      hValue.mul(6.5).sub(uniforms.time.mul(1.8))
    )
  );
  const edgeMask = float(1.0).sub(
    smoothstep(
      taperedWidth,
      taperedWidth.add(0.18).add(edgeNoise.mul(0.08)),
      center
    )
  );
  const alpha = heightMask.mul(edgeMask);

  const blueBase = float(1.0)
    .sub(smoothstep(0.0, 0.12, hValue))
    .mul(smoothstep(0.18, 0.95, radialFalloff));
  const innerCore = smoothstep(0.08, 0.22, hValue)
    .mul(float(1.0).sub(smoothstep(0.34, 0.72, hValue)))
    .mul(smoothstep(0.28, 0.98, radialFalloff));
  const warmBody = smoothstep(0.04, 0.34, hValue).mul(
    float(1.0).sub(smoothstep(0.74, 1.0, hValue))
  );
  const emberTip = smoothstep(0.78, 1.0, hValue).mul(
    smoothstep(0.08, 0.65, center)
  );

  const outerColor = mix(
    vec3(1.0, 0.36, 0.05),
    vec3(1.0, 0.78, 0.22),
    smoothstep(0.08, 0.58, hValue)
  );
  const blueColor = vec3(0.08, 0.18, 1.0).mul(blueBase).mul(0.95);
  const warmColor = vec3(1.0, 0.54, 0.1)
    .mul(warmBody)
    .mul(radialFalloff)
    .mul(0.18);
  const shimmer = noise2(
    vec2(
      flameUv.x.mul(7.0).sub(uniforms.time.mul(0.9)),
      hValue.mul(5.5).add(uniforms.time.mul(0.6))
    )
  )
    .mul(0.16)
    .add(0.92);

  let color = outerColor.add(blueColor);
  color = mix(color, vec3(1.0, 0.98, 0.93), innerCore);
  color = color.add(warmColor);
  color = mix(color, vec3(0.92, 0.28, 0.04), emberTip.mul(0.35));
  color = color.mul(shimmer);
  const opacity = alpha.mul(float(0.92).add(innerCore.mul(0.08)));

  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side,
  });

  material.positionNode = vec3(posX, posY, posZ);
  material.colorNode = color;
  material.opacityNode = opacity;
  material.uniforms = uniforms;

  return material;
}

export default function FlameGPU({
  position = [0, 0, 0],
  inverted = false,
  motion,
  phaseOffset = 0,
}) {
  const flameMotion = { ...DEFAULT_MOTION, ...motion };
  const groupRef = useRef();
  const phaseRef = useRef(0);
  const flameGeometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    geometry.translate(0, 0.5, 0);
    return geometry;
  }, []);
  const frontMaterial = useMemo(
    () => createFlameNodeMaterial(THREE.FrontSide),
    []
  );
  const backMaterial = useMemo(
    () => createFlameNodeMaterial(THREE.BackSide),
    []
  );

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime() + phaseOffset;
    const speed =
      flameMotion.baseSpeed +
      Math.sin(t * flameMotion.slowFreq) * flameMotion.slowAmp +
      Math.sin(t * flameMotion.fastFreq + 1.4) * flameMotion.fastAmp +
      Math.sin(t * flameMotion.microFreq) * flameMotion.microAmp;

    phaseRef.current += delta * Math.max(flameMotion.minSpeed, speed);
    frontMaterial.uniforms.time.value = phaseRef.current;
    backMaterial.uniforms.time.value = phaseRef.current;

    if (groupRef.current) {
      const swayX = Math.sin(t * 3.2) * flameMotion.swayX;
      const swayZ = Math.cos(t * 2.4 + 0.8) * flameMotion.swayZ;
      groupRef.current.rotation.x = (inverted ? Math.PI : 0) + swayX;
      groupRef.current.rotation.z = swayZ;

      const pulse =
        1 +
        Math.sin(phaseRef.current * flameMotion.pulseFreq) *
          flameMotion.pulseAmp;
      groupRef.current.scale.set(
        flameMotion.scaleX,
        pulse * flameMotion.scaleY,
        flameMotion.scaleX
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      <mesh
        rotation-y={THREE.MathUtils.degToRad(-45)}
        geometry={flameGeometry}
        material={frontMaterial}
      />
      <mesh
        rotation-y={THREE.MathUtils.degToRad(-45)}
        geometry={flameGeometry}
        material={backMaterial}
      />
    </group>
  );
}
