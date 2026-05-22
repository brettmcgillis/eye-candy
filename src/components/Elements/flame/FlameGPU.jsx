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

import {
  FLAME_DEFAULT_MOTION,
  FLAME_SHADER_CONSTANTS,
  FLAME_Y_ROTATION,
  createFlameGeometry,
} from './flameShared';

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
  const {
    alpha: alphaConstants,
    baseScale,
    bend,
    color: colorConstants,
    opacity: opacityConstants,
    shimmer: shimmerConstants,
    vertical,
  } = FLAME_SHADER_CONSTANTS;
  const uniforms = {
    time: uniform(0),
  };

  const localPosition = positionLocal;
  const flameUv = uv().toVarying('vFlameUv');
  const hValue = localPosition.y.toVarying('vFlameHeight');
  const basePosition = localPosition.mul(vec3(...baseScale));
  const posXZLength = localPosition.xz.length();
  const verticalNoise = cos(
    posXZLength.add(vertical.cosOffset).mul(vertical.pi)
  )
    .mul(vertical.cosAmp)
    .add(noise2(vec2(0.0, uniforms.time)).mul(vertical.staticNoiseAmp))
    .add(
      noise2(
        vec2(
          localPosition.x.add(uniforms.time),
          localPosition.z.add(uniforms.time)
        )
      ).mul(vertical.flowNoiseAmp)
    );
  const posY = basePosition.y.mul(
    float(1.0).add(verticalNoise.mul(localPosition.y))
  );

  const signedNoiseX = noise2(
    vec2(
      uniforms.time.mul(bend.timeScale),
      localPosition.y.sub(uniforms.time).mul(bend.heightScale)
    )
  )
    .mul(2.0)
    .sub(1.0);
  const signedNoiseZ = noise2(
    vec2(
      localPosition.y.sub(uniforms.time).mul(bend.heightScale),
      uniforms.time.mul(bend.timeScale)
    )
  )
    .mul(2.0)
    .sub(1.0);
  const bendEnvelope = pow(clamp(hValue, 0.0, 1.0), bend.power);
  const scoopCycle = sin(uniforms.time.mul(bend.scoopFreq));
  const scoopCrossCycle = sin(
    uniforms.time.mul(bend.scoopCrossFreq).add(bend.scoopCrossPhase)
  );
  const driftX = sin(
    uniforms.time.mul(bend.driftXFreq).add(hValue.mul(bend.driftXHeightFreq))
  ).mul(bend.driftXAmp);
  const driftZ = cos(
    uniforms.time
      .mul(bend.driftZFreq)
      .add(hValue.mul(bend.driftZHeightFreq))
      .add(bend.driftZPhase)
  ).mul(bend.driftZAmp);
  const posX = basePosition.x.add(
    scoopCycle
      .mul(bend.scoopAmp)
      .add(signedNoiseX.mul(bend.signedNoiseXAmp))
      .add(driftX)
      .mul(bendEnvelope)
  );
  const posZ = basePosition.z.add(
    scoopCrossCycle
      .mul(bend.scoopCrossAmp)
      .add(signedNoiseZ.mul(bend.signedNoiseZAmp))
      .add(driftZ)
      .mul(bendEnvelope)
  );

  const center = abs(flameUv.x.sub(0.5)).mul(2.0);
  const radialFalloff = float(1.0).sub(center);
  const heightMask = smoothstep(
    alphaConstants.heightStart,
    alphaConstants.heightPeak,
    hValue
  ).mul(
    float(1.0).sub(
      smoothstep(alphaConstants.tipFadeStart, alphaConstants.tipFadeEnd, hValue)
    )
  );
  const taperedWidth = mix(
    alphaConstants.widthBase,
    alphaConstants.widthTip,
    smoothstep(
      alphaConstants.widthTaperStart,
      alphaConstants.widthTaperEnd,
      hValue
    )
  );
  const edgeNoise = noise2(
    vec2(
      center
        .mul(alphaConstants.edgeNoiseXScale)
        .add(uniforms.time.mul(alphaConstants.edgeNoiseTimeScale)),
      hValue
        .mul(alphaConstants.edgeNoiseYScale)
        .sub(uniforms.time.mul(alphaConstants.edgeNoiseTimeSpeed))
    )
  );
  const edgeMask = float(1.0).sub(
    smoothstep(
      taperedWidth,
      taperedWidth
        .add(alphaConstants.edgeSoftness)
        .add(edgeNoise.mul(alphaConstants.edgeNoiseAmp)),
      center
    )
  );
  const alphaMask = heightMask.mul(edgeMask);

  const blueBase = float(1.0)
    .sub(
      smoothstep(
        colorConstants.blueBaseFadeStart,
        colorConstants.blueBaseFadeEnd,
        hValue
      )
    )
    .mul(
      smoothstep(
        colorConstants.blueBaseRadialStart,
        colorConstants.blueBaseRadialEnd,
        radialFalloff
      )
    );
  const innerCore = smoothstep(
    colorConstants.innerCoreHeightStart,
    colorConstants.innerCoreHeightPeak,
    hValue
  )
    .mul(
      float(1.0).sub(
        smoothstep(
          colorConstants.innerCoreFadeStart,
          colorConstants.innerCoreFadeEnd,
          hValue
        )
      )
    )
    .mul(
      smoothstep(
        colorConstants.innerCoreRadialStart,
        colorConstants.innerCoreRadialEnd,
        radialFalloff
      )
    );
  const warmBody = smoothstep(
    colorConstants.warmBodyStart,
    colorConstants.warmBodyEnd,
    hValue
  ).mul(
    float(1.0).sub(
      smoothstep(
        colorConstants.warmBodyFadeStart,
        colorConstants.warmBodyFadeEnd,
        hValue
      )
    )
  );
  const emberTip = smoothstep(
    colorConstants.emberTipStart,
    colorConstants.emberTipEnd,
    hValue
  ).mul(
    smoothstep(
      colorConstants.emberCenterStart,
      colorConstants.emberCenterEnd,
      center
    )
  );

  const outerColor = mix(
    vec3(...colorConstants.outerLow),
    vec3(...colorConstants.outerHigh),
    smoothstep(colorConstants.outerMixStart, colorConstants.outerMixEnd, hValue)
  );
  const blueColor = vec3(...colorConstants.blue)
    .mul(blueBase)
    .mul(colorConstants.blueScale);
  const warmColor = vec3(...colorConstants.warm)
    .mul(warmBody)
    .mul(radialFalloff)
    .mul(colorConstants.warmScale);
  const shimmerNode = noise2(
    vec2(
      flameUv.x
        .mul(shimmerConstants.xScale)
        .sub(uniforms.time.mul(shimmerConstants.timeScale)),
      hValue
        .mul(shimmerConstants.yScale)
        .add(uniforms.time.mul(shimmerConstants.timeSpeed))
    )
  )
    .mul(shimmerConstants.amp)
    .add(shimmerConstants.base);

  let flameColor = outerColor.add(blueColor);
  flameColor = mix(flameColor, vec3(...colorConstants.core), innerCore);
  flameColor = flameColor.add(warmColor);
  flameColor = mix(
    flameColor,
    vec3(...colorConstants.ember),
    emberTip.mul(colorConstants.emberMix)
  );
  flameColor = flameColor.mul(shimmerNode);
  const flameOpacity = alphaMask.mul(
    float(opacityConstants.base).add(
      innerCore.mul(opacityConstants.innerCoreBoost)
    )
  );

  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.NormalBlending,
    side,
  });

  material.positionNode = vec3(posX, posY, posZ);
  material.colorNode = flameColor;
  material.opacityNode = flameOpacity;
  material.uniforms = uniforms;

  return material;
}

export default function FlameGPU({
  position = [0, 0, 0],
  inverted = false,
  motion,
  phaseOffset = 0,
}) {
  const flameMotion = { ...FLAME_DEFAULT_MOTION, ...motion };
  const groupRef = useRef();
  const phaseRef = useRef(0);
  const flameGeometry = useMemo(() => createFlameGeometry(THREE), []);
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
        rotation-y={FLAME_Y_ROTATION}
        geometry={flameGeometry}
        material={frontMaterial}
      />
      <mesh
        rotation-y={FLAME_Y_ROTATION}
        geometry={flameGeometry}
        material={backMaterial}
      />
    </group>
  );
}
