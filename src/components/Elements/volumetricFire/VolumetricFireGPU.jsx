/* eslint-disable no-underscore-dangle */
import {
  Fn,
  If,
  Loop,
  attribute,
  dot,
  float,
  floor,
  fract,
  int,
  mix,
  mod,
  smoothstep,
  texture as tslTexture,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  GUIDE_POINTS,
  VolumetricFireMesh,
  fillControlPoints,
  getFireProfileTexture,
  getNoiseTexture,
  makeControlPointPool,
} from './volumetricFireShared';

const LUMINANCE = vec3(0.2126, 0.7152, 0.0722);
const NOISE_MODULUS = float(61.0);
const DEFAULT_NOISE_SCALE = new THREE.Vector4(1.0, 2.0, 1.0, 0.3);

function createSliceMaterial(uniforms, noiseTexture, fireProfileTexture) {
  const texCoord = attribute('tex', 'vec3').toVarying('vVolumetricFireTex');

  const mBBS = Fn(([valueInput, modulusInput]) => {
    const wrapped = mod(valueInput, modulusInput).toVar();

    return mod(wrapped.mul(wrapped), modulusInput);
  });

  const mnoise = Fn(([posInput]) => {
    const intArg = floor(posInput.z).toVar();
    const fracArg = fract(posInput.z).toVar();
    const hash = mBBS(
      vec2(intArg.mul(3.0), intArg.mul(3.0).add(3.0)),
      NOISE_MODULUS
    ).toVar();
    const g0 = tslTexture(
      noiseTexture,
      vec2(posInput.x, posInput.y.add(hash.x)).div(NOISE_MODULUS)
    )
      .xy.mul(2.0)
      .sub(1.0)
      .toVar();
    const g1 = tslTexture(
      noiseTexture,
      vec2(posInput.x, posInput.y.add(hash.y)).div(NOISE_MODULUS)
    )
      .xy.mul(2.0)
      .sub(1.0)
      .toVar();

    return mix(
      g0.x.add(g0.y.mul(fracArg)),
      g1.x.add(g1.y.mul(fracArg.sub(1.0))),
      smoothstep(0.0, 1.0, fracArg)
    );
  });

  const turbulence = Fn(([posInput]) => {
    const sum = float(0).toVar();
    const freq = float(1).toVar();
    const amp = float(1).toVar();

    Loop({ start: int(0), end: int(4), type: 'int', condition: '<' }, () => {
      sum.addAssign(mnoise(posInput.mul(freq)).abs().mul(amp));
      freq.mulAssign(uniforms.lacunarity);
      amp.mulAssign(uniforms.gain);
    });

    return sum;
  });

  const sampleFire = Fn(() => {
    const locXZ = texCoord.xz.mul(2.0).sub(1.0).toVar();
    const st = vec2(dot(locXZ, locXZ).sqrt(), texCoord.y).toVar();
    const sampleLoc = vec3(
      locXZ.x,
      texCoord.y.sub(uniforms.time.mul(uniforms.noiseScale.w)),
      locXZ.y
    ).toVar();

    sampleLoc.mulAssign(uniforms.noiseScale.xyz);

    const offset = st.y
      .sqrt()
      .mul(uniforms.magnitude)
      .mul(turbulence(sampleLoc))
      .toVar();

    st.y.addAssign(offset);

    const result = vec4(0.0, 0.0, 0.0, 0.0).toVar();

    If(st.y.lessThanEqual(1.0), () => {
      result.assign(tslTexture(fireProfileTexture, st));

      If(st.y.lessThan(0.1), () => {
        result.mulAssign(st.y.div(0.1));
      });
    });

    return result;
  });

  const sampledFire = sampleFire().toVar();
  const tinted = sampledFire.rgb
    .mul(uniforms.colorTint)
    .mul(uniforms.brightness)
    .toVar();
  const luminance = dot(tinted, LUMINANCE).toVar();
  const saturated = mix(
    vec3(luminance, luminance, luminance),
    tinted,
    uniforms.saturation
  );

  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  material.colorNode = saturated;
  material.opacityNode = sampledFire.a;
  material.uniforms = uniforms;

  return material;
}

export default function VolumetricFireGPU({
  position = [0, 0, 0],
  inverted = false,
  width = 0.35,
  height = 1.0,
  depth = 0.35,
  sliceSpacing = 0.05,
  segments = 24,
  bendX = 0,
  bendZ = 0,
  animated = true,
  animSpeed = 0.5,
  showSpline = false,
  showVolume = false,
  magnitude = 1.3,
  lacunarity = 2.0,
  gain = 0.5,
  tintColor = '#ffffff',
  saturation = 1.0,
  brightness = 1.5,
  controlPoints = null,
}) {
  const { camera } = useThree();
  const animTimeRef = useRef(0);
  const baseBendRef = useRef({ x: bendX, z: bendZ });
  const cpPoolRef = useRef(null);

  if (!cpPoolRef.current) {
    cpPoolRef.current = makeControlPointPool(5);
  }

  const noiseTexture = useMemo(() => getNoiseTexture(), []);
  const fireProfileTexture = useMemo(() => getFireProfileTexture(), []);

  const uniforms = useMemo(
    () => ({
      time: uniform(0),
      magnitude: uniform(magnitude),
      lacunarity: uniform(lacunarity),
      gain: uniform(gain),
      noiseScale: uniform(DEFAULT_NOISE_SCALE.clone()),
      colorTint: uniform(new THREE.Color(tintColor)),
      saturation: uniform(saturation),
      brightness: uniform(brightness),
    }),
    []
  );

  const fire = useMemo(() => {
    const mesh = new VolumetricFireMesh({
      width,
      height,
      depth,
      sliceSpacing,
      segments,
      camera,
      textureNoise: noiseTexture,
      textureProfile: fireProfileTexture,
    });
    const originalMaterial = mesh.material;

    mesh.material = createSliceMaterial(
      uniforms,
      noiseTexture,
      fireProfileTexture
    );
    originalMaterial.dispose();

    return mesh;
  }, [
    camera,
    depth,
    fireProfileTexture,
    height,
    noiseTexture,
    segments,
    sliceSpacing,
    uniforms,
    width,
  ]);

  const guideGeo = useMemo(() => {
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(GUIDE_POINTS * 3), 3)
    );

    return geometry;
  }, []);

  useEffect(() => {
    noiseTexture.colorSpace = THREE.NoColorSpace;
    noiseTexture.needsUpdate = true;
    fireProfileTexture.colorSpace = THREE.NoColorSpace;
    fireProfileTexture.needsUpdate = true;
  }, [fireProfileTexture, noiseTexture]);

  useEffect(() => {
    fire.material.uniforms.magnitude.value = magnitude;
    fire.material.uniforms.lacunarity.value = lacunarity;
    fire.material.uniforms.gain.value = gain;
  }, [fire, gain, lacunarity, magnitude]);

  useEffect(() => {
    fire.material.uniforms.colorTint.value.set(tintColor);
  }, [fire, tintColor]);

  useEffect(() => {
    fire.material.uniforms.saturation.value = saturation;
    fire.material.uniforms.brightness.value = brightness;
  }, [brightness, fire, saturation]);

  useEffect(() => {
    fire._sliceSpacing = sliceSpacing;
  }, [fire, sliceSpacing]);

  useEffect(() => {
    fire.setShowVolume(showVolume);
  }, [fire, showVolume]);

  useEffect(() => {
    baseBendRef.current = { x: bendX, z: bendZ };
  }, [bendX, bendZ]);

  useEffect(
    () => () => {
      fire.geometry.dispose();
      fire.material.dispose();
    },
    [fire]
  );

  useEffect(() => () => guideGeo.dispose(), [guideGeo]);

  useFrame(({ clock }, delta) => {
    if (controlPoints) {
      fire.setControlPoints(controlPoints);
    } else {
      let bx = baseBendRef.current.x;
      let bz = baseBendRef.current.z;

      if (animated) {
        animTimeRef.current += delta * animSpeed;
        const t = animTimeRef.current;

        bx += Math.sin(t * 0.8) * 0.14 + Math.sin(t * 2.1 + 0.5) * 0.04;
        bz += Math.cos(t * 0.65 + 1.2) * 0.07 + Math.cos(t * 1.7) * 0.03;
      }

      fillControlPoints(cpPoolRef.current, height, width, depth, bx, bz);
      fire.setControlPoints(cpPoolRef.current);
    }

    fire.update(clock.getElapsedTime());

    if (showSpline) {
      const curve = fire._posCurve;

      if (curve?.points?.length > 1) {
        const points = curve.getPoints(GUIDE_POINTS - 1);
        const positionAttr = guideGeo.attributes.position;

        for (let index = 0; index < points.length; index += 1) {
          positionAttr.setXYZ(
            index,
            points[index].x,
            points[index].y,
            points[index].z
          );
        }

        positionAttr.needsUpdate = true;
      }
    }
  });

  const halfH = controlPoints ? 0 : height / 2;

  return (
    <group
      position={position}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      <group position={[0, halfH, 0]}>
        <primitive object={fire} />
        {showSpline && (
          <line geometry={guideGeo}>
            <lineBasicMaterial color={0x44aaff} transparent opacity={0.7} />
          </line>
        )}
      </group>
    </group>
  );
}
